import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';
import { APIRequestMocker } from './utils/api-mocks';

test.describe('성능 및 부하 테스트', () => {
  let seeder: TestDataSeeder;
  let apiMocker: APIRequestMocker;

  test.beforeEach(async ({ authenticatedPage, testUser }) => {
    seeder = new TestDataSeeder();
    apiMocker = new APIRequestMocker(authenticatedPage);

    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.afterEach(async ({ authenticatedPage, testUser }) => {
    await apiMocker.clearAllMocks();
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test('페이지 로딩 성능 측정', async ({ page }) => {
    // 성능 메트릭 수집 시작
    await page.goto('/', { waitUntil: 'networkidle' });

    // Core Web Vitals 측정
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Performance Observer로 메트릭 수집
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: any = {};

          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
              metrics.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
              metrics.firstByte = navEntry.responseStart - navEntry.requestStart;
            }
          });

          resolve(metrics);
        });

        observer.observe({ entryTypes: ['navigation'] });

        // 타임아웃 설정
        setTimeout(() => resolve({}), 5000);
      });
    });

    // 성능 기준 검증
    console.log('Page Performance Metrics:', metrics);
    
    // First Byte Time이 1초 이하인지 확인
    if (metrics.firstByte) {
      expect(metrics.firstByte).toBeLessThan(1000);
    }

    // DOM Content Loaded가 2초 이하인지 확인
    if (metrics.domContentLoaded) {
      expect(metrics.domContentLoaded).toBeLessThan(2000);
    }
  });

  test('Largest Contentful Paint (LCP) 측정', async ({ page }) => {
    await page.goto('/');

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry?.startTime || 0);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // 10초 타임아웃
        setTimeout(() => resolve(0), 10000);
      });
    });

    console.log('LCP:', lcp);
    
    // LCP가 2.5초 이하여야 함 (Good 기준)
    expect(lcp).toBeLessThan(2500);
  });

  test('Cumulative Layout Shift (CLS) 측정', async ({ page }) => {
    await page.goto('/');

    // 페이지 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // 5초 후 결과 반환
        setTimeout(() => resolve(clsValue), 5000);
      });
    });

    console.log('CLS:', cls);
    
    // CLS가 0.1 이하여야 함 (Good 기준)
    expect(cls).toBeLessThan(0.1);
  });

  test('대시보드 대량 데이터 렌더링 성능', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 대량 프로젝트 생성 (50개)
    console.log('Creating 50 test projects...');
    const startTime = Date.now();
    
    const projects = await seeder.createMultipleTestProjects(testUser.id, 50);
    
    const creationTime = Date.now() - startTime;
    console.log(`Project creation time: ${creationTime}ms`);

    // 페이지 렌더링 시간 측정
    const renderStartTime = Date.now();
    await authenticatedPage.reload();
    
    // 모든 프로젝트 카드가 로드될 때까지 대기
    await expect(authenticatedPage.locator('.bg-white.rounded-2xl')).toHaveCount(50, { timeout: 15000 });
    
    const renderTime = Date.now() - renderStartTime;
    console.log(`Dashboard render time: ${renderTime}ms`);

    // 렌더링 시간이 5초 이하여야 함
    expect(renderTime).toBeLessThan(5000);

    // 스크롤 성능 테스트
    const scrollStartTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await authenticatedPage.mouse.wheel(0, 500);
      await authenticatedPage.waitForTimeout(100);
    }
    
    const scrollTime = Date.now() - scrollStartTime;
    console.log(`Scroll performance: ${scrollTime}ms for 10 scrolls`);

    // 스크롤 응답시간이 2초 이하여야 함
    expect(scrollTime).toBeLessThan(2000);
  });

  test('메모리 사용량 모니터링', async ({ page }) => {
    // 메모리 사용량 측정 시작
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory);
    }

    // 페이지 여러 번 네비게이션하여 메모리 누수 확인
    const pages = ['/', '/login', '/', '/login', '/'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (initialMemory && finalMemory) {
      console.log('Final memory usage:', finalMemory);
      
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // 메모리 증가가 50% 이하여야 함 (메모리 누수 방지)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });

  test('동시 사용자 시뮬레이션', async ({ browser }) => {
    const numberOfUsers = 5;
    const contexts = [];
    const pages = [];

    // 여러 브라우저 컨텍스트 생성 (동시 사용자 시뮬레이션)
    for (let i = 0; i < numberOfUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }

    const startTime = Date.now();

    // 모든 사용자가 동시에 홈페이지 접근
    const loadPromises = pages.map((page, index) => {
      return page.goto('/', { waitUntil: 'networkidle' });
    });

    await Promise.all(loadPromises);

    const loadTime = Date.now() - startTime;
    console.log(`Concurrent load time for ${numberOfUsers} users: ${loadTime}ms`);

    // 동시 접근 시 로딩 시간이 10초 이하여야 함
    expect(loadTime).toBeLessThan(10000);

    // 각 페이지가 정상적으로 로드되었는지 확인
    for (const page of pages) {
      await expect(page.getByText('SubTranslate')).toBeVisible();
    }

    // 정리
    for (const context of contexts) {
      await context.close();
    }
  });

  test('API 응답 시간 측정', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();
    await apiMocker.mockTranscriptionAPI();
    await apiMocker.mockTranslationAPI();

    await authenticatedPage.goto('/upload');

    // API 호출 시간 측정을 위한 인터셉터 설정
    const apiTimes: Record<string, number> = {};

    authenticatedPage.on('request', (request) => {
      if (request.url().includes('/api/')) {
        const endpoint = new URL(request.url()).pathname;
        apiTimes[endpoint] = Date.now();
      }
    });

    authenticatedPage.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const endpoint = new URL(response.url()).pathname;
        if (apiTimes[endpoint]) {
          const responseTime = Date.now() - apiTimes[endpoint];
          console.log(`API ${endpoint} response time: ${responseTime}ms`);
          
          // API 응답시간이 5초 이하여야 함
          expect(responseTime).toBeLessThan(5000);
        }
      }
    });

    // 파일 업로드 및 처리 시작
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 처리 완료까지 대기
    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible({ timeout: 15000 });
  });

  test('리소스 로딩 최적화 확인', async ({ page }) => {
    // 네트워크 요청 모니터링
    const requests: any[] = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        size: 0
      });
    });

    page.on('response', (response) => {
      const request = requests.find(r => r.url === response.url());
      if (request) {
        request.size = response.headers()['content-length'] || 0;
        request.status = response.status();
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // 리소스 분석
    const totalRequests = requests.length;
    const imageRequests = requests.filter(r => r.resourceType === 'image');
    const jsRequests = requests.filter(r => r.resourceType === 'script');
    const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');

    console.log(`Total requests: ${totalRequests}`);
    console.log(`Image requests: ${imageRequests.length}`);
    console.log(`JavaScript requests: ${jsRequests.length}`);
    console.log(`CSS requests: ${cssRequests.length}`);

    // 최적화 기준 검증
    expect(totalRequests).toBeLessThan(50); // 전체 요청 수 제한
    expect(jsRequests.length).toBeLessThan(10); // JS 파일 수 제한
    expect(cssRequests.length).toBeLessThan(5); // CSS 파일 수 제한

    // 4xx, 5xx 에러 요청이 없는지 확인
    const errorRequests = requests.filter(r => r.status >= 400);
    expect(errorRequests).toHaveLength(0);
  });

  test('이미지 최적화 및 지연 로딩', async ({ page }) => {
    await page.goto('/');

    // 모든 이미지 요소 확인
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        // loading="lazy" 속성 확인
        const loading = await img.getAttribute('loading');
        
        // 첫 번째 이미지가 아니라면 lazy loading이 적용되어야 함
        if (i > 0) {
          expect(loading).toBe('lazy');
        }

        // 이미지 크기 최적화 확인
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          // WebP 또는 AVIF 포맷 사용 권장
          const isOptimizedFormat = src.includes('.webp') || src.includes('.avif');
          if (!isOptimizedFormat) {
            console.warn(`Image not optimized: ${src}`);
          }
        }
      }
    }
  });

  test('JavaScript 번들 크기 분석', async ({ page }) => {
    const jsRequests: any[] = [];

    page.on('response', (response) => {
      if (response.url().includes('.js') && response.status() === 200) {
        jsRequests.push({
          url: response.url(),
          size: parseInt(response.headers()['content-length'] || '0')
        });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const totalJSSize = jsRequests.reduce((total, req) => total + req.size, 0);
    console.log(`Total JavaScript size: ${(totalJSSize / 1024).toFixed(2)} KB`);

    // 메인 번들 크기가 500KB 이하여야 함
    expect(totalJSSize).toBeLessThan(500 * 1024);

    // 개별 JS 파일이 200KB 이하여야 함
    jsRequests.forEach(req => {
      if (req.size > 200 * 1024) {
        console.warn(`Large JS file detected: ${req.url} (${(req.size / 1024).toFixed(2)} KB)`);
      }
      expect(req.size).toBeLessThan(200 * 1024);
    });
  });

  test('프로젝트 검색 성능', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 대량 프로젝트 생성
    await seeder.createMultipleTestProjects(testUser.id, 30);
    await authenticatedPage.reload();

    // 검색 기능이 있는지 확인
    const searchInput = authenticatedPage.locator('input[placeholder*="검색"], input[type="search"]');
    
    if (await searchInput.isVisible()) {
      const searchStartTime = Date.now();

      // 검색어 입력
      await searchInput.fill('Test Project');
      
      // 검색 결과 로딩 대기
      await authenticatedPage.waitForTimeout(500);

      const searchTime = Date.now() - searchStartTime;
      console.log(`Search response time: ${searchTime}ms`);

      // 검색 응답시간이 1초 이하여야 함
      expect(searchTime).toBeLessThan(1000);

      // 검색 결과 확인
      const searchResults = authenticatedPage.locator('.bg-white.rounded-2xl');
      const resultCount = await searchResults.count();
      
      expect(resultCount).toBeGreaterThan(0);
      expect(resultCount).toBeLessThanOrEqual(30);
    }
  });

  test('무한 스크롤 성능 (있는 경우)', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 대량 프로젝트 생성
    await seeder.createMultipleTestProjects(testUser.id, 100);
    await authenticatedPage.reload();

    // 무한 스크롤 요소 확인
    const infiniteScrollContainer = authenticatedPage.locator('.infinite-scroll, [data-testid="infinite-scroll"]');
    
    if (await infiniteScrollContainer.isVisible()) {
      let loadedItems = await authenticatedPage.locator('.bg-white.rounded-2xl').count();
      console.log(`Initially loaded items: ${loadedItems}`);

      // 스크롤하여 추가 아이템 로드
      for (let i = 0; i < 5; i++) {
        const scrollStartTime = Date.now();
        
        await authenticatedPage.mouse.wheel(0, 1000);
        
        // 새 아이템 로딩 대기
        await authenticatedPage.waitForFunction(
          (currentCount) => {
            return document.querySelectorAll('.bg-white.rounded-2xl').length > currentCount;
          },
          loadedItems,
          { timeout: 3000 }
        );

        const scrollTime = Date.now() - scrollStartTime;
        console.log(`Scroll load time ${i + 1}: ${scrollTime}ms`);

        // 스크롤 로딩 시간이 2초 이하여야 함
        expect(scrollTime).toBeLessThan(2000);

        loadedItems = await authenticatedPage.locator('.bg-white.rounded-2xl').count();
        console.log(`Total loaded items: ${loadedItems}`);
      }
    }
  });
});