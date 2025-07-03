/**
 * CSRF Token Management Hook
 * 
 * This React hook manages CSRF tokens for secure API requests.
 * It automatically fetches, stores, and refreshes tokens as needed.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface CsrfTokenState {
  token: string | null
  isLoading: boolean
  error: string | null
  expires: number | null
}

export interface UseCsrfTokenReturn extends CsrfTokenState {
  refreshToken: () => Promise<void>
  isTokenValid: () => boolean
  getToken: () => Promise<string | null>
}

// Token refresh threshold - refresh when 5 minutes remain
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Custom hook for managing CSRF tokens
 * 
 * Automatically fetches a CSRF token when the component mounts,
 * handles token expiration, and provides methods for refreshing tokens.
 * 
 * @param autoRefresh - Whether to automatically refresh tokens before expiration
 * @returns Object containing token state and management functions
 */
export function useCsrfToken(autoRefresh: boolean = true): UseCsrfTokenReturn {
  const [state, setState] = useState<CsrfTokenState>({
    token: null,
    isLoading: false,
    error: null,
    expires: null
  })

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef<boolean>(false)

  /**
   * Fetches a new CSRF token from the API
   */
  const fetchToken = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous requests
    if (isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'same-origin', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch CSRF token`)
      }

      const data = await response.json()
      
      if (!data.csrfToken || !data.expires) {
        throw new Error('Invalid CSRF token response format')
      }

      setState({
        token: data.csrfToken,
        isLoading: false,
        error: null,
        expires: data.expires
      })

      // Set up automatic refresh if enabled
      if (autoRefresh) {
        scheduleTokenRefresh(data.expires)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setState({
        token: null,
        isLoading: false,
        error: errorMessage,
        expires: null
      })

      console.error('Failed to fetch CSRF token:', errorMessage)
    } finally {
      isRefreshingRef.current = false
    }
  }, [autoRefresh])

  /**
   * Schedules automatic token refresh before expiration
   */
  const scheduleTokenRefresh = useCallback((expires: number) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Calculate when to refresh (before expiration)
    const now = Date.now()
    const timeUntilExpiry = expires - now
    const refreshIn = Math.max(0, timeUntilExpiry - TOKEN_REFRESH_THRESHOLD)

    // Schedule refresh
    refreshTimeoutRef.current = setTimeout(() => {
      fetchToken()
    }, refreshIn)
  }, [fetchToken])

  /**
   * Manually refresh the CSRF token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchToken()
  }, [fetchToken])

  /**
   * Check if the current token is valid (exists and not expired)
   */
  const isTokenValid = useCallback((): boolean => {
    if (!state.token || !state.expires) {
      return false
    }

    // Add small buffer to account for request time
    const now = Date.now() + 1000 // 1 second buffer
    return now < state.expires
  }, [state.token, state.expires])

  /**
   * Get a valid token, refreshing if necessary
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // If we have a valid token, return it
    if (isTokenValid()) {
      return state.token
    }

    // If token is invalid or expired, fetch a new one
    await fetchToken()
    
    // Return the new token
    return state.token
  }, [state.token, isTokenValid, fetchToken])

  // Initial token fetch on mount
  useEffect(() => {
    fetchToken()

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [fetchToken])

  // Cleanup timeout when autoRefresh changes
  useEffect(() => {
    if (!autoRefresh && refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [autoRefresh])

  return {
    ...state,
    refreshToken,
    isTokenValid,
    getToken
  }
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

/**
 * Utility function to make CSRF-protected API requests
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @param token - CSRF token
 * @returns Fetch response
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
  token: string | null
): Promise<Response> {
  const protectedOptions = withCsrfToken(token, options)
  return fetch(url, protectedOptions)
}