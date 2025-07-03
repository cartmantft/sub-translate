import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  // Sign out
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    logger.error('Signout error', error, { action: 'signout' })
  }
  
  // Create response
  const response = NextResponse.json({ success: true })
  
  // Get all cookies and clear Supabase-related ones
  const allCookies = cookieStore.getAll()
  
  allCookies.forEach(cookie => {
    // Clear all Supabase-related cookies
    if (cookie.name.includes('sb-') || 
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth-token')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    }
  })
  
  // Also clear common auth cookie patterns
  const authCookiePatterns = [
    'sb-access-token',
    'sb-refresh-token',
    'sb-auth-token',
    'supabase-auth-token',
  ]
  
  authCookiePatterns.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  })
  
  return response
}