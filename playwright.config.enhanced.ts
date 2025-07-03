import { defineConfig, devices } from '@playwright/test';
import { CONFIG } from './tests/config/test-config';

/**
 * 고도화된 Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './tests',
  
  // 병렬 실행 설정
  fullyParallel: true,
  workers: CONFIG.parallel.workers,
  
  // 실패 시 재시도
  retries: CONFIG.retry.maxRetries,
  
  // 리포터 설정
  reporter: [
    // 기본 리스트 리포터
    ['list'],
    
    // JSON 리포터
    ['json', { outputFile: 'test-results/results.json' }],
    
    // HTML 리포터
    ['html', { 
      open: process.env.CI ? 'never' : 'on-failure',
      outputFolder: 'test-results/html-report'
    }],
    
    // 커스텀 리포터
    ['./tests/utils/test-reporter.ts', { 
      outputDir: 'test-results'
    }],
    
    // Allure 리포터 (선택사항)
    // ['allure-playwright', { 
    //   outputFolder: 'test-results/allure-results' 
    // }],
  ],

  // 글로벌 설정
  use: {
    // 기본 URL
    baseURL: CONFIG.baseURL || 'http://localhost:3000',
    
    // 타임아웃
    actionTimeout: CONFIG.timeouts.medium,
    navigationTimeout: CONFIG.timeouts.long,
    
    // 스크린샷 및 비디오
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 브라우저 컨텍스트
    ignoreHTTPSErrors: true,
    
    // 로케일
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },

  // 테스트 매치 패턴
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
  ],

  // 무시할 테스트
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],

  // 글로벌 설정 파일
  globalSetup: './tests/config/global-setup.ts',
  globalTeardown: './tests/config/global-teardown.ts',

  // 프로젝트별 설정
  projects: [
    // 데스크톱 브라우저들
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.desktop,
      },
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: CONFIG.viewports.desktop,
      },
    },
    
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: CONFIG.viewports.desktop,
      },
    },

    // 모바일 브라우저들
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: CONFIG.viewports.mobile,
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: CONFIG.viewports.mobile,
      },
    },

    // 태블릿
    {
      name: 'tablet-chrome',
      use: { 
        ...devices['Galaxy Tab S4'],
        viewport: CONFIG.viewports.tablet,
      },
    },

    // 고해상도 데스크톱
    {
      name: 'chromium-4k',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.largeDesktop,
      },
    },

    // API 테스트 전용 (헤드리스)
    {
      name: 'api-tests',
      use: {
        baseURL: CONFIG.api.base,
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
      testMatch: '**/api/**/*.spec.ts',
    },

    // 성능 테스트 전용
    {
      name: 'performance-tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.desktop,
        // 성능 측정을 위한 추가 설정
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-web-bluetooth',
            '--no-sandbox',
          ],
        },
      },
      testMatch: '**/performance*.spec.ts',
      timeout: CONFIG.timeouts.veryLong,
    },

    // 접근성 테스트 전용
    {
      name: 'accessibility-tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.desktop,
      },
      testMatch: '**/accessibility*.spec.ts',
    },

    // 느린 네트워크 시뮬레이션
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.desktop,
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
      testMatch: '**/network*.spec.ts',
    },

    // 인증 테스트 전용
    {
      name: 'auth-tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: CONFIG.viewports.desktop,
        storageState: undefined, // 인증 상태 초기화
      },
      testMatch: '**/auth*.spec.ts',
    },

    // 크로스 브라우저 호환성 테스트
    {
      name: 'compatibility-chromium',
      use: devices['Desktop Chrome'],
      testMatch: '**/compatibility*.spec.ts',
    },
    
    {
      name: 'compatibility-firefox',
      use: devices['Desktop Firefox'],
      testMatch: '**/compatibility*.spec.ts',
    },
    
    {
      name: 'compatibility-webkit',
      use: devices['Desktop Safari'],
      testMatch: '**/compatibility*.spec.ts',
    },
  ],

  // 개발 서버 설정
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: CONFIG.timeouts.long,
    env: {
      NODE_ENV: 'test',
    },
  },

  // 출력 디렉토리
  outputDir: 'test-results/artifacts',
  
  // 스크린샷 디렉토리
  snapshotDir: 'test-results/snapshots',

  // 기대값 설정
  expect: {
    // 시각적 비교 임계값
    threshold: 0.2,
    
    // 애니메이션 비활성화
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
    },
    
    // 기본 타임아웃
    timeout: CONFIG.timeouts.medium,
  },

  // 테스트별 타임아웃
  timeout: CONFIG.timeouts.long,

  // 메타데이터
  metadata: {
    testEnvironment: process.env.NODE_ENV || 'development',
    buildNumber: process.env.BUILD_NUMBER || 'local',
    branch: process.env.BRANCH_NAME || 'local',
    timestamp: new Date().toISOString(),
  },
});

// 환경별 설정 오버라이드
if (process.env.NODE_ENV === 'ci') {
  // CI 환경 설정
  module.exports.use = {
    ...module.exports.use,
    video: 'off',
    screenshot: 'only-on-failure',
    trace: 'off',
  };
  
  module.exports.retries = 2;
  module.exports.workers = 2;
}

if (process.env.DEBUG === 'true') {
  // 디버그 모드 설정
  module.exports.use = {
    ...module.exports.use,
    headless: false,
    slowMo: 1000,
    video: 'on',
    screenshot: 'on',
    trace: 'on',
  };
  
  module.exports.workers = 1;
  module.exports.timeout = CONFIG.timeouts.veryLong * 2;
}