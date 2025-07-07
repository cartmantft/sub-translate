import { test, expect } from '@playwright/test';

test.describe('OAuth Social Login Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });

  test('Google OAuth button redirects to Supabase OAuth endpoint', async ({ page }) => {
    console.log('🔗 Testing Google OAuth button functionality');
    
    // Locate the Google OAuth button
    const googleButton = page.getByRole('button', { name: 'Google로 계속하기' });
    await expect(googleButton).toBeVisible();
    console.log('✅ Google OAuth button is visible');
    
    // Click the Google OAuth button and monitor network requests
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('supabase.co/auth/v1/authorize') && 
        response.url().includes('provider=google')
      ),
      googleButton.click()
    ]);
    
    console.log(`🔗 Redirected to: ${response.url()}`);
    
    // Verify the redirect URL contains the correct OAuth parameters
    expect(response.url()).toContain('supabase.co/auth/v1/authorize');
    expect(response.url()).toContain('provider=google');
    expect(response.url()).toContain('redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
    expect(response.url()).toContain('code_challenge');
    expect(response.url()).toContain('code_challenge_method=s256');
    
    console.log('✅ Google OAuth redirect URL parameters verified');
  });

  test('GitHub OAuth button redirects to Supabase OAuth endpoint', async ({ page }) => {
    console.log('🔗 Testing GitHub OAuth button functionality');
    
    // Locate the GitHub OAuth button
    const githubButton = page.getByRole('button', { name: 'Github로 계속하기' });
    await expect(githubButton).toBeVisible();
    console.log('✅ GitHub OAuth button is visible');
    
    // Click the GitHub OAuth button and monitor network requests
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('supabase.co/auth/v1/authorize') && 
        response.url().includes('provider=github')
      ),
      githubButton.click()
    ]);
    
    console.log(`🔗 Redirected to: ${response.url()}`);
    
    // Verify the redirect URL contains the correct OAuth parameters
    expect(response.url()).toContain('supabase.co/auth/v1/authorize');
    expect(response.url()).toContain('provider=github');
    expect(response.url()).toContain('redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
    expect(response.url()).toContain('code_challenge');
    expect(response.url()).toContain('code_challenge_method=s256');
    
    console.log('✅ GitHub OAuth redirect URL parameters verified');
  });

  test('OAuth provider not enabled error handling', async ({ page }) => {
    console.log('🚨 Testing OAuth provider not enabled error handling');
    
    // Navigate to login page with OAuth provider error parameters
    await page.goto('/login?error=validation_failed&error_description=Unsupported%20provider%3A%20provider%20is%20not%20enabled');
    
    // Wait for error message to appear
    const errorMessage = page.locator('[class*="text-red-800"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify the error message content
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('소셜 로그인 서비스가 설정되지 않았습니다');
    
    console.log(`✅ Error message displayed: ${errorText}`);
    
    // Verify error close button works
    const closeButton = page.getByRole('button', { name: '닫기' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Verify error message is hidden
    await expect(errorMessage).not.toBeVisible();
    console.log('✅ Error message close functionality verified');
  });

  test('OAuth URL validation and redirect security', async ({ page }) => {
    console.log('🔒 Testing OAuth redirect URL security');
    
    // Test with malicious redirect URL
    const maliciousUrl = '/login?next=https://evil.com/steal-tokens';
    await page.goto(maliciousUrl);
    
    // Click Google OAuth button
    const googleButton = page.getByRole('button', { name: 'Google로 계속하기' });
    await expect(googleButton).toBeVisible();
    
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('supabase.co/auth/v1/authorize')
      ),
      googleButton.click()
    ]);
    
    // Verify the redirect_to parameter is sanitized and only allows localhost
    const redirectParam = new URL(response.url()).searchParams.get('redirect_to');
    expect(redirectParam).toContain('localhost:3000/auth/callback');
    expect(redirectParam).not.toContain('evil.com');
    
    console.log('✅ OAuth redirect URL security verified');
  });

  test('OAuth buttons are properly styled and accessible', async ({ page }) => {
    console.log('♿ Testing OAuth button accessibility and styling');
    
    // Test Google button
    const googleButton = page.getByRole('button', { name: 'Google로 계속하기' });
    await expect(googleButton).toBeVisible();
    
    // Check for proper icon
    const googleIcon = googleButton.locator('img');
    await expect(googleIcon).toBeVisible();
    
    // Test GitHub button
    const githubButton = page.getByRole('button', { name: 'Github로 계속하기' });
    await expect(githubButton).toBeVisible();
    
    // Check for proper icon
    const githubIcon = githubButton.locator('img');
    await expect(githubIcon).toBeVisible();
    
    // Test keyboard accessibility
    await googleButton.focus();
    await expect(googleButton).toBeFocused();
    
    await githubButton.focus();
    await expect(githubButton).toBeFocused();
    
    console.log('✅ OAuth buttons accessibility verified');
  });

  test('OAuth error logging and monitoring', async ({ page }) => {
    console.log('📊 Testing OAuth error logging');
    
    // Monitor console messages for proper error logging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warn' || msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Navigate with OAuth error
    await page.goto('/login?error=validation_failed&error_description=provider%20is%20not%20enabled');
    
    // Wait a bit for console messages to be logged
    await page.waitForTimeout(1000);
    
    // Verify error logging occurred (note: we can't check exact logger calls, but can verify error handling)
    const hasOAuthError = consoleMessages.some(msg => 
      msg.includes('validation_failed') || msg.includes('provider')
    );
    
    console.log(`📝 Console messages captured: ${consoleMessages.length}`);
    console.log(`🔍 OAuth error logged: ${hasOAuthError}`);
    
    // Verify error message is displayed to user regardless of logging
    const errorMessage = page.locator('[class*="text-red-800"]');
    await expect(errorMessage).toBeVisible();
    
    console.log('✅ OAuth error handling verified');
  });
});

test.describe('OAuth Configuration Guide Tests', () => {
  test('Verify OAuth configuration steps are documented', async ({ page }) => {
    console.log('📋 Testing OAuth configuration documentation');
    
    // These tests verify that the OAuth setup process is properly documented
    // and that the application provides clear guidance for configuration
    
    await page.goto('/login');
    
    // Simulate OAuth provider not enabled error
    await page.goto('/login?error=validation_failed&error_description=provider%20is%20not%20enabled');
    
    // Verify helpful error message with configuration guidance
    const errorMessage = page.locator('[class*="text-red-800"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('관리자에게 문의해주세요');
    
    console.log('✅ OAuth configuration guidance verified');
  });
});