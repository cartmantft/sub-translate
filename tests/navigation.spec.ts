import { test, expect } from '@playwright/test';

test.describe('페이지 네비게이션', () => {
  test('홈페이지에서 로그인 페이지로 이동', async ({ page }) => {
    // 홈페이지 방문
    await page.goto('/');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SubTranslate/);
    
    // SubTranslate 로고/제목 표시 확인
    await expect(page.getByText('SubTranslate')).toBeVisible();
    
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인하기' }).click();
    
    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL('/login');
  });

  test('로그인 페이지에서 홈으로 돌아가기', async ({ page }) => {
    // 로그인 페이지 방문
    await page.goto('/login');
    
    // 로고 클릭하여 홈으로 이동
    await page.getByRole('link').filter({ hasText: 'SubTranslate' }).click();
    
    // 홈페이지로 이동 확인
    await expect(page).toHaveURL('/');
  });

  test('로그인 페이지에서 "홈으로 돌아가기" 링크 클릭', async ({ page }) => {
    // 로그인 페이지 방문
    await page.goto('/login');
    
    // "홈으로 돌아가기" 링크 클릭
    await page.getByRole('link', { name: '← 홈으로 돌아가기' }).click();
    
    // 홈페이지로 이동 확인
    await expect(page).toHaveURL('/');
  });
});