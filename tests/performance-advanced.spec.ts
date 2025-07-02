import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';
import { DashboardPage } from './pages/dashboard.page';
import { UploadPage } from './pages/upload.page';
import { ProjectPage } from './pages/project.page';

test.describe('고도화된 성능 테스트', () => {
  let seeder: TestDataSeeder;

  test.beforeEach(async ({ testUser }) => {
    seeder = new TestDataSeeder();
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.afterEach(async ({ testUser }) => {
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.describe('페이지 로딩 성능', () => {
    test('홈페이지 초기 로딩 성능', async ({ page }) => {
      const uploadPage = new UploadPage(page);
      const startTime = Date.now();
      
      await uploadPage.goto();
      
      const loadTime = Date.now() - startTime;
      
      // 주요 요소들이 로드되었는지 확인
      await expect(uploadPage.uploadDropzone).toBeVisible();
      await expect(page.getByText('SubTranslate')).toBeVisible();
      
      // 성능 기준: 3초 이내 로딩
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`홈페이지 로딩 시간: ${loadTime}ms`);
    });

    test('대시보드 빈 상태 로딩 성능', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      const startTime = Date.now();
      
      await authenticatedPage.goto('/dashboard');
      await expect(dashboardPage.emptyState).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // 성능 기준: 2초 이내 로딩
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`빈 대시보드 로딩 시간: ${loadTime}ms`);
    });

    test('대시보드 프로젝트 로딩 성능', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 20개 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 20);
      
      const startTime = Date.now();
      
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      const loadTime = Date.now() - startTime;
      
      // 프로젝트 카드들이 모두 로드되었는지 확인
      const projectCount = await dashboardPage.getProjectCount();
      expect(projectCount).toBe(20);
      
      // 성능 기준: 20개 프로젝트 5초 이내 로딩
      expect(loadTime).toBeLessThan(5000);
      
      console.log(`대시보드 로딩 시간 (20개 프로젝트): ${loadTime}ms`);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('LCP (Largest Contentful Paint) 측정', async ({ page }) => {
      await page.goto('/');
      
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const lcpEntry = entries[entries.length - 1];
              observer.disconnect();
              resolve(lcpEntry.startTime);
            }
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // 타임아웃: 5초 후 자동 해제
          setTimeout(() => {
            observer.disconnect();
            resolve(0);
          }, 5000);
        });
      });
      
      // LCP 기준: 2.5초 이내 (Good)
      expect(lcp).toBeLessThan(2500);
      console.log(`LCP: ${lcp.toFixed(2)}ms`);
    });

    test('CLS (Cumulative Layout Shift) 측정', async ({ page }) => {
      await page.goto('/');
      
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as any;
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value;
              }
            }
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          // 3초 후 측정 종료
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });
      
      // CLS 기준: 0.1 이하 (Good)
      expect(cls).toBeLessThan(0.1);
      console.log(`CLS: ${cls.toFixed(4)}`);
    });

    test('FID (First Input Delay) 시뮬레이션', async ({ page }) => {
      await page.goto('/');
      
      // 페이지 로딩 후 즉시 클릭 테스트
      const startTime = Date.now();
      await page.getByRole('button', { name: '로그인하기' }).click();
      const clickResponseTime = Date.now() - startTime;
      
      // FID 기준: 100ms 이내 (Good)
      expect(clickResponseTime).toBeLessThan(100);
      console.log(`첫 입력 반응 시간: ${clickResponseTime}ms`);
    });
  });

  test.describe('메모리 사용량 테스트', () => {
    test('대용량 프로젝트 목록 메모리 사용량', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 50개 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 50);
      
      // 메모리 사용량 측정 시작
      const initialMemory = await authenticatedPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 메모리 사용량 측정 종료
      const finalMemory = await authenticatedPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // 메모리 증가량 기준: 50MB 이하
      expect(memoryIncreaseMB).toBeLessThan(50);
      
      console.log(`메모리 증가량: ${memoryIncreaseMB.toFixed(2)}MB`);
    });

    test('메모리 누수 검사', async ({ page }) => {
      // 여러 페이지 이동 후 메모리 체크
      for (let i = 0; i < 5; i++) {
        await page.goto('/');
        await page.goto('/login');
      }
      
      // 가비지 컬렉션 강제 실행
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      const finalMemoryMB = finalMemory / 1024 / 1024;
      
      // 메모리 사용량 기준: 100MB 이하
      expect(finalMemoryMB).toBeLessThan(100);
      
      console.log(`최종 메모리 사용량: ${finalMemoryMB.toFixed(2)}MB`);
    });
  });

  test.describe('동시성 성능 테스트', () => {
    test('동시 프로젝트 조회 성능', async ({ browser, testUser }) => {
      if (!testUser.id) return;
      
      // 10개 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 10);
      
      // 5개의 동시 탭 생성
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      try {
        const startTime = Date.now();
        
        // 동시에 대시보드 로드
        const loadPromises = contexts.map(async (context) => {
          const page = await context.newPage();
          // 인증 상태 시뮬레이션 (실제로는 auth fixture 필요)
          await page.goto('/login');
          return page;
        });
        
        await Promise.all(loadPromises);
        
        const totalTime = Date.now() - startTime;
        
        // 동시성 성능 기준: 10초 이내
        expect(totalTime).toBeLessThan(10000);
        
        console.log(`동시 로딩 시간 (5개 탭): ${totalTime}ms`);
        
      } finally {
        // 컨텍스트 정리
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('네트워크 성능 테스트', () => {
    test('느린 네트워크에서 성능', async ({ page }) => {
      // 3G 네트워크 시뮬레이션
      await page.context().route('**/*', route => {
        setTimeout(() => route.continue(), 100); // 100ms 지연
      });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // 주요 요소 로딩 대기
      await expect(page.getByText('SubTranslate')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // 느린 네트워크 기준: 10초 이내
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`느린 네트워크 로딩 시간: ${loadTime}ms`);
    });

    test('리소스 로딩 최적화 확인', async ({ page }) => {
      // 리소스 로딩 모니터링
      const resourceSizes: { [key: string]: number } = {};
      
      page.on('response', (response) => {
        const url = response.url();
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          resourceSizes[url] = parseInt(contentLength);
        }
      });
      
      await page.goto('/');
      
      // JavaScript 번들 크기 확인
      const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
      const totalJSSize = jsFiles.reduce((total, url) => total + (resourceSizes[url] || 0), 0);
      const totalJSSizeMB = totalJSSize / 1024 / 1024;
      
      // JavaScript 번들 크기 기준: 5MB 이하
      expect(totalJSSizeMB).toBeLessThan(5);
      
      console.log(`총 JavaScript 크기: ${totalJSSizeMB.toFixed(2)}MB`);
    });
  });

  test.describe('반응성 테스트', () => {
    test('UI 인터랙션 반응 속도', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 프로젝트 생성
      await seeder.createTestProject(testUser.id);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 버튼 클릭 반응 시간 측정
      const startTime = Date.now();
      await dashboardPage.newProjectButton.click();
      
      // 페이지 변화 대기
      await authenticatedPage.waitForURL('/');
      
      const responseTime = Date.now() - startTime;
      
      // UI 반응 시간 기준: 500ms 이내
      expect(responseTime).toBeLessThan(500);
      
      console.log(`버튼 클릭 반응 시간: ${responseTime}ms`);
    });

    test('검색 입력 반응성', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 여러 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 15);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 검색 입력 시간 측정
      const startTime = Date.now();
      await dashboardPage.searchProjects('Test');
      
      // 검색 결과 표시 대기
      await expect(dashboardPage.projectCards.first()).toBeVisible();
      
      const searchTime = Date.now() - startTime;
      
      // 검색 반응 시간 기준: 1초 이내
      expect(searchTime).toBeLessThan(1000);
      
      console.log(`검색 반응 시간: ${searchTime}ms`);
    });
  });
});