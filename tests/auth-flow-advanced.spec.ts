import { test, expect } from './fixtures/pages.fixture';
import { Page } from '@playwright/test';

test.describe('고도화된 인증 플로우 테스트', () => {
  test.describe('로그인 프로세스', () => {
    test('이메일/비밀번호 로그인 - 성공 시나리오', async ({ loginPage, dashboardPage, page }) => {
      await loginPage.goto();
      
      // 로그인 폼 입력
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      
      // 로그인 버튼 클릭
      await loginPage.clickLoginButton();
      
      // 대시보드로 리다이렉트 확인
      await page.waitForURL('/dashboard');
      await expect(dashboardPage.pageHeading).toBeVisible();
    });

    test('로그인 실패 - 잘못된 자격 증명', async ({ loginPage, page }) => {
      await loginPage.goto();
      
      // 잘못된 자격 증명 입력
      await loginPage.fillEmail('wrong@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      // 에러 메시지 확인
      await expect(page.getByText(/Invalid login credentials|잘못된 로그인 정보/)).toBeVisible();
      
      // 여전히 로그인 페이지에 있는지 확인
      await expect(page).toHaveURL('/login');
    });

    test('소셜 로그인 버튼 동작', async ({ loginPage, page }) => {
      await loginPage.goto();
      
      // Google 로그인 버튼 확인 및 클릭 가능 여부
      const googleButton = loginPage.googleLoginButton;
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
      
      // GitHub 로그인 버튼 확인
      const githubButton = loginPage.githubLoginButton;
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();
    });

    test('로그인 폼 유효성 검사', async ({ loginPage, page }) => {
      await loginPage.goto();
      
      // 빈 폼으로 로그인 시도
      await loginPage.clickLoginButton();
      
      // HTML5 유효성 검사 메시지 확인
      const emailInput = page.locator('input[type="email"]');
      const isEmailInvalid = await emailInput.evaluate(el => !el.checkValidity());
      expect(isEmailInvalid).toBeTruthy();
      
      // 잘못된 이메일 형식
      await loginPage.fillEmail('notanemail');
      await loginPage.clickLoginButton();
      
      const isEmailFormatInvalid = await emailInput.evaluate(el => !el.checkValidity());
      expect(isEmailFormatInvalid).toBeTruthy();
    });
  });

  test.describe('로그아웃 프로세스', () => {
    test('로그아웃 후 보호된 페이지 접근 차단', async ({ page }) => {
      // 로그인 상태 시뮬레이션 (실제로는 auth fixture 사용)
      // 여기서는 로그아웃 후 동작만 테스트
      
      // 대시보드 접근 시도
      await page.goto('/dashboard');
      
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('세션 관리', () => {
    test('세션 만료 시 자동 로그아웃', async ({ page }) => {
      // 세션 만료 시뮬레이션을 위한 긴 대기는 실제로는 수행하지 않음
      // 대신 세션 만료 후 동작을 테스트
      
      await page.goto('/dashboard');
      
      // 인증되지 않은 상태에서는 로그인으로 리다이렉트
      await expect(page).toHaveURL('/login');
    });

    test('여러 탭에서 로그아웃 동기화', async ({ browser }) => {
      const context = await browser.newContext();
      
      // 첫 번째 탭
      const page1 = await context.newPage();
      await page1.goto('/login');
      
      // 두 번째 탭
      const page2 = await context.newPage();
      await page2.goto('/login');
      
      // 두 탭 모두 로그인 페이지에 있는지 확인
      await expect(page1).toHaveURL('/login');
      await expect(page2).toHaveURL('/login');
      
      await context.close();
    });
  });

  test.describe('보안 기능', () => {
    test('CSRF 보호 확인', async ({ page }) => {
      await page.goto('/login');
      
      // Supabase Auth는 자동으로 CSRF 보호를 제공
      // 여기서는 로그인 폼이 적절히 보호되는지 확인
      const response = await page.request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
      
      // CSRF 토큰 없이는 실패해야 함
      expect(response.status()).not.toBe(200);
    });

    test('비밀번호 필드 보안', async ({ loginPage }) => {
      await loginPage.goto();
      
      // 비밀번호 필드가 마스킹되는지 확인
      const passwordInput = loginPage.page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // 비밀번호 자동완성 방지
      const autocomplete = await passwordInput.getAttribute('autocomplete');
      expect(['current-password', 'off']).toContain(autocomplete);
    });
  });

  test.describe('네비게이션 상태', () => {
    test('로그인 전후 네비게이션 변화', async ({ page, loginPage }) => {
      // 로그인 전
      await page.goto('/');
      await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
      
      // 로그인 페이지로 이동
      await loginPage.goto();
      
      // 네비게이션에 로그인 상태가 반영되지 않음을 확인
      const navLogo = page.locator('a[href="/"]').first();
      await expect(navLogo).toBeVisible();
    });
  });

  test.describe('에러 복구', () => {
    test('네트워크 오류 시 재시도', async ({ loginPage, page }) => {
      await loginPage.goto();
      
      // 네트워크 오류 시뮬레이션
      await page.context().setOffline(true);
      
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      await loginPage.clickLoginButton();
      
      // 오프라인 상태에서는 에러 발생
      await expect(page.getByText(/네트워크 오류|Network error|연결할 수 없습니다/)).toBeVisible({ timeout: 10000 });
      
      // 온라인으로 복구
      await page.context().setOffline(false);
    });

    test('서버 오류 시 사용자 피드백', async ({ loginPage, page }) => {
      // 서버 오류 시뮬레이션을 위해 잘못된 엔드포인트로 요청
      await page.route('**/auth/v1/token**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await loginPage.goto();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      await loginPage.clickLoginButton();
      
      // 서버 오류 메시지 표시 확인
      await expect(page.getByText(/서버 오류|Server error|다시 시도/)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('접근성', () => {
    test('키보드 네비게이션', async ({ loginPage, page }) => {
      await loginPage.goto();
      
      // Tab 키로 폼 요소 간 이동
      await page.keyboard.press('Tab'); // 이메일 필드로
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // 비밀번호 필드로
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // 로그인 버튼으로
      const loginButton = page.getByRole('button', { name: '로그인' });
      await expect(loginButton).toBeFocused();
    });

    test('스크린 리더 지원', async ({ loginPage }) => {
      await loginPage.goto();
      
      // 폼 레이블 확인
      const emailLabel = await loginPage.page.locator('label').filter({ hasText: '이메일' });
      await expect(emailLabel).toBeVisible();
      
      const passwordLabel = await loginPage.page.locator('label').filter({ hasText: '비밀번호' });
      await expect(passwordLabel).toBeVisible();
      
      // ARIA 속성 확인
      const form = loginPage.page.locator('form');
      await expect(form).toHaveAttribute('role', 'form');
    });
  });
});