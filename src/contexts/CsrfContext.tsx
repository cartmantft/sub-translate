'use client';

/**
 * CSRF Token Context Provider
 * 
 * Provides CSRF token functionality across the application using React Context.
 * This ensures all components share the same token instance and prevents duplicate requests.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { csrfTokenManager, type CsrfTokenData } from '@/lib/csrf-manager'

export interface CsrfContextValue extends CsrfTokenData {
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<void>
  isTokenValid: () => boolean
}

const CsrfContext = createContext<CsrfContextValue | null>(null)

interface CsrfProviderProps {
  children: React.ReactNode
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const [tokenData, setTokenData] = useState<CsrfTokenData>(() => 
    csrfTokenManager.getCurrentData()
  )

  useEffect(() => {
    // Subscribe to token data changes from the global manager
    const unsubscribe = csrfTokenManager.subscribe(setTokenData)

    // Initialize the token manager if needed
    csrfTokenManager.initialize()

    return unsubscribe
  }, [])

  const isTokenValid = (): boolean => {
    if (!tokenData.token || !tokenData.expires) {
      return false
    }

    // Add small buffer to account for request time
    const now = Date.now() + 1000 // 1 second buffer
    return now < tokenData.expires
  }

  const getToken = async (): Promise<string | null> => {
    return csrfTokenManager.getToken()
  }

  const refreshToken = async (): Promise<void> => {
    return csrfTokenManager.refreshToken()
  }

  const contextValue: CsrfContextValue = {
    ...tokenData,
    getToken,
    refreshToken,
    isTokenValid
  }

  return (
    <CsrfContext.Provider value={contextValue}>
      {children}
    </CsrfContext.Provider>
  )
}

/**
 * Hook to use CSRF token functionality
 * This replaces the old useCsrfToken hook with global token management
 */
export function useCsrfToken() {
  const context = useContext(CsrfContext)
  
  if (!context) {
    throw new Error('useCsrfToken must be used within a CsrfProvider')
  }

  return context
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
  const headers = new Headers(options.headers)
  
  if (token) {
    headers.set('X-CSRF-Token', token)
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  })
}