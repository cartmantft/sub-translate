/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 * 
 * This module provides secure CSRF token generation and validation
 * to protect against cross-site request forgery attacks.
 */

import { randomBytes, timingSafeEqual } from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32 // 32 bytes = 256 bits of entropy
const CSRF_TOKEN_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

export interface CsrfTokenData {
  token: string
  expires: number
}

/**
 * Generates a cryptographically secure CSRF token
 * @returns Base64-encoded random token string
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('base64')
}

/**
 * Creates CSRF token data with expiration timestamp
 * @returns Object containing token and expiration time
 */
export function createCsrfTokenData(): CsrfTokenData {
  const token = generateCsrfToken()
  const expires = Date.now() + CSRF_TOKEN_TTL
  
  return { token, expires }
}

/**
 * Validates a CSRF token against the stored token data
 * Uses timing-safe comparison to prevent timing attacks
 * 
 * @param submittedToken - Token submitted by the client
 * @param storedTokenData - Token data stored in secure cookie
 * @returns True if token is valid and not expired
 */
export function validateCsrfToken(
  submittedToken: string | null | undefined,
  storedTokenData: CsrfTokenData | null | undefined
): boolean {
  // Check if both tokens exist
  if (!submittedToken || !storedTokenData) {
    return false
  }

  // Check if token has expired
  if (Date.now() > storedTokenData.expires) {
    return false
  }

  // Perform timing-safe comparison to prevent timing attacks
  try {
    const submittedBuffer = Buffer.from(submittedToken, 'base64')
    const storedBuffer = Buffer.from(storedTokenData.token, 'base64')
    
    // Ensure buffers are the same length before comparison
    if (submittedBuffer.length !== storedBuffer.length) {
      return false
    }
    
    return timingSafeEqual(submittedBuffer, storedBuffer)
  } catch (error) {
    // If token is not valid base64, comparison fails
    return false
  }
}

/**
 * Checks if a CSRF token is expired
 * @param tokenData - Token data to check
 * @returns True if token is expired
 */
export function isCsrfTokenExpired(tokenData: CsrfTokenData | null | undefined): boolean {
  if (!tokenData) return true
  return Date.now() > tokenData.expires
}

/**
 * Cookie configuration for CSRF tokens
 * These settings ensure maximum security for token storage
 */
export const CSRF_COOKIE_CONFIG = {
  name: '__csrf_token',
  httpOnly: true, // Prevent XSS access to token
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // Strict same-site policy
  maxAge: CSRF_TOKEN_TTL / 1000, // Convert to seconds for cookie
  path: '/', // Available for all routes
} as const

/**
 * Header name for CSRF token transmission
 * Using a custom header name to avoid conflicts
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * Query parameter name for CSRF token (fallback for forms)
 * Used when custom headers are not available
 */
export const CSRF_QUERY_PARAM = '_csrf'

/**
 * Error messages for CSRF validation failures
 */
export const CSRF_ERRORS = {
  MISSING_TOKEN: 'CSRF token is missing',
  INVALID_TOKEN: 'CSRF token is invalid', 
  EXPIRED_TOKEN: 'CSRF token has expired',
  MALFORMED_TOKEN: 'CSRF token is malformed'
} as const

/**
 * Extracts CSRF token from request headers or body
 * Checks both custom header and query parameter
 * 
 * @param headers - Request headers
 * @param searchParams - URL search parameters (for form submissions)
 * @returns CSRF token string or null if not found
 */
export function extractCsrfToken(
  headers: Headers,
  searchParams?: URLSearchParams
): string | null {
  // First, try to get token from custom header (preferred method)
  const headerToken = headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }

  // Fallback to query parameter for form submissions
  if (searchParams) {
    const queryToken = searchParams.get(CSRF_QUERY_PARAM)
    if (queryToken) {
      return queryToken
    }
  }

  return null
}