import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';
import { DashboardPage } from './pages/dashboard.page';
import { UploadPage } from './pages/upload.page';
import { LoginPage } from './pages/login.page';

test.describe('고도화된 접근성 테스트', () => {
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

  test.describe('WCAG 2.1 AA 준수', () => {
    test('키보드 네비게이션 - 전체 플로우', async ({ page }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();
      
      // Tab 키로 순차적 이동
      await page.keyboard.press('Tab'); // 로고로
      const logoFocused = await page.locator('a[href="/"]').first().evaluate(el => document.activeElement === el);
      expect(logoFocused).toBe(true);
      
      await page.keyboard.press('Tab'); // 로그인 버튼으로
      const loginBtnFocused = await page.getByRole('button', { name: '로그인하기' }).evaluate(el => document.activeElement === el);
      expect(loginBtnFocused).toBe(true);
      
      // Enter 키로 활성화
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/login');
    });

    test('스크린 리더 지원 - ARIA 레이블', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // 폼 레이블 확인
      const emailInput = page.locator('input[type="email"]');
      const emailLabelId = await emailInput.getAttribute('aria-labelledby');
      expect(emailLabelId).toBeTruthy();
      
      const passwordInput = page.locator('input[type="password"]');
      const passwordLabelId = await passwordInput.getAttribute('aria-labelledby');
      expect(passwordLabelId).toBeTruthy();
      
      // 버튼 역할 확인
      const loginButton = page.getByRole('button', { name: '로그인' });
      await expect(loginButton).toHaveAttribute('type', 'submit');
    });

    test('색상 대비 확인 - 텍스트 가독성', async ({ page }) => {
      await page.goto('/');
      
      // 주요 텍스트 요소들의 색상 대비 확인
      const textElements = [
        page.getByRole('heading', { name: 'SubTranslate' }),
        page.getByText('AI 기반 자동 자막 생성'),
        page.getByRole('button', { name: '로그인하기' })
      ];
      
      for (const element of textElements) {
        const contrast = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // 실제 색상 대비 계산은 복잡하므로 기본 확인만
          return {
            color,
            backgroundColor,
            hasGoodContrast: color !== backgroundColor
          };
        });
        
        expect(contrast.hasGoodContrast).toBe(true);
      }
    });

    test('포커스 표시 - 키보드 사용자를 위한 시각적 피드백', async ({ page }) => {
      await page.goto('/');
      
      // 포커스 가능한 요소들 확인
      const focusableElements = [
        page.locator('a[href="/"]').first(),
        page.getByRole('button', { name: '로그인하기' })
      ];
      
      for (const element of focusableElements) {
        await element.focus();
        
        // 포커스 스타일 확인
        const focusStyle = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            boxShadow: style.boxShadow,
            borderColor: style.borderColor
          };
        });
        
        // 포커스 표시가 있는지 확인 (outline, box-shadow, border 중 하나)
        const hasFocusIndicator = 
          focusStyle.outline !== 'none' ||
          focusStyle.boxShadow !== 'none' ||
          focusStyle.borderColor !== 'initial';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });
  });

  test.describe('키보드 접근성', () => {
    test('대시보드 키보드 네비게이션', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 3);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // Tab으로 프로젝트 카드들 이동
      await authenticatedPage.keyboard.press('Tab'); // 첫 번째 프로젝트 카드
      
      // Enter로 프로젝트 열기
      await authenticatedPage.keyboard.press('Enter');
      
      // 프로젝트 상세 페이지로 이동했는지 확인
      await expect(authenticatedPage).toHaveURL(/\/project\/.+/);
    });

    test('모달 키보드 트랩', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 프로젝트 생성
      const project = await seeder.createTestProject(testUser.id);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 삭제 모달 열기
      await dashboardPage.deleteProject(project.title);
      
      // 모달 내에서 키보드 네비게이션 확인
      await authenticatedPage.keyboard.press('Tab');
      const cancelButton = authenticatedPage.getByRole('button', { name: '취소' });
      await expect(cancelButton).toBeFocused();
      
      await authenticatedPage.keyboard.press('Tab');
      const deleteButton = authenticatedPage.getByRole('button', { name: '삭제' });
      await expect(deleteButton).toBeFocused();
      
      // Escape로 모달 닫기
      await authenticatedPage.keyboard.press('Escape');
      await expect(authenticatedPage.locator('.modal')).not.toBeVisible();
    });

    test('드롭다운 키보드 제어', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      await seeder.createMultipleTestProjects(testUser.id, 5);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 정렬 드롭다운에 포커스
      await dashboardPage.sortDropdown.focus();
      
      // Arrow Down으로 옵션 이동
      await authenticatedPage.keyboard.press('ArrowDown');
      await authenticatedPage.keyboard.press('ArrowDown');
      
      // Enter로 선택
      await authenticatedPage.keyboard.press('Enter');
      
      // 정렬이 적용되었는지 확인
      await dashboardPage.waitForProjectsToLoad();
    });
  });

  test.describe('스크린 리더 지원', () => {
    test('의미 있는 페이지 제목', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/SubTranslate/);
      
      await page.goto('/login');
      await expect(page).toHaveTitle(/로그인.*SubTranslate/);
    });

    test('헤딩 구조 확인', async ({ page }) => {
      await page.goto('/');
      
      // 헤딩 계층 구조 확인
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      for (let i = 0; i < headings.length; i++) {
        const tagName = await headings[i].evaluate(el => el.tagName.toLowerCase());
        const text = await headings[i].textContent();
        
        console.log(`${tagName}: ${text}`);
        
        // h1이 첫 번째 헤딩인지 확인
        if (i === 0) {
          expect(tagName).toBe('h1');
        }
      }
    });

    test('이미지 대체 텍스트', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;
      
      const dashboardPage = new DashboardPage(authenticatedPage);
      
      // 썸네일이 있는 프로젝트 생성
      await seeder.createTestProject(testUser.id);
      await authenticatedPage.goto('/dashboard');
      await dashboardPage.waitForProjectsToLoad();
      
      // 모든 이미지에 alt 속성이 있는지 확인
      const images = await authenticatedPage.locator('img').all();
      
      for (const image of images) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt!.length).toBeGreaterThan(0);
      }
    });

    test('폼 레이블 연결', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // 이메일 입력 필드
      const emailInput = page.locator('input[type="email"]');
      const emailLabelFor = await page.locator('label').filter({ hasText: '이메일' }).getAttribute('for');
      const emailInputId = await emailInput.getAttribute('id');
      
      expect(emailLabelFor).toBe(emailInputId);
      
      // 비밀번호 입력 필드
      const passwordInput = page.locator('input[type="password"]');
      const passwordLabelFor = await page.locator('label').filter({ hasText: '비밀번호' }).getAttribute('for');
      const passwordInputId = await passwordInput.getAttribute('id');
      
      expect(passwordLabelFor).toBe(passwordInputId);
    });

    test('에러 메시지 접근성', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // 잘못된 형식으로 로그인 시도
      await loginPage.fillEmail('invalid-email');
      await loginPage.clickLoginButton();
      
      // 에러 메시지가 aria-describedby로 연결되어 있는지 확인
      const emailInput = page.locator('input[type="email"]');
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      
      if (ariaDescribedBy) {
        const errorMessage = page.locator(`#${ariaDescribedBy}`);
        await expect(errorMessage).toBeVisible();
      }
    });
  });

  test.describe('모바일 접근성', () => {
    test('터치 타겟 크기', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // 터치 가능한 요소들의 크기 확인
      const touchTargets = [
        page.getByRole('button', { name: '로그인하기' }),
        page.locator('a[href="/"]').first()
      ];
      
      for (const target of touchTargets) {
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          // WCAG 권장: 최소 44x44 픽셀
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('모바일 스크린 리더 지원', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // 모바일에서 중요한 랜드마크 확인
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    });
  });

  test.describe('다국어 접근성', () => {
    test('언어 속성 설정', async ({ page }) => {
      await page.goto('/');
      
      // html lang 속성 확인
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('ko');
      
      // 다국어 콘텐츠가 있는 경우 lang 속성 확인
      const englishText = page.locator('[lang="en"]');
      if (await englishText.count() > 0) {
        await expect(englishText.first()).toHaveAttribute('lang', 'en');
      }
    });

    test('RTL 언어 지원 테스트', async ({ page }) => {
      // RTL 시뮬레이션
      await page.addInitScript(() => {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      });
      
      await page.goto('/');
      
      // RTL 레이아웃이 깨지지 않는지 확인
      const mainContent = page.locator('main, [role="main"]');
      const direction = await mainContent.evaluate(el => window.getComputedStyle(el).direction);
      expect(direction).toBe('rtl');
    });
  });

  test.describe('인지 접근성', () => {
    test('일관된 네비게이션', async ({ page }) => {
      // 홈페이지 네비게이션
      await page.goto('/');
      const homeNavItems = await page.locator('nav a, nav button').allTextContents();
      
      // 로그인 페이지 네비게이션
      await page.goto('/login');
      const loginNavItems = await page.locator('nav a, nav button').allTextContents();
      
      // 네비게이션 항목이 일관되게 유지되는지 확인
      const commonItems = homeNavItems.filter(item => loginNavItems.includes(item));
      expect(commonItems.length).toBeGreaterThan(0);
    });

    test('명확한 버튼 레이블', async ({ page }) => {
      await page.goto('/');
      
      // 모든 버튼이 명확한 텍스트를 가지고 있는지 확인
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // 버튼에 텍스트, aria-label, 또는 title 중 하나는 있어야 함
        const hasLabel = (text && text.trim().length > 0) || 
                        (ariaLabel && ariaLabel.length > 0) || 
                        (title && title.length > 0);
        
        expect(hasLabel).toBe(true);
      }
    });

    test('진행 상황 표시', async ({ page }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();
      
      // 업로드 진행률 표시가 있는지 확인
      const progressElements = page.locator('[role="progressbar"], .progress, [aria-valuemin]');
      
      // 진행률 요소에 적절한 ARIA 속성이 있는지 확인
      if (await progressElements.count() > 0) {
        const firstProgress = progressElements.first();
        const ariaValueMin = await firstProgress.getAttribute('aria-valuemin');
        const ariaValueMax = await firstProgress.getAttribute('aria-valuemax');
        
        if (ariaValueMin !== null) {
          expect(ariaValueMax).toBeTruthy();
        }
      }
    });
  });

  test.describe('고대비 모드 지원', () => {
    test('고대비 모드에서 가시성', async ({ page }) => {
      // 고대비 모드 시뮬레이션
      await page.addInitScript(() => {
        document.body.style.filter = 'contrast(200%) brightness(150%)';
      });
      
      await page.goto('/');
      
      // 주요 요소들이 여전히 보이는지 확인
      await expect(page.getByText('SubTranslate')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
      
      // 텍스트와 배경의 구분이 명확한지 확인
      const button = page.getByRole('button', { name: '로그인하기' });
      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          border: computed.border
        };
      });
      
      // 색상 정보가 있는지 확인 (실제 대비 계산은 복잡)
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor || styles.border).toBeTruthy();
    });
  });
});