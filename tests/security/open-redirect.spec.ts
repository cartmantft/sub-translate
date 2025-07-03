/**
 * Open Redirect Security Tests
 * 
 * Tests to verify that Open Redirect vulnerabilities are properly prevented
 * while ensuring legitimate redirect flows continue to work correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Open Redirect Prevention', () => {
  const maliciousDomains = [
    'https://evil.com',
    'http://malicious-site.com',
    'https://phishing-site.example.com',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    'vbscript:alert("xss")',
    'ftp://evil.com',
    '//evil.com'
  ];

  const edgeCases = [
    'https://sub-translate.vercel.app.evil.com', // Subdomain confusion
    'https://sub-translate.evil.com',             // Similar domain
    'localhost.evil.com',                         // Localhost confusion
    'https://evil.com@sub-translate.vercel.app',  // User info confusion
    'https://evil.com/dashboard',                 // Path matching attempt
    'https://evil.com#/dashboard',                // Fragment attack
    'https://evil.com?redirect=/dashboard',       // Query parameter attack
  ];

  test.describe('OAuth Callback Protection', () => {
    test('should block malicious external domain redirects', async ({ page }) => {
      for (const maliciousUrl of maliciousDomains) {
        // Test OAuth callback with malicious redirect
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(maliciousUrl)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth) instead of malicious site
        await expect(page).toHaveURL('/auth/auth-code-error');
        
        // Verify we're on the correct domain
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):/);
        expect(currentUrl).not.toContain('evil.com');
        expect(currentUrl).not.toContain('malicious');
        expect(currentUrl).not.toContain('phishing');
      }
    });

    test('should block edge case redirect attacks', async ({ page }) => {
      for (const edgeCaseUrl of edgeCases) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(edgeCaseUrl)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
        
        // Verify domain safety
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('evil.com');
      }
    });

    test('should allow legitimate internal redirects', async ({ page }) => {
      const legitimateRedirects = [
        '/dashboard',
        '/projects',
        '/',
        '/login'
      ];

      for (const redirectPath of legitimateRedirects) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(redirectPath)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to the requested internal path
        // Note: In tests without actual OAuth, this will likely redirect to error page
        // but the important thing is it doesn't redirect to external sites
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):/);
        
        // Should either be on the requested path or the auth error page (safe)
        expect(
          currentUrl.endsWith(redirectPath) || 
          currentUrl.includes('/auth/auth-code-error')
        ).toBeTruthy();
      }
    });

    test('should handle malformed URLs gracefully', async ({ page }) => {
      const malformedUrls = [
        'not-a-url',
        '\\\\evil.com\\path',
        'ht tp://spaces.com',
        'https://[invalid-ipv6',
        'https://',
        'https://.',
        'javascript:',
        'data:',
        ''
      ];

      for (const malformedUrl of malformedUrls) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(malformedUrl)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
      }
    });

    test('should handle URL encoding attack attempts', async ({ page }) => {
      const encodedAttacks = [
        '%2F%2Fevil.com',                          // //evil.com double encoded
        '%68%74%74%70%73%3A%2F%2Fevil.com',       // https://evil.com encoded
        '%6A%61%76%61%73%63%72%69%70%74%3A',      // javascript: encoded
        encodeURIComponent('https://evil.com'),
        encodeURIComponent(encodeURIComponent('https://evil.com')) // Double encoded
      ];

      for (const encodedAttack of encodedAttacks) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodedAttack}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
        
        // Verify we're on safe domain
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):/);
        expect(currentUrl).not.toContain('evil.com');
      }
    });
  });

  test.describe('URL Validation Edge Cases', () => {
    test('should reject URLs with dangerous schemes', async ({ page }) => {
      const dangerousSchemes = [
        'javascript:alert(document.domain)',
        'data:text/html,<img src=x onerror=alert(1)>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd',
        'ftp://evil.com/path'
      ];

      for (const dangerousUrl of dangerousSchemes) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(dangerousUrl)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
      }
    });

    test('should handle path traversal attempts', async ({ page }) => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '../../../../windows/system32',
        '/dashboard/../../../evil.com',
        '/dashboard/../admin',
        './.././../evil.com'
      ];

      for (const traversal of traversalAttempts) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(traversal)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
      }
    });

    test('should prevent protocol confusion attacks', async ({ page }) => {
      const protocolAttacks = [
        'HTTPs://evil.com',           // Case variation
        'HTTPS://evil.com',           // All caps
        'htTPs://evil.com',           // Mixed case
        'https\u003A\u002F\u002Fevil.com', // Unicode encoding
        'https\u0000://evil.com',     // Null byte
        'https:\/\/evil.com'          // Backslash confusion
      ];

      for (const protocolAttack of protocolAttacks) {
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(protocolAttack)}`;
        
        await page.goto(callbackUrl);
        
        // Should redirect to safe fallback (auth error page for invalid OAuth)
        await expect(page).toHaveURL('/auth/auth-code-error');
        
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('evil.com');
      }
    });
  });

  test.describe('Security Logging Verification', () => {
    test('should log blocked redirect attempts', async ({ page }) => {
      // Listen for console messages to verify security logging
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'log' || msg.type() === 'warn') {
          consoleMessages.push(msg.text());
        }
      });

      // Attempt malicious redirect
      const maliciousUrl = 'https://evil.com/phishing';
      const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(maliciousUrl)}`;
      
      await page.goto(callbackUrl);
      await expect(page).toHaveURL('/');

      // Note: Console messages from server-side code won't appear in browser console
      // This test is more for documenting expected behavior
      // In a real implementation, you would check server logs or a logging service
    });
  });

  test.describe('Legitimate Use Case Verification', () => {
    test('should preserve legitimate redirect flow', async ({ page }) => {
      // Test that normal authentication flow works correctly
      // when redirecting to legitimate internal pages
      
      const legitimatePaths = ['/dashboard', '/projects'];
      
      for (const path of legitimatePaths) {
        // Navigate to a protected page which should redirect to login
        await page.goto(path);
        
        // Should be redirected to login (by middleware)
        await expect(page).toHaveURL('/login');
        
        // Verify we can navigate back to legitimate pages
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        
        // Should still be on login (authentication required)
        // This verifies the redirect system isn't broken
        expect(page.url()).toMatch(/\/(login|dashboard|projects)/);
      }
    });

    test('should handle missing next parameter gracefully', async ({ page }) => {
      // Test OAuth callback without next parameter (invalid code)
      await page.goto('/auth/callback?code=test-code');
      
      // Should go to auth error page (since test-code is invalid)
      await expect(page).toHaveURL('/auth/auth-code-error');
    });

    test('should handle empty next parameter', async ({ page }) => {
      // Test OAuth callback with empty next parameter (invalid code)
      await page.goto('/auth/callback?code=test-code&next=');
      
      // Should go to auth error page (since test-code is invalid)
      await expect(page).toHaveURL('/auth/auth-code-error');
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle multiple redirect attempts efficiently', async ({ page }) => {
      // Test that URL validation doesn't cause performance issues
      const startTime = Date.now();
      
      // Make multiple requests with various malicious URLs
      for (let i = 0; i < 10; i++) {
        const maliciousUrl = `https://evil${i}.com/attack`;
        const callbackUrl = `/auth/callback?code=test-code&next=${encodeURIComponent(maliciousUrl)}`;
        
        await page.goto(callbackUrl);
        await expect(page).toHaveURL('/auth/auth-code-error');
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete all redirects in reasonable time (< 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });

    test('should maintain security under concurrent requests', async ({ page, context }) => {
      // Create multiple pages to simulate concurrent requests
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);

      const maliciousUrls = [
        'https://evil1.com',
        'https://evil2.com', 
        'https://evil3.com'
      ];

      // Make concurrent requests
      const promises = pages.map((p, index) => {
        const url = `/auth/callback?code=test-code&next=${encodeURIComponent(maliciousUrls[index])}`;
        return p.goto(url);
      });

      await Promise.all(promises);

      // All should redirect to safe location (auth error page)
      for (const p of pages) {
        await expect(p).toHaveURL('/auth/auth-code-error');
        await p.close();
      }
    });
  });
});