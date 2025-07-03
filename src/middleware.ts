import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { csrfMiddleware } from '@/lib/middleware/csrf'

// Security headers configuration
const securityHeaders = {
  // Content Security Policy - restrictive but allows necessary external resources
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval for Next.js dev, unsafe-inline for inline scripts
    "style-src 'self' 'unsafe-inline'", // unsafe-inline for CSS-in-JS and inline styles
    "img-src 'self' data: blob: https:", // Allow images from self, data URLs, blobs, and HTTPS
    "font-src 'self' data:", // Allow fonts from self and data URLs
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com", // API endpoints
    "media-src 'self' blob: https:", // Allow media from self, blobs, and HTTPS
    "object-src 'none'", // Disable object/embed/applet
    "base-uri 'self'", // Restrict base URI
    "form-action 'self'", // Restrict form actions to same origin
    "frame-ancestors 'none'", // Prevent framing (clickjacking protection)
    "upgrade-insecure-requests" // Upgrade HTTP to HTTPS
  ].join('; '),
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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply CSRF protection to API routes
  const csrfResponse = await csrfMiddleware(request)
  if (csrfResponse) {
    // CSRF validation failed, return error response with security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      csrfResponse.headers.set(key, value)
    })
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
      return NextResponse.redirect(new URL('/login', request.url))
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
