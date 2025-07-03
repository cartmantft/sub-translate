/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 * 
 * This module provides secure CSRF token generation and validation
 * to protect against cross-site request forgery attacks.
 */

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32 // 32 bytes = 256 bits of entropy
const CSRF_TOKEN_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

export interface CsrfTokenData {
  token: string
  expires: number
}

/**
 * Generates a cryptographically secure CSRF token using Web Crypto API
 * @returns Base64-encoded random token string
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
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
 * @returns Promise that resolves to true if token is valid and not expired
 */
export async function validateCsrfToken(
  submittedToken: string | null | undefined,
  storedTokenData: CsrfTokenData | null | undefined
): Promise<boolean> {
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
    return timingSafeEqual(submittedToken, storedTokenData.token)
  } catch {
    // If comparison fails, token is invalid
    return false
  }
}

/**
 * Timing-safe string comparison
 * This prevents timing attacks by ensuring constant-time comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  }
  return result === 0;
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
 * Error messages for CSRF validation failures
 */
export const CSRF_ERRORS = {
  MISSING_TOKEN: 'CSRF token is missing',
  INVALID_TOKEN: 'CSRF token is invalid', 
  EXPIRED_TOKEN: 'CSRF token has expired',
  MALFORMED_TOKEN: 'CSRF token is malformed'
} as const

/**
 * Extracts CSRF token from request headers
 * Only checks custom header for security reasons
 * 
 * @param headers - Request headers
 * @returns CSRF token string or null if not found
 */
export function extractCsrfToken(
  headers: Headers
): string | null {
  // Get token from custom header (the secure method)
  const headerToken = headers.get(CSRF_HEADER_NAME)
  return headerToken
}