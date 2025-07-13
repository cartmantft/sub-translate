import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { csrfMiddleware } from '@/lib/middleware/csrf'
import { validateUserStatus } from '@/lib/utils/user-validation'
import { logger } from '@/lib/utils/logger'
// Edge Runtime에서는 Web Crypto API 사용

// Generate CSP with environment-appropriate settings
function generateCSPWithNonce(nonce: string) {
  const cspParts = [
    "default-src 'self'",
    // Script src: nonce-based for production, relaxed for development
    process.env.NODE_ENV === 'production' 
      ? `script-src 'self' 'nonce-${nonce}'`
      : `script-src 'self' 'unsafe-eval' 'nonce-${nonce}'`, // unsafe-eval needed for Next.js dev mode
    // Style src: CSS-in-JS compatible approach
    // Note: When nonce is present, unsafe-inline is ignored per CSP spec
    // For CSS-in-JS compatibility, we use unsafe-inline without nonce in production
    process.env.NODE_ENV === 'production'
      ? `style-src 'self' 'unsafe-inline'` // CSS-in-JS and Tailwind compatibility
      : `style-src 'self' 'unsafe-inline'`, // Same for development
    "img-src 'self' data: blob: https:", // Allow images from self, data URLs, blobs, and HTTPS
    "font-src 'self' data:", // Allow fonts from self and data URLs
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com", // API endpoints
    "media-src 'self' blob: https:", // Allow media from self, blobs, and HTTPS
    "object-src 'none'", // Disable object/embed/applet
    "base-uri 'self'", // Restrict base URI
    "form-action 'self'", // Restrict form actions to same origin
    "frame-ancestors 'none'", // Prevent framing (clickjacking protection)
    "upgrade-insecure-requests" // Upgrade HTTP to HTTPS
  ]
  
  return cspParts.join('; ')
}

// Other security headers (non-CSP)
const staticSecurityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff', 
  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Force HTTPS (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  // Prevent DNS prefetching for privacy
  'X-DNS-Prefetch-Control': 'off',
  // Disable download prompts for unknown MIME types
  'X-Download-Options': 'noopen',
  // Prevent Microsoft Edge/IE from executing downloads in site context
  'X-Permitted-Cross-Domain-Policies': 'none'
}

export async function middleware(request: NextRequest) {
  // Generate a unique nonce for this request using Web Crypto API (Edge Runtime compatible)
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const nonce = btoa(String.fromCharCode(...array))
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Apply static security headers
  Object.entries(staticSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply dynamic CSP with nonce
  response.headers.set('Content-Security-Policy', generateCSPWithNonce(nonce))
  
  // Pass nonce to the page via custom header
  response.headers.set('X-Nonce', nonce)

  // Apply CSRF protection to API routes
  const csrfResponse = await csrfMiddleware(request)
  if (csrfResponse) {
    // CSRF validation failed, return error response with security headers
    Object.entries(staticSecurityHeaders).forEach(([key, value]) => {
      csrfResponse.headers.set(key, value)
    })
    csrfResponse.headers.set('Content-Security-Policy', generateCSPWithNonce(nonce))
    csrfResponse.headers.set('X-Nonce', nonce)
    return csrfResponse
  }

  // Skip auth check for public routes
  const publicRoutes = ['/login', '/signup']
  const publicApiRoutes = ['/api/auth']
  const path = request.nextUrl.pathname
  
  // Check if it's a public route or public API route
  if (publicRoutes.includes(path) || publicApiRoutes.some(route => path.startsWith(route))) {
    return response
  }
  

  // Only check auth for protected routes
  const protectedRoutes = ['/dashboard', '/projects']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  if (!isProtectedRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check session first
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && isProtectedRoute) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verify user only if session exists
  if (session && isProtectedRoute) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Session exists but user is invalid - clear and redirect
      logger.warn('Invalid session detected', {
        action: 'middleware_auth_check',
        path: request.nextUrl.pathname,
        reason: 'no_user_from_jwt'
      });
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Additional security check: validate user status in database
    const userStatus = await validateUserStatus(user.id);
    if (!userStatus.isValid) {
      // User is deleted, banned, or invalid - force logout
      logger.error('Security violation: Invalid user attempted access', {
        action: 'middleware_security_check',
        userId: user.id,
        path: request.nextUrl.pathname,
        reason: userStatus.reason,
        userAgent: request.headers.get('user-agent'),
        securityEvent: 'invalid_user_access_blocked'
      });

      // Create response that clears auth cookies and redirects
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      
      // Clear Supabase auth cookies for security
      const authCookiePatterns = [
        'sb-access-token',
        'sb-refresh-token', 
        'sb-auth-token',
        'supabase-auth-token',
        'auth-token'
      ];
      
      authCookiePatterns.forEach(cookieName => {
        redirectResponse.cookies.set(cookieName, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax'
        });
      });

      return redirectResponse;
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
