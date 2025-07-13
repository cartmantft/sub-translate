import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateRedirectWithLogging } from '@/lib/utils/url-validator'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'
  
  // SECURITY: Validate redirect URL to prevent Open Redirect attacks
  const safeRedirectPath = validateRedirectWithLogging(
    nextParam, 
    origin,
    {
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: 'oauth-callback',
      code: code ? '[PRESENT]' : '[MISSING]'
    }
  )

  if (code) {
    const supabase = await createClient();
    
    // Enhanced logging for OAuth debugging
    logger.info('OAuth callback received', {
      action: 'oauth-callback-start',
      component: 'auth-callback',
      codeLength: code.length,
      origin,
      nextParam,
      safeRedirectPath,
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown'
    })
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      // Log successful authentication with redirect info
      logger.info('OAuth callback successful', {
        action: 'oauth-success',
        component: 'auth-callback',
        redirectPath: safeRedirectPath,
        originalPath: nextParam !== safeRedirectPath ? nextParam : undefined,
        userId: data.user?.id,
        userEmail: data.user?.email
      })
      
      return NextResponse.redirect(`${origin}${safeRedirectPath}`)
    } else {
      // Enhanced error logging for OAuth exchange failure
      logger.error('OAuth code exchange failed', error, {
        action: 'oauth-exchange-failed',
        component: 'auth-callback',
        errorMessage: error?.message,
        errorCode: error?.status,
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        codeLength: code.length,
        origin,
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown'
      })
      
      // Add error details to redirect for debugging
      const errorParams = new URLSearchParams({
        error: 'oauth_exchange_failed',
        error_description: error?.message || 'Unknown OAuth error',
        error_code: error?.status?.toString() || 'unknown'
      })
      
      return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`)
    }
  } else {
    // Log missing OAuth code with request details
    logger.warn('OAuth callback missing authorization code', undefined, {
      action: 'oauth-missing-code',
      component: 'auth-callback',
      origin,
      fullUrl: request.url,
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown'
    })
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
