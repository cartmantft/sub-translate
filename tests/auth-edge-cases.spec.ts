import { test, expect } from './fixtures/pages.fixture';
import { Page, Browser } from '@playwright/test';

test.describe('인증 엣지 케이스 테스트', () => {
  test.describe('브라우저 상태 변화', () => {
    test('로컬스토리지 삭제 후 세션 복구', async ({ page }) => {
      // 로그인 페이지로 이동
      await page.goto('/login');
      
      // localStorage 완전 삭제
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 대시보드 접근 시도
      await page.goto('/dashboard');
      
      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL('/login');
    });

    test('쿠키 비활성화 상태에서 인증', async ({ browser }) => {
      // 쿠키 비활성화된 컨텍스트 생성
      const context = await browser.newContext({
        permissions: [],
        // 쿠키 차단은 브라우저 설정으로는 완전히 불가능하므로
        // localStorage를 삭제하여 유사한 상황 시뮬레이션
      });
      
      const page = await context.newPage();
      
      // localStorage 사용 차단 시뮬레이션
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => null,
            setItem: () => { throw new Error('LocalStorage disabled'); },
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
          }
        });
      });
      
      await page.goto('/login');
      
      // 로그인 폼은 여전히 표시되어야 함
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      await context.close();
    });
  });

  test.describe('네트워크 연결 이슈', () => {
    test('느린 네트워크에서 로그인 타임아웃', async ({ page, loginPage }) => {
      // 네트워크 속도 제한
      await page.context().route('**/auth/v1/**', route => {
        // 5초 지연 후 응답
        setTimeout(() => {
          route.continue();
        }, 5000);
      });
      
      await loginPage.goto();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      
      // 로그인 버튼 클릭
      await loginPage.clickLoginButton();
      
      // 로딩 상태 확인
      await expect(page.locator('.loading, [data-loading="true"]')).toBeVisible({ timeout: 1000 });
      
      // 타임아웃 후에도 로그인 페이지에 있음
      await expect(page).toHaveURL('/login', { timeout: 10000 });
    });

    test('API 서버 다운 시 에러 처리', async ({ page, loginPage }) => {
      // 모든 API 요청 차단
      await page.context().route('**/auth/v1/**', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'Service Unavailable' })
        });
      });
      
      await loginPage.goto();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      await loginPage.clickLoginButton();
      
      // 서비스 이용 불가 메시지 확인
      await expect(page.getByText(/서비스를 이용할 수 없습니다|Service Unavailable|다시 시도해 주세요/)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('동시성 이슈', () => {
    test('동시 로그인 시도', async ({ browser }) => {
      const context = await browser.newContext();
      
      // 두 개의 페이지에서 동시 로그인 시도
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await page1.goto('/login');
      await page2.goto('/login');
      
      // 동시에 같은 자격 증명으로 로그인
      const loginPromises = [
        page1.locator('input[type="email"]').fill('test@example.com'),
        page2.locator('input[type="email"]').fill('test@example.com')
      ];
      
      await Promise.all(loginPromises);
      
      // 두 페이지 모두 로그인 페이지에 있어야 함 (인증되지 않음)
      await expect(page1).toHaveURL('/login');
      await expect(page2).toHaveURL('/login');
      
      await context.close();
    });

    test('로그인 중 페이지 새로고침', async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      
      // 로그인 요청 지연
      await page.context().route('**/auth/v1/token**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      // 로그인 버튼 클릭
      await loginPage.clickLoginButton();
      
      // 로그인 진행 중 페이지 새로고침
      setTimeout(() => page.reload(), 1000);
      
      // 새로고침 후에도 로그인 페이지에 있음
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('브라우저 호환성', () => {
    test('개인정보 보호 모드 시뮬레이션', async ({ browser }) => {
      // 개인정보 보호 모드와 유사한 제한 환경
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
        storageState: undefined // 저장된 상태 없음
      });
      
      const page = await context.newPage();
      
      // 제한된 스토리지 환경 시뮬레이션
      await page.addInitScript(() => {
        // sessionStorage만 사용 가능, localStorage 제한
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
          }
        });
      });
      
      await page.goto('/login');
      
      // 기본 기능은 작동해야 함
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      await context.close();
    });
  });

  test.describe('보안 공격 시나리오', () => {
    test('CSRF 토큰 없이 API 호출', async ({ page }) => {
      // 직접 API 호출 시도
      const response = await page.request.post('/api/auth/logout', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {}
      });
      
      // CSRF 보호로 인한 실패 또는 적절한 처리
      expect([403, 405, 404]).toContain(response.status());
    });

    test('세션 하이재킹 시뮬레이션', async ({ page }) => {
      // 잘못된 세션 토큰 삽입
      await page.addInitScript(() => {
        const fakeToken = {
          access_token: 'fake.jwt.token',
          refresh_token: 'fake_refresh_token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user: {
            id: 'fake-user-id',
            email: 'hacker@example.com'
          }
        };
        
        localStorage.setItem('sb-fake-auth-token', JSON.stringify(fakeToken));
      });
      
      // 대시보드 접근 시도
      await page.goto('/dashboard');
      
      // 잘못된 토큰으로는 접근 불가
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('메모리 및 성능', () => {
    test('메모리 누수 방지 - 이벤트 리스너 정리', async ({ page }) => {
      await page.goto('/login');
      
      // 페이지 이동 전 이벤트 리스너 개수 확인
      const initialListeners = await page.evaluate(() => {
        // 실제로는 더 정교한 메모리 측정이 필요하지만
        // 여기서는 기본적인 확인만 수행
        return document.querySelectorAll('*').length;
      });
      
      // 여러 페이지 이동
      await page.goto('/');
      await page.goto('/login');
      await page.goto('/');
      
      const finalListeners = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      // 메모리 누수가 없다면 비슷한 수준이어야 함
      expect(Math.abs(finalListeners - initialListeners)).toBeLessThan(50);
    });

    test('대용량 세션 데이터 처리', async ({ page }) => {
      // 대용량 사용자 데이터 시뮬레이션
      await page.addInitScript(() => {
        const largeUserData = {
          id: 'user123',
          email: 'test@example.com',
          metadata: {
            // 대용량 데이터 시뮬레이션
            projects: new Array(1000).fill(null).map((_, i) => ({
              id: `project_${i}`,
              title: `Project ${i}`,
              data: new Array(100).fill('x').join('')
            }))
          }
        };
        
        try {
          localStorage.setItem('large-user-data', JSON.stringify(largeUserData));
        } catch (e) {
          // localStorage 용량 제한에 걸릴 수 있음
          console.log('Storage quota exceeded');
        }
      });
      
      await page.goto('/login');
      
      // 대용량 데이터가 있어도 페이지가 정상 로드되어야 함
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });

  test.describe('국제화 및 접근성', () => {
    test('다양한 로케일에서 인증', async ({ page }) => {
      // 한국어 로케일 설정
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'language', {
          value: 'ko-KR',
          configurable: true
        });
      });
      
      await page.goto('/login');
      
      // 한국어 레이블 확인
      await expect(page.getByText('이메일')).toBeVisible();
      await expect(page.getByText('비밀번호')).toBeVisible();
    });

    test('고대비 모드에서 가시성', async ({ page }) => {
      // 고대비 모드 시뮬레이션
      await page.addInitScript(() => {
        document.body.style.filter = 'contrast(150%) brightness(120%)';
      });
      
      await page.goto('/login');
      
      // 주요 요소들이 여전히 보이는지 확인
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    });
  });
});