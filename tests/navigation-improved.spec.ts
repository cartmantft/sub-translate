import { test, expect } from './fixtures/pages.fixture';

test.describe('페이지 네비게이션 - 개선된 버전', () => {
  test('홈페이지에서 로그인 페이지로 이동', async ({ homePage, page }) => {
    // Page Object를 사용한 명확한 네비게이션
    await homePage.goto();
    
    // 페이지 제목 확인 (더 구체적인 locator)
    await expect(page).toHaveTitle(/SubTranslate/);
    
    // 홈페이지 타이틀 확인 (role 기반)
    await expect(homePage.pageTitle).toBeVisible();
    
    // 로그인 버튼 클릭 (고유한 텍스트로 구분)
    await homePage.clickLoginButton();
    
    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL('/login');
  });

  test('로그인 페이지에서 로고 클릭으로 홈으로 돌아가기', async ({ loginPage, page }) => {
    // 로그인 페이지로 직접 이동
    await loginPage.goto();
    
    // 로고 클릭하여 홈으로 이동 (베이스 페이지의 공통 기능)
    await loginPage.clickLogoToHome();
    
    // 홈페이지로 이동 확인
    await expect(page).toHaveURL('/');
  });

  test('로그인 페이지에서 "홈으로 돌아가기" 링크 클릭', async ({ loginPage, page }) => {
    // 로그인 페이지 방문
    await loginPage.goto();
    
    // 전용 홈 링크 클릭
    await loginPage.goBackToHome();
    
    // 홈페이지로 이동 확인
    await expect(page).toHaveURL('/');
  });

  test('페이지별 주요 요소 표시 확인', async ({ homePage, loginPage }) => {
    // 홈페이지 주요 요소 확인
    await homePage.goto();
    await expect(homePage.heroSection).toBeVisible();
    await expect(homePage.featureCards).toHaveCount(3);
    
    // 로그인 페이지 주요 요소 확인  
    await loginPage.goto();
    await expect(loginPage.cardHeader).toBeVisible();
    await expect(loginPage.descriptionText).toBeVisible();
    await expect(loginPage.featuresPreviewSection).toBeVisible();
  });
});