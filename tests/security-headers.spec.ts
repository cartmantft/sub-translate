/**
 * Security Headers and CSRF Protection Tests
 * 
 * This test suite verifies that security headers are properly set
 * and CSRF protection is working as expected.
 */

import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('should set comprehensive security headers on all pages', async ({ page }) => {
    // Test home page
    const response = await page.goto('/')
    expect(response).toBeTruthy()
    
    const headers = response!.headers()
    
    // Content Security Policy
    expect(headers['content-security-policy']).toBeTruthy()
    expect(headers['content-security-policy']).toContain("default-src 'self'")
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    
    // Clickjacking protection
    expect(headers['x-frame-options']).toBe('DENY')
    
    // MIME type sniffing protection
    expect(headers['x-content-type-options']).toBe('nosniff')
    
    // XSS protection
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    
    // Referrer policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    
    // DNS prefetch control
    expect(headers['x-dns-prefetch-control']).toBe('off')
    
    // Download options
    expect(headers['x-download-options']).toBe('noopen')
    
    // Cross-domain policies
    expect(headers['x-permitted-cross-domain-policies']).toBe('none')
  })

  test('should set security headers on API endpoints', async ({ page }) => {
    const response = await page.goto('/api/csrf')
    expect(response).toBeTruthy()
    
    const headers = response!.headers()
    
    // Verify security headers are also applied to API routes
    expect(headers['content-security-policy']).toBeTruthy()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  test('should not set HSTS header in development', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).toBeTruthy()
    
    const headers = response!.headers()
    
    // HSTS should not be set in development environment
    expect(headers['strict-transport-security']).toBeUndefined()
  })
})

test.describe('CSRF Protection', () => {
  test('should generate valid CSRF tokens', async ({ page }) => {
    const response = await page.goto('/api/csrf')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)
    
    const data = await response!.json()
    
    // Verify token structure
    expect(data).toHaveProperty('csrfToken')
    expect(data).toHaveProperty('expires')
    expect(typeof data.csrfToken).toBe('string')
    expect(typeof data.expires).toBe('number')
    expect(data.csrfToken.length).toBeGreaterThan(20) // Base64 encoded token should be substantial
    
    // Verify expiration is in the future
    expect(data.expires).toBeGreaterThan(Date.now())
    
    // Verify Cache-Control headers are set to prevent caching
    const headers = response!.headers()
    expect(headers['cache-control']).toContain('no-store')
    expect(headers['cache-control']).toContain('no-cache')
  })

  test('should set secure cookie with CSRF token', async ({ page, context }) => {
    await page.goto('/api/csrf')
    
    // Get cookies from the context
    const cookies = await context.cookies()
    const csrfCookie = cookies.find(cookie => cookie.name === '__csrf_token')
    
    expect(csrfCookie).toBeTruthy()
    expect(csrfCookie!.httpOnly).toBe(true)
    expect(csrfCookie!.sameSite).toBe('Strict')
    expect(csrfCookie!.path).toBe('/')
    
    // Verify cookie contains token data
    expect(csrfCookie!.value).toBeTruthy()
    
    // Try to parse the cookie value as JSON (it should contain token data)
    let tokenData
    expect(() => {
      tokenData = JSON.parse(csrfCookie!.value)
    }).not.toThrow()
    
    expect(tokenData).toHaveProperty('token')
    expect(tokenData).toHaveProperty('expires')
  })

  test('should block POST requests without CSRF token', async ({ request }) => {
    // Try to make a POST request to a protected endpoint without CSRF token
    const response = await request.post('/api/projects', {
      data: { title: 'Test Project' }
    })
    
    // Should be blocked by CSRF protection
    expect(response.status()).toBe(400) // or 403
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData).toHaveProperty('code')
    expect(errorData.code).toContain('CSRF')
  })

  test('should allow POST requests with valid CSRF token', async ({ page, request }) => {
    // First, get a CSRF token
    await page.goto('/api/csrf')
    const csrfResponse = await page.evaluate(() => fetch('/api/csrf').then(r => r.json()))
    
    expect(csrfResponse.csrfToken).toBeTruthy()
    
    // Now try to make a request with the token
    // Note: This might fail due to authentication, but it should pass CSRF validation
    const response = await request.post('/api/projects', {
      headers: {
        'X-CSRF-Token': csrfResponse.csrfToken,
        'Content-Type': 'application/json'
      },
      data: { title: 'Test Project' }
    })
    
    // The request might fail due to authentication (401/403) but should not fail due to CSRF (400 with CSRF error)
    if (response.status() === 400) {
      const errorData = await response.json()
      expect(errorData.code).not.toContain('CSRF')
    }
  })

  test('should reject requests with invalid CSRF token', async ({ request }) => {
    const response = await request.post('/api/projects', {
      headers: {
        'X-CSRF-Token': 'invalid-token-12345',
        'Content-Type': 'application/json'
      },
      data: { title: 'Test Project' }
    })
    
    expect(response.status()).toBe(403)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('code')
    expect(errorData.code).toContain('CSRF')
  })

  test('should validate CSRF tokens via POST endpoint', async ({ page, request }) => {
    // Get a valid token first
    await page.goto('/api/csrf')
    const tokenData = await page.evaluate(() => fetch('/api/csrf').then(r => r.json()))
    
    // Test valid token validation
    const validResponse = await request.post('/api/csrf', {
      data: { token: tokenData.csrfToken }
    })
    
    expect(validResponse.status()).toBe(200)
    const validData = await validResponse.json()
    expect(validData.valid).toBe(true)
    
    // Test invalid token validation
    const invalidResponse = await request.post('/api/csrf', {
      data: { token: 'invalid-token' }
    })
    
    expect(invalidResponse.status()).toBe(403)
    const invalidData = await invalidResponse.json()
    expect(invalidData.valid).toBe(false)
  })
})

test.describe('Content Security Policy', () => {
  test('should allow necessary external resources', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).toBeTruthy()
    
    const headers = response!.headers()
    const csp = headers['content-security-policy']
    
    // Verify CSP allows necessary external domains
    expect(csp).toContain('https://*.supabase.co') // Supabase
    expect(csp).toContain('https://api.openai.com') // OpenAI
    expect(csp).toContain('https://generativelanguage.googleapis.com') // Google Gemini
    
    // Verify restrictive defaults
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })

  test('should prevent framing in CSP', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).toBeTruthy()
    
    const headers = response!.headers()
    const csp = headers['content-security-policy']
    
    // Verify frame-ancestors is set to none
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

test.describe('Security Integration', () => {
  test('should maintain security headers throughout navigation', async ({ page }) => {
    // Test multiple page navigations
    const pages = ['/', '/login']
    
    for (const pagePath of pages) {
      const response = await page.goto(pagePath)
      expect(response).toBeTruthy()
      
      const headers = response!.headers()
      
      // Verify key security headers are always present
      expect(headers['x-frame-options']).toBe('DENY')
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['content-security-policy']).toBeTruthy()
    }
  })

  test('should handle CSRF token refresh gracefully', async ({ page }) => {
    // Get initial token
    await page.goto('/api/csrf')
    const firstToken = await page.evaluate(() => fetch('/api/csrf').then(r => r.json()))
    
    // Wait a moment and get another token
    await page.waitForTimeout(100)
    const secondToken = await page.evaluate(() => fetch('/api/csrf').then(r => r.json()))
    
    // Tokens should be different (new tokens generated each time)
    expect(firstToken.csrfToken).not.toBe(secondToken.csrfToken)
    
    // Both should be valid format
    expect(firstToken.csrfToken).toBeTruthy()
    expect(secondToken.csrfToken).toBeTruthy()
    expect(firstToken.expires).toBeGreaterThan(Date.now())
    expect(secondToken.expires).toBeGreaterThan(Date.now())
  })
})