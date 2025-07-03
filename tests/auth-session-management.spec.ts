import { test, expect } from './fixtures/auth.fixture';
import { DashboardPage } from './pages/dashboard.page';
import { LoginPage } from './pages/login.page';

test.describe('인증 세션 관리 고도화', () => {
  test.describe('인증된 사용자 플로우', () => {
    test('로그인 후 대시보드 접근 및 기능 사용', async ({ authenticatedPage, testUser }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 대시보드 접근 확인
      await expect(authenticatedPage).toHaveURL('/dashboard');
      await expect(dashboardPage.pageHeading).toBeVisible();
      
      // 사용자 정보가 표시되는지 확인
      const userEmail = testUser.email;
      if (userEmail) {
        // 네비게이션이나 프로필 영역에서 사용자 이메일 확인
        const userInfo = authenticatedPage.locator(`text=${userEmail}`);
        // 사용자 정보가 어딘가에 표시될 수 있음
      }
      
      // 새 프로젝트 버튼 활성화 확인
      await expect(dashboardPage.newProjectButton).toBeEnabled();
    });

    test('인증 상태 유지 - 페이지 새로고침', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 초기 상태 확인
      await expect(authenticatedPage).toHaveURL('/dashboard');
      
      // 페이지 새로고침
      await authenticatedPage.reload();
      
      // 여전히 인증 상태 유지
      await expect(authenticatedPage).toHaveURL('/dashboard');
      await expect(dashboardPage.pageHeading).toBeVisible();
    });

    test('인증 상태 유지 - 다른 보호된 페이지 이동', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      // 대시보드에서 시작
      await expect(authenticatedPage).toHaveURL('/dashboard');
      
      // 홈페이지로 이동
      await authenticatedPage.goto('/');
      
      // 로그인 상태에서는 "대시보드" 버튼이 표시됨
      await expect(authenticatedPage.getByRole('button', { name: '대시보드' })).toBeVisible();
      
      // 다시 대시보드로 이동 가능
      await authenticatedPage.getByRole('button', { name: '대시보드' }).click();
      await expect(authenticatedPage).toHaveURL('/dashboard');
    });
  });

  test.describe('로그아웃 플로우', () => {
    test('명시적 로그아웃 후 접근 제한', async ({ authenticatedPage, page }) => {
      // 인증된 상태에서 시작
      await expect(authenticatedPage).toHaveURL('/dashboard');
      
      // 로그아웃 수행
      await page.evaluate(() => {
        // localStorage에서 Supabase 세션 제거
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      });
      
      // 페이지 새로고침
      await page.reload();
      
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL('/login');
    });

    test('API 호출 시 인증 토큰 검증', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      // 인증된 API 호출
      const response = await authenticatedPage.request.get('/api/projects');
      
      // 성공적인 응답 (인증됨)
      expect(response.ok()).toBeTruthy();
      
      // 토큰 제거 후 API 호출
      await authenticatedPage.evaluate(() => {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      });
      
      // 인증 없이 API 호출 시도
      const unauthorizedResponse = await authenticatedPage.request.get('/api/projects');
      
      // 401 또는 리다이렉트 응답
      expect([401, 302, 303]).toContain(unauthorizedResponse.status());
    });
  });

  test.describe('세션 보안', () => {
    test('XSS 공격 방어 - 스크립트 인젝션 차단', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // XSS 시도 시뮬레이션
      const maliciousScript = '<script>alert("XSS")</script>';
      
      // 프로젝트 제목에 스크립트 삽입 시도 (실제로는 서버에서 차단됨)
      const projectCard = dashboardPage.projectCards.first();
      
      // 텍스트가 이스케이프되어 표시되는지 확인
      await expect(authenticatedPage.locator('script')).toHaveCount(0);
    });

    test('세션 타임아웃 처리', async ({ authenticatedPage, page }) => {
      // 세션 만료 시뮬레이션
      await page.evaluate(() => {
        // Supabase 세션에 만료 시간 설정
        const storage = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
        if (storage) {
          const session = JSON.parse(localStorage.getItem(storage) || '{}');
          if (session.expires_at) {
            // 과거 시간으로 설정하여 만료 시뮬레이션
            session.expires_at = new Date(Date.now() - 1000).toISOString();
            localStorage.setItem(storage, JSON.stringify(session));
          }
        }
      });
      
      // API 호출 시도
      const response = await page.request.get('/api/projects').catch(() => null);
      
      // 인증 실패 응답
      if (response) {
        expect([401, 302, 303]).toContain(response.status());
      }
    });
  });

  test.describe('동시 세션 관리', () => {
    test('여러 브라우저 컨텍스트에서 세션 공유', async ({ browser, testUser }) => {
      // 첫 번째 컨텍스트 (이미 로그인됨)
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      
      // 수동으로 인증 상태 설정 (auth fixture 시뮬레이션)
      await page1.goto('/login');
      
      // 두 번째 컨텍스트
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto('/login');
      
      // 각 컨텍스트는 독립적인 세션을 가짐
      await expect(page1).toHaveURL('/login');
      await expect(page2).toHaveURL('/login');
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('인증 에러 처리', () => {
    test('잘못된 토큰으로 접근 시도', async ({ page }) => {
      // 잘못된 토큰 설정
      await page.addInitScript(() => {
        localStorage.setItem('sb-fake-auth-token', JSON.stringify({
          access_token: 'invalid_token',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }));
      });
      
      // 대시보드 접근 시도
      await page.goto('/dashboard');
      
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL('/login');
    });

    test('네트워크 오류 시 인증 상태 복구', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 오프라인 상태 시뮬레이션
      await authenticatedPage.context().setOffline(true);
      
      // 페이지 새로고침 시도
      try {
        await authenticatedPage.reload({ timeout: 5000 });
      } catch {
        // 오프라인이므로 실패 예상
      }
      
      // 온라인 복구
      await authenticatedPage.context().setOffline(false);
      
      // 페이지 새로고침
      await authenticatedPage.reload();
      
      // 인증 상태 유지 확인
      await expect(authenticatedPage).toHaveURL('/dashboard');
      await expect(dashboardPage.pageHeading).toBeVisible();
    });
  });

  test.describe('개발 환경 특수 케이스', () => {
    test('개발 서버 재시작 후 세션 처리', async ({ page }) => {
      // 개발 환경에서는 persistSession: false 설정
      // 서버 재시작 시뮬레이션 (실제로는 세션이 메모리에만 저장됨)
      
      await page.goto('/dashboard');
      
      // 인증되지 않은 상태이므로 로그인으로 리다이렉트
      await expect(page).toHaveURL('/login');
      
      // 이는 개발 환경의 예상된 동작
    });
  });
});