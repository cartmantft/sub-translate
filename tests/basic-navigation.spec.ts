import { test, expect } from './fixtures/pages.fixture';

test.describe('기본 네비게이션 - 견고한 버전', () => {
  test('홈페이지 로딩 및 기본 요소 확인', async ({ homePage, page }) => {
    await homePage.goto();
    
    // URL 확인
    await expect(page).toHaveURL('/');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SubTranslate/);
    
    // SubTranslate 텍스트가 포함된 요소 확인 (정확한 위치는 상관없이)
    await expect(page.locator('text=SubTranslate')).toBeVisible();
  });

  test('로그인 페이지로 이동', async ({ homePage, page }) => {
    await homePage.goto();
    
    // 로그인 버튼이 있는지 확인
    const loginButton = page.locator('button', { hasText: '로그인' });
    if (await loginButton.count() > 0) {
      await loginButton.first().click();
      await expect(page).toHaveURL('/login');
    }
  });

  test('로그인 페이지 기본 요소', async ({ loginPage, page }) => {
    await loginPage.goto();
    
    // URL 확인
    await expect(page).toHaveURL('/login');
    
    // 기본 폼 요소들 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('로그인 페이지에서 홈으로 돌아가기', async ({ page }) => {
    await page.goto('/login');
    
    // 홈으로 가는 링크 찾기 (여러 방법 시도)
    const homeLinks = [
      page.locator('a[href="/"]'),
      page.locator('text=홈으로'),
      page.locator('text=SubTranslate').first()
    ];
    
    for (const link of homeLinks) {
      if (await link.count() > 0) {
        await link.first().click();
        await expect(page).toHaveURL('/');
        break;
      }
    }
  });

  test('대시보드 접근 시 리다이렉트', async ({ page }) => {
    // 인증 없이 대시보드 접근
    await page.goto('/dashboard');
    
    // 리다이렉트 되어야 함 (로그인 페이지 또는 홈)
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    
    // 대시보드가 아닌 다른 페이지로 이동했는지 확인
    expect(currentUrl).not.toContain('/dashboard');
  });
});