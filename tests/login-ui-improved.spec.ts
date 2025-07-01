import { test, expect } from './fixtures/pages.fixture';

test.describe('로그인 페이지 UI - 개선된 버전', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('로그인 페이지 기본 요소들이 표시됨', async ({ loginPage }) => {
    // Page Object를 통한 명확한 요소 확인
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.cardHeader).toBeVisible();
    await expect(loginPage.descriptionText).toBeVisible();
  });

  test('Supabase Auth 컴포넌트 요소들이 표시됨', async ({ loginPage }) => {
    // Auth UI 요소들 확인
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('소셜 로그인 버튼들이 표시됨', async ({ loginPage }) => {
    // 더 구체적인 locator로 소셜 로그인 확인
    await expect(loginPage.googleLoginButton).toBeVisible();
    await expect(loginPage.githubLoginButton).toBeVisible();
  });

  test('기능 미리보기 섹션이 표시됨', async ({ loginPage }) => {
    // 섹션 헤더 확인
    await expect(loginPage.featuresPreviewSection).toBeVisible();
    
    // 각 기능 항목 확인 (더 정확한 locator)
    await expect(loginPage.videoUploadFeature).toBeVisible();
    await expect(loginPage.aiSubtitleFeature).toBeVisible();
    await expect(loginPage.translationFeature).toBeVisible();
  });

  test('네비게이션 요소들이 표시됨', async ({ loginPage }) => {
    // 홈으로 돌아가기 링크
    await expect(loginPage.homeLink).toBeVisible();
    
    // 로고 (베이스 페이지에서 상속)
    await expect(loginPage.navigationLogo).toBeVisible();
  });

  test('폼 상호작용 테스트', async ({ loginPage, page }) => {
    // 이메일 입력 테스트
    await loginPage.emailInput.fill('test@example.com');
    await expect(loginPage.emailInput).toHaveValue('test@example.com');
    
    // 비밀번호 입력 테스트
    await loginPage.passwordInput.fill('testpassword');
    await expect(loginPage.passwordInput).toHaveValue('testpassword');
    
    // 폼 제출 시도 (실제 로그인은 하지 않음)
    // 주의: 실제 제출하면 오류가 발생할 수 있으므로 클릭만 확인
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('페이지 간 네비게이션 테스트', async ({ loginPage, page }) => {
    // 로고 클릭으로 홈 이동
    await loginPage.clickLogoToHome();
    await expect(page).toHaveURL('/');
    
    // 다시 로그인 페이지로
    await loginPage.goto();
    
    // 홈 링크로 이동
    await loginPage.goBackToHome();
    await expect(page).toHaveURL('/');
  });
});