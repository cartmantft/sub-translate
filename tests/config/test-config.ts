/**
 * 테스트 설정 및 상수
 */

export const TEST_CONFIG = {
  // 타임아웃 설정
  timeouts: {
    short: 5000,        // 5초 - 빠른 UI 반응
    medium: 15000,      // 15초 - 일반적인 네트워크 요청
    long: 30000,        // 30초 - 파일 업로드, 처리
    veryLong: 60000,    // 60초 - 대용량 데이터 처리
  },

  // 성능 기준
  performance: {
    pageLoad: {
      good: 2000,       // 2초 이내 - 우수
      acceptable: 5000, // 5초 이내 - 허용 가능
      poor: 10000,      // 10초 이내 - 개선 필요
    },
    
    api: {
      fast: 500,        // 500ms 이내 - 빠름
      acceptable: 2000, // 2초 이내 - 허용 가능
      slow: 5000,       // 5초 이내 - 느림
    },
    
    memory: {
      lightUsage: 50,   // 50MB 이하 - 가벼운 사용량
      normalUsage: 100, // 100MB 이하 - 일반적인 사용량
      heavyUsage: 200,  // 200MB 이하 - 무거운 사용량
    },
    
    coreWebVitals: {
      lcp: {
        good: 2500,     // LCP 2.5초 이내
        needsImprovement: 4000,
      },
      fid: {
        good: 100,      // FID 100ms 이내
        needsImprovement: 300,
      },
      cls: {
        good: 0.1,      // CLS 0.1 이하
        needsImprovement: 0.25,
      },
    },
  },

  // 테스트 데이터 설정
  testData: {
    users: {
      maxTestUsers: 10,
      defaultEmail: 'test@example.com',
      defaultPassword: 'testpassword123',
    },
    
    projects: {
      maxTestProjects: 100,
      defaultTitle: 'Test Project',
      bulkTestSize: 50,    // 대량 테스트용 프로젝트 수
      performanceTestSize: 20, // 성능 테스트용 프로젝트 수
    },
    
    files: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['mp4', 'mov', 'avi', 'mkv'],
      testVideoUrl: '/test-assets/sample-video.mp4',
    },
  },

  // 뷰포트 설정
  viewports: {
    mobile: {
      width: 375,
      height: 667,
      name: 'iPhone SE',
    },
    tablet: {
      width: 768,
      height: 1024,
      name: 'iPad',
    },
    desktop: {
      width: 1200,
      height: 800,
      name: 'Desktop',
    },
    largeDesktop: {
      width: 1920,
      height: 1080,
      name: 'Large Desktop',
    },
  },

  // API 엔드포인트
  api: {
    base: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      transcribe: '/api/transcribe',
      translate: '/api/translate',
      upload: '/api/upload',
    },
  },

  // 데이터베이스 설정
  database: {
    tables: {
      projects: 'projects',
      users: 'users',
    },
    
    cleanupInterval: 5 * 60 * 1000, // 5분마다 정리
    maxRetentionDays: 7,            // 7일 후 테스트 데이터 삭제
  },

  // 브라우저 설정
  browsers: {
    headless: process.env.CI === 'true', // CI 환경에서는 headless
    slowMo: process.env.DEBUG === 'true' ? 100 : 0, // 디버그 모드에서 슬로우 모션
    
    chromium: {
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    },
    
    firefox: {
      firefoxUserPrefs: {
        'media.navigator.streams.fake': true,
      },
    },
  },

  // 네트워크 설정
  network: {
    timeout: 30000,
    retries: 3,
    
    // 네트워크 조건 시뮬레이션
    conditions: {
      fast3G: {
        download: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
        upload: 750 * 1024 / 8,          // 750 Kbps
        latency: 150,
      },
      slow3G: {
        download: 500 * 1024 / 8,        // 500 Kbps
        upload: 500 * 1024 / 8,          // 500 Kbps
        latency: 400,
      },
    },
  },

  // 접근성 설정
  accessibility: {
    standards: 'WCAG21AA',
    
    colorContrast: {
      normalText: 4.5,     // WCAG AA 기준
      largeText: 3.0,      // WCAG AA 기준
    },
    
    touchTarget: {
      minSize: 44,         // 최소 44x44 픽셀
    },
    
    focusIndicator: {
      required: true,
      minThickness: 2,     // 최소 2픽셀 두께
    },
  },

  // 로깅 설정
  logging: {
    level: process.env.TEST_LOG_LEVEL || 'info',
    
    categories: {
      performance: true,
      network: false,
      console: true,
      errors: true,
    },
    
    outputDir: './test-results',
    screenshotDir: './test-results/screenshots',
    videoDir: './test-results/videos',
  },

  // 리트라이 설정
  retry: {
    maxRetries: process.env.CI === 'true' ? 2 : 1,
    
    retryOn: [
      'timeout',
      'network',
      'flaky',
    ],
  },

  // 병렬 실행 설정
  parallel: {
    workers: process.env.CI === 'true' ? 2 : 1,
    maxFailures: 5,       // 5개 실패 시 중단
  },

  // 환경별 설정
  environments: {
    development: {
      baseURL: 'http://localhost:3000',
      debugMode: true,
      slowMo: 100,
    },
    
    staging: {
      baseURL: 'https://staging.subtranslate.app',
      debugMode: false,
      slowMo: 0,
    },
    
    production: {
      baseURL: 'https://subtranslate.app',
      debugMode: false,
      slowMo: 0,
      headless: true,
    },
  },
};

// 현재 환경에 따른 설정 병합
const currentEnv = process.env.NODE_ENV || 'development';
export const CONFIG = {
  ...TEST_CONFIG,
  ...TEST_CONFIG.environments[currentEnv as keyof typeof TEST_CONFIG.environments],
};

// 유틸리티 함수들
export const TestUtils = {
  /**
   * 환경별 타임아웃 조정
   */
  getTimeout(type: keyof typeof TEST_CONFIG.timeouts): number {
    const baseTimeout = TEST_CONFIG.timeouts[type];
    const multiplier = process.env.CI === 'true' ? 2 : 1; // CI에서는 2배
    return baseTimeout * multiplier;
  },

  /**
   * 성능 기준 확인
   */
  isPerformanceGood(value: number, type: 'pageLoad' | 'api'): boolean {
    return value <= TEST_CONFIG.performance[type].good;
  },

  isPerformanceAcceptable(value: number, type: 'pageLoad' | 'api'): boolean {
    return value <= TEST_CONFIG.performance[type].acceptable;
  },

  /**
   * 테스트 데이터 생성 헬퍼
   */
  generateTestEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@example.com`;
  },

  generateTestProjectTitle(): string {
    const timestamp = Date.now();
    return `Test Project ${timestamp}`;
  },

  /**
   * 브라우저 설정 가져오기
   */
  getBrowserConfig(browserName: string): any {
    return TEST_CONFIG.browsers[browserName as keyof typeof TEST_CONFIG.browsers] || {};
  },

  /**
   * 뷰포트 설정 가져오기
   */
  getViewport(device: keyof typeof TEST_CONFIG.viewports) {
    return TEST_CONFIG.viewports[device];
  },
};

export default CONFIG;