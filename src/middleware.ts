import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip auth check for public routes
  const publicRoutes = ['/login', '/signup']
  const publicApiRoutes = ['/api/auth']
  const path = request.nextUrl.pathname
  
  // Check if it's a public route or public API route
  if (publicRoutes.includes(path) || publicApiRoutes.some(route => path.startsWith(route))) {
    return response
  }
  
  // 개발 환경에서는 홈페이지도 인증 확인 (자동 로그인 방지)
  const isHomePage = path === '/'
  const isDevelopment = process.env.NODE_ENV === 'development'

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
