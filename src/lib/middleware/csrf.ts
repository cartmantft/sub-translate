/**
 * CSRF Protection Middleware
 * 
 * This middleware validates CSRF tokens for state-changing HTTP requests
 * to prevent Cross-Site Request Forgery attacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateCsrfToken, 
  extractCsrfToken,
  CSRF_COOKIE_CONFIG,
  CSRF_ERRORS,
  type CsrfTokenData
} from '@/lib/utils/csrf'
import { logger } from '@/lib/utils/logger'

/**
 * HTTP methods that require CSRF protection
 * GET, HEAD, OPTIONS are generally safe and don't modify state
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

/**
 * API routes that are exempt from CSRF protection
 * These routes either generate tokens or handle special cases
 */
const CSRF_EXEMPT_ROUTES = [
  '/api/csrf', // CSRF token generation endpoint
  '/api/auth/callback', // OAuth callback (external redirects)
]

/**
 * Checks if a request requires CSRF protection
 * 
 * @param request - The incoming request
 * @returns True if CSRF protection is required
 */
function requiresCsrfProtection(request: NextRequest): boolean {
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Skip if method doesn't require protection
  if (!CSRF_PROTECTED_METHODS.includes(method)) {
    return false
  }

  // Skip if route is explicitly exempt
  if (CSRF_EXEMPT_ROUTES.some(route => pathname.startsWith(route))) {
    return false
  }

  // Require protection for all other API routes with state-changing methods
  return pathname.startsWith('/api/')
}

/**
 * Validates CSRF token from request against stored cookie
 * 
 * @param request - The incoming request
 * @returns Object containing validation result and error details
 */
async function validateRequestCsrfToken(request: NextRequest): Promise<{
  isValid: boolean
  error?: string
  errorCode?: string
}> {
  try {
    // Extract token from request (header or form data)
    const url = new URL(request.url)
    const submittedToken = extractCsrfToken(request.headers, url.searchParams)

    if (!submittedToken) {
      return {
        isValid: false,
        error: CSRF_ERRORS.MISSING_TOKEN,
        errorCode: 'CSRF_TOKEN_MISSING'
      }
    }

    // Get stored token from secure cookie
    const cookieValue = request.cookies.get(CSRF_COOKIE_CONFIG.name)?.value

    if (!cookieValue) {
      return {
        isValid: false,
        error: 'CSRF cookie not found. Please refresh the page and try again.',
        errorCode: 'CSRF_COOKIE_MISSING'
      }
    }

    // Parse stored token data (handle URL decoding if necessary)
    let storedTokenData: CsrfTokenData
    try {
      // Try to decode the cookie value in case it's URL encoded
      const decodedValue = decodeURIComponent(cookieValue)
      storedTokenData = JSON.parse(decodedValue)
    } catch {
      // If decoding fails, try parsing as-is
      try {
        storedTokenData = JSON.parse(cookieValue)
      } catch {
        return {
          isValid: false,
          error: CSRF_ERRORS.MALFORMED_TOKEN,
          errorCode: 'CSRF_COOKIE_MALFORMED'
        }
      }
    }

    // Validate token using timing-safe comparison
    const isValid = await validateCsrfToken(submittedToken, storedTokenData)

    if (!isValid) {
      // Determine if token is expired or just invalid
      const isExpired = Date.now() > storedTokenData.expires
      return {
        isValid: false,
        error: isExpired ? CSRF_ERRORS.EXPIRED_TOKEN : CSRF_ERRORS.INVALID_TOKEN,
        errorCode: isExpired ? 'CSRF_TOKEN_EXPIRED' : 'CSRF_TOKEN_INVALID'
      }
    }

    return { isValid: true }

  } catch (error) {
    logger.error('CSRF validation error', error, {
      component: 'CSRFMiddleware',
      action: 'validate_request_token',
      method: request.method,
      pathname: request.nextUrl.pathname
    })

    return {
      isValid: false,
      error: 'Internal error during CSRF validation',
      errorCode: 'CSRF_VALIDATION_ERROR'
    }
  }
}

/**
 * Creates a standardized CSRF error response
 * 
 * @param error - Error message
 * @param errorCode - Error code for client handling
 * @param status - HTTP status code
 * @returns NextResponse with error details
 */
function createCsrfErrorResponse(
  error: string, 
  errorCode: string, 
  status: number = 403
): NextResponse {
  return NextResponse.json({
    error,
    code: errorCode,
    message: 'CSRF protection blocked this request. Please refresh the page and try again.',
    timestamp: new Date().toISOString()
  }, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

/**
 * Main CSRF protection middleware
 * 
 * This function should be called from the main middleware to protect API routes
 * from CSRF attacks. It validates tokens for state-changing requests.
 * 
 * @param request - The incoming request
 * @returns NextResponse if CSRF validation fails, null if validation passes
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Check if this request requires CSRF protection
  if (!requiresCsrfProtection(request)) {
    return null // Continue processing
  }

  const pathname = request.nextUrl.pathname
  const method = request.method

  logger.debug('CSRF protection check', {
    component: 'CSRFMiddleware',
    action: 'check_csrf',
    method,
    pathname,
    userAgent: request.headers.get('user-agent')?.substring(0, 100)
  })

  // Validate CSRF token
  const validation = await validateRequestCsrfToken(request)

  if (!validation.isValid) {
    logger.warn('CSRF validation failed', undefined, {
      component: 'CSRFMiddleware',
      action: 'csrf_validation_failed',
      method,
      pathname,
      error: validation.error,
      errorCode: validation.errorCode,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    })

    return createCsrfErrorResponse(
      validation.error!,
      validation.errorCode!,
      validation.errorCode === 'CSRF_TOKEN_MISSING' ? 400 : 403
    )
  }

  logger.debug('CSRF validation passed', {
    component: 'CSRFMiddleware',
    action: 'csrf_validation_success',
    method,
    pathname
  })

  // CSRF validation passed, continue with request
  return null
}

/**
 * Helper function to add CSRF token to response headers
 * This can be used to refresh tokens in responses
 * 
 * @param response - The response to modify
 * @param token - The CSRF token to add
 * @returns Modified response with CSRF token header
 */
export function addCsrfTokenToResponse(response: NextResponse, token: string): NextResponse {
  response.headers.set('X-CSRF-Token', token)
  return response
}