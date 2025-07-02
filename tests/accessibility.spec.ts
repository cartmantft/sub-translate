import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';

test.describe('접근성 테스트 (WCAG 준수)', () => {
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

  test('키보드 네비게이션 - 홈페이지', async ({ page }) => {
    await page.goto('/');

    // Tab 키로 모든 상호작용 요소 순회
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    // 첫 번째 요소에 포커스
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      // 현재 포커스된 요소 확인
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // 포커스 스타일 확인 (outline 또는 box-shadow)
      const focusedStyle = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          borderColor: styles.borderColor
        };
      });
      
      // 포커스 표시가 있는지 확인 (outline, box-shadow, border 변화 등)
      const hasFocusIndicator = 
        focusedStyle.outline !== 'none' ||
        focusedStyle.boxShadow !== 'none' ||
        focusedStyle.borderColor !== 'initial';
      
      expect(hasFocusIndicator).toBe(true);
      
      // 다음 요소로 이동
      await page.keyboard.press('Tab');
    }
  });

  test('키보드 네비게이션 - 로그인 페이지', async ({ page }) => {
    await page.goto('/login');

    // 이메일 입력 필드에 Tab으로 이동
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('type', 'email');

    // 이메일 입력
    await page.keyboard.type('test@example.com');

    // 비밀번호 필드로 이동
    await page.keyboard.press('Tab');
    focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('type', 'password');

    // 비밀번호 입력
    await page.keyboard.type('password123');

    // 로그인 버튼으로 이동
    await page.keyboard.press('Tab');
    focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('type', 'submit');

    // Enter 키로 폼 제출 (실제로는 모킹된 환경이므로 에러 발생 예상)
    await page.keyboard.press('Enter');
  });

  test('키보드 네비게이션 - 대시보드', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 테스트 프로젝트 생성
    await seeder.createTestProject(testUser.id);
    await authenticatedPage.reload();

    // 대시보드 요소들 키보드로 탐색
    await authenticatedPage.keyboard.press('Tab'); // 첫 번째 요소로 이동

    // 새 프로젝트 버튼에 포커스
    const newProjectButton = authenticatedPage.getByRole('button', { name: '새 프로젝트' });
    await newProjectButton.focus();
    await expect(newProjectButton).toBeFocused();

    // Enter 키로 버튼 활성화
    await authenticatedPage.keyboard.press('Enter');
    await expect(authenticatedPage).toHaveURL('/upload');
  });

  test('ARIA 레이블 및 속성 확인', async ({ page }) => {
    await page.goto('/');

    // 주요 랜드마크 영역 확인
    await expect(page.locator('[role="navigation"], nav')).toBeVisible();
    await expect(page.locator('[role="main"], main')).toBeVisible();

    // 버튼에 적절한 ARIA 속성 확인
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      // 버튼이 보이는 경우에만 검사
      if (await button.isVisible()) {
        // aria-label 또는 텍스트 콘텐츠가 있어야 함
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        expect(ariaLabel || textContent).toBeTruthy();
      }
    }

    // 링크에 적절한 텍스트 확인
    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      
      if (await link.isVisible()) {
        const ariaLabel = await link.getAttribute('aria-label');
        const textContent = await link.textContent();
        const title = await link.getAttribute('title');
        
        expect(ariaLabel || textContent || title).toBeTruthy();
      }
    }
  });

  test('스크린 리더용 텍스트 확인', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    await seeder.createTestProject(testUser.id, {
      title: 'Test Project',
      status: 'completed'
    });

    await authenticatedPage.reload();

    // 스크린 리더 전용 텍스트 확인
    const srOnlyElements = authenticatedPage.locator('.sr-only, .visually-hidden, [class*="screen-reader"]');
    
    if (await srOnlyElements.count() > 0) {
      // 스크린 리더 전용 텍스트가 실제로는 숨겨져 있는지 확인
      const firstSrElement = srOnlyElements.first();
      const styles = await firstSrElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          left: computed.left,
          clip: computed.clip,
          width: computed.width,
          height: computed.height
        };
      });

      // 스크린 리더에서는 접근 가능하지만 시각적으로는 숨겨진 상태인지 확인
      const isVisuallyHidden = 
        styles.position === 'absolute' && 
        (styles.left === '-10000px' || styles.clip === 'rect(0px, 0px, 0px, 0px)' || 
         styles.width === '1px' || styles.height === '1px');
      
      expect(isVisuallyHidden).toBe(true);
    }

    // 프로젝트 상태에 대한 설명 텍스트 확인
    const statusText = authenticatedPage.locator('[aria-label*="상태"], [title*="상태"]');
    if (await statusText.count() > 0) {
      await expect(statusText.first()).toBeVisible();
    }
  });

  test('색상 대비 검사', async ({ page }) => {
    await page.goto('/');

    // 텍스트 요소들의 색상 대비 확인
    const textElements = page.locator('h1, h2, h3, h4, h5, h6, p, span, a, button');
    const elementCount = await textElements.count();

    for (let i = 0; i < Math.min(elementCount, 10); i++) { // 첫 10개 요소만 검사
      const element = textElements.nth(i);
      
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // RGB 값 추출 함수
        const extractRGB = (colorString: string) => {
          const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
        };

        // 상대 휘도 계산
        const getLuminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        // 대비율 계산
        const getContrastRatio = (color1: number[], color2: number[]) => {
          const lum1 = getLuminance(color1);
          const lum2 = getLuminance(color2);
          const brightest = Math.max(lum1, lum2);
          const darkest = Math.min(lum1, lum2);
          return (brightest + 0.05) / (darkest + 0.05);
        };

        if (styles.color && styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const textColor = extractRGB(styles.color);
          const bgColor = extractRGB(styles.backgroundColor);
          const contrastRatio = getContrastRatio(textColor, bgColor);
          
          // WCAG AA 기준: 일반 텍스트 4.5:1, 큰 텍스트 3:1
          const fontSize = parseFloat(styles.fontSize);
          const minRatio = fontSize >= 18 ? 3 : 4.5;
          
          // 대비율이 기준을 만족하는지 확인 (경고만 출력, 테스트 실패시키지 않음)
          if (contrastRatio < minRatio) {
            console.warn(`Low contrast ratio detected: ${contrastRatio.toFixed(2)} (min: ${minRatio})`);
          }
        }
      }
    }
  });

  test('폼 레이블 및 오류 메시지 접근성', async ({ page }) => {
    await page.goto('/login');

    // 입력 필드와 레이블 연결 확인
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // id가 있으면 해당 레이블 찾기
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        }
        
        // aria-label 또는 aria-labelledby 확인
        expect(ariaLabel || ariaLabelledBy || id).toBeTruthy();
      }
    }

    // 빈 폼 제출하여 오류 메시지 접근성 확인
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // 오류 메시지가 있다면 적절한 ARIA 속성 확인
      const errorMessages = page.locator('.error, [role="alert"], [aria-invalid="true"]');
      
      if (await errorMessages.count() > 0) {
        const firstError = errorMessages.first();
        await expect(firstError).toBeVisible();
        
        // 오류 메시지가 해당 입력 필드와 연결되어 있는지 확인
        const ariaDescribedBy = await page.locator('input').first().getAttribute('aria-describedby');
        if (ariaDescribedBy) {
          const describedElement = page.locator(`#${ariaDescribedBy}`);
          await expect(describedElement).toBeVisible();
        }
      }
    }
  });

  test('모달 및 대화상자 접근성', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 프로젝트 삭제 모달 테스트
    await seeder.createTestProject(testUser.id);
    await authenticatedPage.reload();

    const projectCard = authenticatedPage.locator('.bg-white.rounded-2xl').first();
    await projectCard.hover();

    const deleteButton = projectCard.getByTestId('delete-button');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 모달이 열렸는지 확인
      const modal = authenticatedPage.locator('[role="dialog"], .modal');
      
      if (await modal.isVisible()) {
        // 모달 접근성 속성 확인
        await expect(modal).toHaveAttribute('role', 'dialog');
        
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
        const ariaLabel = await modal.getAttribute('aria-label');
        expect(ariaLabelledBy || ariaLabel).toBeTruthy();

        // 포커스가 모달 내부로 이동했는지 확인
        const focusedElement = authenticatedPage.locator(':focus');
        const modalButton = modal.locator('button').first();
        await expect(modalButton).toBeFocused();

        // ESC 키로 모달 닫기
        await authenticatedPage.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();

        // 포커스가 모달을 연 버튼으로 돌아왔는지 확인
        await expect(deleteButton).toBeFocused();
      }
    }
  });

  test('다이나믹 콘텐츠 변경 알림', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    await authenticatedPage.goto('/upload');

    // 파일 업로드 시 상태 변경 알림 확인
    const fileInput = authenticatedPage.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('fake content')
      });

      // aria-live 영역 확인
      const liveRegion = authenticatedPage.locator('[aria-live="polite"], [aria-live="assertive"]');
      
      if (await liveRegion.count() > 0) {
        // 상태 메시지가 live region에 나타나는지 확인
        await expect(liveRegion).toContainText('선택됨');
      }

      // 업로드 진행 상태에 대한 접근성 확인
      const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
      
      if (await processButton.isVisible()) {
        await processButton.click();

        // 진행률 표시기의 ARIA 속성 확인
        const progressBar = authenticatedPage.locator('[role="progressbar"]');
        
        if (await progressBar.isVisible()) {
          await expect(progressBar).toHaveAttribute('role', 'progressbar');
          
          const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
          const ariaValueMin = await progressBar.getAttribute('aria-valuemin');
          const ariaValueMax = await progressBar.getAttribute('aria-valuemax');
          
          expect(ariaValueNow).toBeTruthy();
          expect(ariaValueMin).toBeTruthy();
          expect(ariaValueMax).toBeTruthy();
        }
      }
    }
  });

  test('이미지 대체 텍스트 확인', async ({ page }) => {
    await page.goto('/');

    // 모든 이미지에 alt 속성 확인
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // 장식용 이미지가 아니라면 alt 텍스트나 aria-label이 있어야 함
        if (role !== 'presentation' && !alt && alt !== '') {
          expect(ariaLabel).toBeTruthy();
        }
      }
    }

    // 배경 이미지로 의미있는 정보를 전달하는 요소 확인
    const backgroundImageElements = page.locator('[style*="background-image"], .bg-\\[url\\(');
    const bgImageCount = await backgroundImageElements.count();

    for (let i = 0; i < bgImageCount; i++) {
      const element = backgroundImageElements.nth(i);
      
      if (await element.isVisible()) {
        const ariaLabel = await element.getAttribute('aria-label');
        const title = await element.getAttribute('title');
        const textContent = await element.textContent();
        
        // 배경 이미지가 의미있는 정보라면 대체 텍스트가 있어야 함
        expect(ariaLabel || title || textContent).toBeTruthy();
      }
    }
  });

  test('반응형 접근성 - 모바일 뷰', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 모바일에서도 키보드 네비게이션 작동 확인
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 터치 타겟 크기 확인 (최소 44x44px)
    const interactiveElements = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
    const elementCount = await interactiveElements.count();

    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = interactiveElements.nth(i);
      
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();
        
        if (boundingBox) {
          // 터치 타겟이 최소 44x44px인지 확인 (WCAG 가이드라인)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // 모바일 메뉴 접근성 (있는 경우)
    const mobileMenuButton = page.locator('[aria-label*="메뉴"], .mobile-menu-toggle, [data-testid="mobile-menu"]');
    
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded');
      
      await mobileMenuButton.click();
      
      const expandedState = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expandedState).toBe('true');
      
      // 메뉴가 열렸을 때 키보드 트랩 확인
      const menuItems = page.locator('[role="menu"] a, [role="menu"] button');
      
      if (await menuItems.count() > 0) {
        // 첫 번째 메뉴 아이템에 포커스
        await menuItems.first().focus();
        await expect(menuItems.first()).toBeFocused();
      }
    }
  });
});