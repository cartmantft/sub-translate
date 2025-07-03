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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Log successful authentication with redirect info
      logger.info('OAuth callback successful', {
        action: 'oauth-success',
        redirectPath: safeRedirectPath,
        originalPath: nextParam !== safeRedirectPath ? nextParam : undefined
      })
      
      return NextResponse.redirect(`${origin}${safeRedirectPath}`)
    } else {
      // Log OAuth exchange failure
      logger.warn('OAuth code exchange failed', error, {
        action: 'oauth-failed',
        component: 'auth-callback'
      })
    }
  } else {
    // Log missing OAuth code
    logger.warn('OAuth callback missing authorization code', undefined, {
      action: 'oauth-missing-code',
      component: 'auth-callback'
    })
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
