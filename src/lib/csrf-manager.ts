/**
 * Global CSRF Token Manager
 * 
 * This singleton manages CSRF tokens across the entire application,
 * preventing duplicate requests and ensuring efficient token management.
 */

export interface CsrfTokenData {
  token: string | null
  expires: number | null
  isLoading: boolean
  error: string | null
}

type CsrfTokenListener = (data: CsrfTokenData) => void

class CsrfTokenManager {
  private tokenData: CsrfTokenData = {
    token: null,
    expires: null,
    isLoading: false,
    error: null
  }

  private listeners: Set<CsrfTokenListener> = new Set()
  private activeRequest: Promise<string | null> | null = null
  private refreshTimeout: NodeJS.Timeout | null = null

  // Token refresh threshold - refresh when 5 minutes remain
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000

  /**
   * Subscribe to token data changes
   */
  subscribe(listener: CsrfTokenListener): () => void {
    this.listeners.add(listener)
    
    // Immediately notify with current state
    listener(this.tokenData)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of token data changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.tokenData))
  }

  /**
   * Update token data and notify listeners
   */
  private updateTokenData(updates: Partial<CsrfTokenData>): void {
    this.tokenData = { ...this.tokenData, ...updates }
    this.notifyListeners()
  }

  /**
   * Check if the current token is valid (exists and not expired)
   */
  private isTokenValid(): boolean {
    if (!this.tokenData.token || !this.tokenData.expires) {
      return false
    }

    // Add small buffer to account for request time
    const now = Date.now() + 1000 // 1 second buffer
    return now < this.tokenData.expires
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expires: number): void {
    // Clear existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }

    // Calculate when to refresh (before expiration)
    const now = Date.now()
    const timeUntilExpiry = expires - now
    const refreshIn = Math.max(0, timeUntilExpiry - this.TOKEN_REFRESH_THRESHOLD)

    // Schedule refresh
    this.refreshTimeout = setTimeout(() => {
      this.fetchNewToken()
    }, refreshIn)
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async fetchNewToken(): Promise<string | null> {
    try {
      this.updateTokenData({ isLoading: true, error: null })

      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'same-origin',
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

      // Update token data
      this.updateTokenData({
        token: data.csrfToken,
        expires: data.expires,
        isLoading: false,
        error: null
      })

      // Schedule automatic refresh
      this.scheduleTokenRefresh(data.expires)

      return data.csrfToken

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      this.updateTokenData({
        token: null,
        expires: null,
        isLoading: false,
        error: errorMessage
      })

      console.error('Failed to fetch CSRF token:', errorMessage)
      return null
    }
  }

  /**
   * Get a valid CSRF token, fetching if necessary
   * This method prevents duplicate requests by reusing active requests
   */
  async getToken(): Promise<string | null> {
    // If we have a valid token, return it
    if (this.isTokenValid()) {
      return this.tokenData.token
    }

    // If there's already an active request, wait for it
    if (this.activeRequest) {
      return this.activeRequest
    }

    // Create a new token request
    this.activeRequest = this.fetchNewToken()

    try {
      const token = await this.activeRequest
      return token
    } finally {
      // Clear the active request reference
      this.activeRequest = null
    }
  }

  /**
   * Manually refresh the CSRF token
   */
  async refreshToken(): Promise<void> {
    // Cancel any existing request and create a new one
    this.activeRequest = null
    await this.getToken()
  }

  /**
   * Get current token data
   */
  getCurrentData(): CsrfTokenData {
    return { ...this.tokenData }
  }

  /**
   * Initialize the token manager (fetch initial token)
   */
  async initialize(): Promise<void> {
    if (!this.tokenData.token && !this.activeRequest) {
      await this.getToken()
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
    this.activeRequest = null
    this.listeners.clear()
  }
}

// Create and export the singleton instance
export const csrfTokenManager = new CsrfTokenManager()

// Initialize the manager when the module is loaded
if (typeof window !== 'undefined') {
  csrfTokenManager.initialize()
}