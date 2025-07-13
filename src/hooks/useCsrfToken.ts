/**
 * CSRF Token Management Hook (Legacy)
 * 
 * This hook is deprecated and redirects to the new Context-based CSRF management.
 * Use the CsrfProvider and useCsrfToken from @/contexts/CsrfContext instead.
 * 
 * @deprecated Use useCsrfToken from @/contexts/CsrfContext
 */

export { useCsrfToken, fetchWithCsrf } from '@/contexts/CsrfContext'

// Re-export types for backward compatibility
export type { CsrfContextValue as UseCsrfTokenReturn } from '@/contexts/CsrfContext'

// Legacy interface for backward compatibility
export interface CsrfTokenState {
  token: string | null
  isLoading: boolean
  error: string | null
  expires: number | null
}

/**
 * Higher-order function to add CSRF token to fetch requests
 * 
 * @param token - CSRF token to include in request
 * @param options - Fetch options
 * @returns Modified fetch options with CSRF token header
 */
export function withCsrfToken(
  token: string | null, 
  options: RequestInit = {}
): RequestInit {
  if (!token) {
    return options
  }

  const headers = new Headers(options.headers)
  headers.set('X-CSRF-Token', token)

  return {
    ...options,
    headers,
    credentials: 'same-origin' // Ensure cookies are included
  }
}