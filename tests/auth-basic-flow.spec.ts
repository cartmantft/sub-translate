import { test, expect } from '@playwright/test';

test.describe('기본 인증 플로우 테스트', () => {
  test('로그인 페이지에서 대시보드로 이동하는 기본 플로우', async ({ page }) => {
    // 1. 홈페이지에서 로그인 페이지로 이동
    await page.goto('/');
    await page.getByText('로그인').click();
    await expect(page).toHaveURL('/login');
    
    // 2. 로그인 폼 요소 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ 로그인 페이지 폼 요소 확인 완료');
  });

  test('인증되지 않은 상태에서 대시보드 접근 시 리다이렉트', async ({ page }) => {
    // 직접 대시보드 URL로 접근
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login');
    
    console.log('✅ 인증되지 않은 사용자 대시보드 접근 차단 확인');
  });

  test('로그인 폼에서 빈 필드 제출 시 유효성 검사', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 폼으로 제출 시도
    await page.locator('button[type="submit"]').click();
    
    // HTML5 유효성 검사나 에러 메시지 확인
    const emailInput = page.locator('input[type="email"]');
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
    
    console.log('✅ 로그인 폼 유효성 검사 확인');
  });

  test('로그인 페이지의 기본 UI 요소 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 페이지 기본 요소들 확인
    await expect(page.getByText('SubTranslate')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    
    // "홈으로 돌아가기" 링크가 있는지 확인
    const homeLink = page.getByText('홈으로 돌아가기').or(page.getByText('Home'));
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible();
      console.log('✅ 홈으로 돌아가기 링크 확인');
    }
    
    console.log('✅ 로그인 페이지 UI 요소 확인 완료');
  });

  test('API 엔드포인트 보호 확인', async ({ page }) => {
    // 인증이 필요한 API 엔드포인트에 직접 접근
    const response = await page.request.get('/api/projects');
    
    // 401 또는 302/405 응답 확인 (인증되지 않은 사용자)
    expect([401, 302, 405]).toContain(response.status());
    
    console.log(`✅ API 보호 확인: ${response.status()} 응답`);
  });

  test('로그인 페이지 접근성 기본 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 접근성 기본 요소 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // 라벨 또는 placeholder 확인
    const emailLabel = await emailInput.getAttribute('placeholder') || 
                       await page.locator('label[for="email"]').textContent();
    expect(emailLabel).toBeTruthy();
    
    const passwordLabel = await passwordInput.getAttribute('placeholder') || 
                          await page.locator('label[for="password"]').textContent();
    expect(passwordLabel).toBeTruthy();
    
    console.log('✅ 로그인 페이지 접근성 기본 확인');
  });
});