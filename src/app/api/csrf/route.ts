/**
 * CSRF Token Generation API Endpoint
 * 
 * This endpoint generates secure CSRF tokens for client-side use.
 * It sets the token in a secure HTTP-only cookie and returns it
 * in the response for immediate use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createCsrfTokenData, 
  CSRF_COOKIE_CONFIG,
  CSRF_ERRORS 
} from '@/lib/utils/csrf'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/csrf
 * 
 * Generates a new CSRF token and sets it in a secure cookie.
 * Returns the token in the response body for immediate use by the client.
 * 
 * @param request - The incoming request
 * @returns JSON response containing the CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    // Generate new CSRF token with expiration
    const tokenData = createCsrfTokenData()
    
    // Create response with token
    const response = NextResponse.json({
      csrfToken: tokenData.token,
      expires: tokenData.expires
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    // Set secure cookie with token data
    // Store the complete token data (token + expiration) as JSON
    const cookieValue = JSON.stringify(tokenData)
    
    response.cookies.set({
      name: CSRF_COOKIE_CONFIG.name,
      value: cookieValue,
      httpOnly: CSRF_COOKIE_CONFIG.httpOnly,
      secure: CSRF_COOKIE_CONFIG.secure,
      sameSite: CSRF_COOKIE_CONFIG.sameSite,
      maxAge: CSRF_COOKIE_CONFIG.maxAge,
      path: CSRF_COOKIE_CONFIG.path
    })

    logger.debug('CSRF token generated successfully', {
      component: 'CSRFEndpoint',
      action: 'generate_token',
      expires: new Date(tokenData.expires).toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    return response

  } catch (error) {
    logger.error('Failed to generate CSRF token', error, {
      component: 'CSRFEndpoint',
      action: 'generate_token_error',
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    return NextResponse.json({
      error: 'Failed to generate CSRF token',
      code: 'CSRF_GENERATION_FAILED'
    }, {
      status: 500
    })
  }
}

/**
 * POST /api/csrf
 * 
 * Validates a CSRF token submitted by the client.
 * This can be used for explicit token validation before sensitive operations.
 * 
 * @param request - The incoming request with CSRF token
 * @returns JSON response indicating validation result
 */
export async function POST(request: NextRequest) {
  try {
    const { token: submittedToken } = await request.json()
    
    if (!submittedToken) {
      return NextResponse.json({
        valid: false,
        error: CSRF_ERRORS.MISSING_TOKEN
      }, { status: 400 })
    }

    // Get stored token from cookie
    const cookieValue = request.cookies.get(CSRF_COOKIE_CONFIG.name)?.value
    
    if (!cookieValue) {
      return NextResponse.json({
        valid: false,
        error: CSRF_ERRORS.MISSING_TOKEN
      }, { status: 400 })
    }

    // Parse stored token data
    let storedTokenData
    try {
      storedTokenData = JSON.parse(cookieValue)
    } catch {
      return NextResponse.json({
        valid: false,
        error: CSRF_ERRORS.MALFORMED_TOKEN
      }, { status: 400 })
    }

    // Validate token
    const isValid = await validateCsrfToken(submittedToken, storedTokenData)
    
    if (!isValid) {
      logger.warn('CSRF token validation failed', undefined, {
        component: 'CSRFEndpoint',
        action: 'validate_token_failed',
        reason: Date.now() > storedTokenData.expires ? 'expired' : 'invalid',
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })

      return NextResponse.json({
        valid: false,
        error: Date.now() > storedTokenData.expires 
          ? CSRF_ERRORS.EXPIRED_TOKEN 
          : CSRF_ERRORS.INVALID_TOKEN
      }, { status: 403 })
    }

    logger.debug('CSRF token validated successfully', {
      component: 'CSRFEndpoint',
      action: 'validate_token_success',
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    return NextResponse.json({
      valid: true
    })

  } catch (error) {
    logger.error('CSRF token validation error', error, {
      component: 'CSRFEndpoint',
      action: 'validate_token_error',
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    return NextResponse.json({
      error: 'Failed to validate CSRF token',
      code: 'CSRF_VALIDATION_FAILED'
    }, { status: 500 })
  }
}

// Import the validation function here to avoid import issues
import { validateCsrfToken } from '@/lib/utils/csrf'