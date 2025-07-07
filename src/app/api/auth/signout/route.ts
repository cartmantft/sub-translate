import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  try {
    // Sign out from Supabase with scope 'local' to clear all sessions
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
    if (error) {
      logger.error('Supabase signout error', error, { action: 'signout' })
    } else {
      logger.info('User signed out successfully', { action: 'signout' })
    }
    
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Get all cookies and clear Supabase-related ones
    const allCookies = cookieStore.getAll()
    
    allCookies.forEach(cookie => {
      // Clear all Supabase-related cookies with comprehensive pattern matching
      if (cookie.name.includes('sb-') || 
          cookie.name.includes('supabase') ||
          cookie.name.includes('auth-token') ||
          cookie.name.includes('pkce') ||
          cookie.name.includes('oauth')) {
        response.cookies.set(cookie.name, '', {
          path: '/',
          domain: process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_DOMAIN || undefined 
            : undefined,
          maxAge: 0,
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax'
        })
        logger.debug('Cleared cookie', { cookieName: cookie.name, action: 'signout' })
      }
    })
    
    // Also clear common auth cookie patterns with enhanced coverage
    const authCookiePatterns = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
      'supabase.auth.token',
      'supabase_auth_token',
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      'auth-token',
      'session',
      'access_token',
      'refresh_token'
    ]
    
    authCookiePatterns.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_DOMAIN || undefined 
          : undefined,
        maxAge: 0,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      })
    })
    
    // Clear session-related cookies for both root and subdomain
    const sessionCookieNames = ['session', 'auth-token', 'supabase-auth-token']
    sessionCookieNames.forEach(cookieName => {
      // Clear for current domain
      response.cookies.set(cookieName, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      })
      
      // Clear for subdomain if in production
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DOMAIN) {
        response.cookies.set(cookieName, '', {
          path: '/',
          domain: `.${process.env.NEXT_PUBLIC_DOMAIN}`,
          maxAge: 0,
          expires: new Date(0),
          secure: true,
          httpOnly: true,
          sameSite: 'lax'
        })
      }
    })
    
    return response
  } catch (error) {
    logger.error('Unexpected error during signout', error, { action: 'signout' })
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json({ success: false, error: 'Signout failed' }, { status: 500 })
    
    // Force clear critical cookies
    const criticalCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'session']
    criticalCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_DOMAIN || undefined : undefined,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      })
    })
    
    return response
  }
}