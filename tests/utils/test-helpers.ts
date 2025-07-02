import { Page, Locator } from '@playwright/test';

/**
 * 고급 테스트 헬퍼 유틸리티
 */
export class TestHelpers {
  /**
   * 요소가 완전히 로드될 때까지 대기
   */
  static async waitForElementToLoad(locator: Locator, timeout = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.waitFor({ state: 'attached', timeout });
  }

  /**
   * 네트워크 대기 상태까지 기다리기
   */
  static async waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * 요소가 애니메이션을 완료할 때까지 대기
   */
  static async waitForAnimationComplete(locator: Locator): Promise<void> {
    await locator.evaluate((element) => {
      return new Promise<void>((resolve) => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          element.removeEventListener('transitionend', handleAnimationEnd);
          resolve();
        };

        element.addEventListener('animationend', handleAnimationEnd);
        element.addEventListener('transitionend', handleAnimationEnd);

        // 애니메이션이 없는 경우를 위한 타임아웃
        setTimeout(resolve, 100);
      });
    });
  }

  /**
   * 요소의 스타일 속성 확인
   */
  static async getComputedStyle(locator: Locator, property: string): Promise<string> {
    return await locator.evaluate((element, prop) => {
      return window.getComputedStyle(element).getPropertyValue(prop);
    }, property);
  }

  /**
   * 요소가 뷰포트에 완전히 보이는지 확인
   */
  static async isElementInViewport(locator: Locator): Promise<boolean> {
    return await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    });
  }

  /**
   * 스크롤하여 요소를 뷰포트에 표시
   */
  static async scrollToElement(locator: Locator): Promise<void> {
    await locator.evaluate((element) => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // 스크롤 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * 요소의 바운딩 박스 정보 가져오기
   */
  static async getBoundingBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await locator.boundingBox();
  }

  /**
   * 텍스트 내용 정규화 (공백 제거, 소문자 변환)
   */
  static normalizeText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * 랜덤 문자열 생성
   */
  static generateRandomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 랜덤 이메일 생성
   */
  static generateRandomEmail(): string {
    const username = this.generateRandomString(8);
    const domain = 'test.example.com';
    return `${username}@${domain}`;
  }

  /**
   * 요소가 특정 클래스를 가지고 있는지 확인
   */
  static async hasClass(locator: Locator, className: string): Promise<boolean> {
    const classAttribute = await locator.getAttribute('class');
    return classAttribute ? classAttribute.split(' ').includes(className) : false;
  }

  /**
   * 요소의 텍스트 내용이 특정 패턴과 일치하는지 확인
   */
  static async textMatches(locator: Locator, pattern: string | RegExp): Promise<boolean> {
    const text = await locator.textContent();
    if (!text) return false;
    
    if (typeof pattern === 'string') {
      return text.includes(pattern);
    } else {
      return pattern.test(text);
    }
  }

  /**
   * 여러 요소의 텍스트 내용을 배열로 가져오기
   */
  static async getAllTextContents(locator: Locator): Promise<string[]> {
    const elements = await locator.all();
    const texts: string[] = [];
    
    for (const element of elements) {
      const text = await element.textContent();
      if (text) {
        texts.push(text.trim());
      }
    }
    
    return texts;
  }

  /**
   * 특정 시간만큼 대기
   */
  static async wait(milliseconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * 조건이 충족될 때까지 대기 (폴링)
   */
  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 10000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * 키보드 단축키 실행
   */
  static async pressShortcut(page: Page, shortcut: string): Promise<void> {
    const keys = shortcut.split('+').map(key => key.trim());
    
    // 수정자 키들을 먼저 누르고
    const modifiers = keys.filter(key => ['Control', 'Shift', 'Alt', 'Meta'].includes(key));
    const mainKey = keys.find(key => !['Control', 'Shift', 'Alt', 'Meta'].includes(key));
    
    if (mainKey) {
      let modifierString = '';
      if (modifiers.includes('Control')) modifierString += 'Control+';
      if (modifiers.includes('Shift')) modifierString += 'Shift+';
      if (modifiers.includes('Alt')) modifierString += 'Alt+';
      if (modifiers.includes('Meta')) modifierString += 'Meta+';
      
      await page.keyboard.press(modifierString + mainKey);
    }
  }

  /**
   * 파일 다운로드 대기 및 검증
   */
  static async waitForDownload(page: Page, action: () => Promise<void>): Promise<string> {
    const downloadPromise = page.waitForEvent('download');
    await action();
    const download = await downloadPromise;
    const path = await download.path();
    return path || '';
  }

  /**
   * 로컬 스토리지 조작
   */
  static async setLocalStorage(page: Page, key: string, value: string): Promise<void> {
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key, value }
    );
  }

  static async getLocalStorage(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, key);
  }

  static async clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * 세션 스토리지 조작
   */
  static async setSessionStorage(page: Page, key: string, value: string): Promise<void> {
    await page.addInitScript(
      ({ key, value }) => {
        sessionStorage.setItem(key, value);
      },
      { key, value }
    );
  }

  static async getSessionStorage(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => {
      return sessionStorage.getItem(key);
    }, key);
  }

  /**
   * 쿠키 조작
   */
  static async setCookie(page: Page, name: string, value: string, domain?: string): Promise<void> {
    await page.context().addCookies([{
      name,
      value,
      domain: domain || new URL(page.url()).hostname,
      path: '/'
    }]);
  }

  static async getCookie(page: Page, name: string): Promise<string | undefined> {
    const cookies = await page.context().cookies();
    const cookie = cookies.find(c => c.name === name);
    return cookie?.value;
  }

  /**
   * 네트워크 요청 모니터링
   */
  static async monitorNetworkRequests(
    page: Page,
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ): Promise<any[]> {
    const requests: any[] = [];
    
    const handleRequest = (request: any) => {
      const url = request.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
        
      if (matches) {
        requests.push({
          url,
          method: request.method(),
          postData: request.postData(),
          headers: request.headers()
        });
      }
    };
    
    page.on('request', handleRequest);
    
    try {
      await action();
      return requests;
    } finally {
      page.off('request', handleRequest);
    }
  }

  /**
   * 반응형 테스트를 위한 뷰포트 설정
   */
  static async setMobileViewport(page: Page): Promise<void> {
    await page.setViewportSize({ width: 375, height: 667 });
  }

  static async setTabletViewport(page: Page): Promise<void> {
    await page.setViewportSize({ width: 768, height: 1024 });
  }

  static async setDesktopViewport(page: Page): Promise<void> {
    await page.setViewportSize({ width: 1200, height: 800 });
  }

  /**
   * 성능 메트릭 수집
   */
  static async getPerformanceMetrics(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
      };
    });
  }

  /**
   * 메모리 사용량 측정
   */
  static async getMemoryUsage(page: Page): Promise<number | null> {
    return await page.evaluate(() => {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize : null;
    });
  }

  /**
   * 콘솔 로그 수집
   */
  static setupConsoleLogging(page: Page): string[] {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    return logs;
  }

  /**
   * 에러 수집
   */
  static setupErrorLogging(page: Page): Error[] {
    const errors: Error[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error);
    });
    
    return errors;
  }
}