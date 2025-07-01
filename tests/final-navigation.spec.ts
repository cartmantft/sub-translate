import { test, expect } from '@playwright/test';

test.describe('최종 네비게이션 테스트 - 문제 해결', () => {
  test('홈페이지 기본 동작 확인', async ({ page }) => {
    await page.goto('/');
    
    // 1. URL과 제목 확인 (가장 확실한 방법)
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/SubTranslate/);
    
    // 2. 첫 번째 SubTranslate 요소만 확인
    await expect(page.locator('text=SubTranslate').first()).toBeVisible();
    
    // 3. 로그인 버튼 확인 (정확한 텍스트)
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
  });

  test('홈 → 로그인 페이지 이동', async ({ page }) => {
    await page.goto('/');
    
    // 로그인하기 버튼 클릭 (정확한 텍스트)
    await page.getByRole('button', { name: '로그인하기' }).click();
    
    // 로그인 페이지 도착 확인
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('로그인 페이지 기본 요소', async ({ page }) => {
    await page.goto('/login');
    
    // 폼 요소들 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 소셜 로그인 버튼들 (더 유연한 방식)
    await expect(page.locator('button').filter({ hasText: /Google/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /GitHub/i })).toBeVisible();
  });

  test('로그인 → 홈 (로고 클릭)', async ({ page }) => {
    await page.goto('/login');
    
    // 첫 번째 홈 링크 클릭 (로고)
    await page.locator('a[href="/"]').first().click();
    
    // 홈 페이지 도착 확인
    await expect(page).toHaveURL('/');
  });

  test('로그인 → 홈 (돌아가기 링크)', async ({ page }) => {
    await page.goto('/login');
    
    // "홈으로 돌아가기" 링크 클릭
    await page.getByRole('link', { name: /홈으로 돌아가기/ }).click();
    
    // 홈 페이지 도착 확인
    await expect(page).toHaveURL('/');
  });

  test('대시보드 보호 확인', async ({ page }) => {
    // 인증 없이 대시보드 접근
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 확인
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/login');
  });

  test('반응형 - 모바일 뷰', async ({ page }) => {
    // 모바일 크기로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 기본 요소들이 모바일에서도 표시되는지 확인
    await expect(page.locator('text=SubTranslate').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
  });
});