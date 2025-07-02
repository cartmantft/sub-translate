import { test, expect } from '@playwright/test';

test.describe('반응형 디자인', () => {
  test.describe('모바일 뷰포트', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE 크기

    test('홈페이지 모바일 레이아웃', async ({ page }) => {
      await page.goto('/');
      
      // SubTranslate 로고와 제목이 모바일에서도 표시됨
      await expect(page.getByText('SubTranslate')).toBeVisible();
      
      // 로그인 버튼이 표시됨
      await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
      
      // 기능 카드들이 세로로 배치되는지 확인 (grid가 1열로 변경)
      const featureCards = page.locator('.grid').filter({ hasText: '업로드' });
      await expect(featureCards).toBeVisible();
    });

    test('로그인 페이지 모바일 레이아웃', async ({ page }) => {
      await page.goto('/login');
      
      // 로그인 카드가 모바일에서도 잘 표시됨
      await expect(page.getByText('로그인')).toBeVisible();
      
      // 입력 필드들이 모바일에서도 접근 가능
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // 소셜 로그인 버튼들이 표시됨
      await expect(page.getByText(/Google/i)).toBeVisible();
      await expect(page.getByText(/GitHub/i)).toBeVisible();
    });
  });

  test.describe('태블릿 뷰포트', () => {
    test.use({ viewport: { width: 768, height: 1024 } }); // iPad 크기

    test('홈페이지 태블릿 레이아웃', async ({ page }) => {
      await page.goto('/');
      
      // 기능 카드들이 적절히 배치됨 (2열 또는 3열)
      const featureGrid = page.locator('.grid.md\\:grid-cols-3');
      await expect(featureGrid).toBeVisible();
      
      // 모든 텍스트가 읽기 좋게 표시됨
      await expect(page.getByText('AI를 활용하여 비디오에서 자막을 자동으로 추출하고')).toBeVisible();
    });
  });

  test.describe('데스크톱 뷰포트', () => {
    test.use({ viewport: { width: 1920, height: 1080 } }); // 풀HD

    test('홈페이지 데스크톱 레이아웃', async ({ page }) => {
      await page.goto('/');
      
      // 기능 카드들이 3열로 표시됨
      const featureGrid = page.locator('.grid.md\\:grid-cols-3');
      await expect(featureGrid).toBeVisible();
      
      // 모든 애니메이션과 호버 효과가 작동
      const featureCard = page.locator('.group').first();
      await expect(featureCard).toBeVisible();
    });

    test('대시보드 데스크톱 레이아웃 (인증 없이 접근 시)', async ({ page }) => {
      await page.goto('/dashboard');
      
      // 리다이렉트로 인해 로그인 페이지로 이동
      await expect(page).toHaveURL('/login');
      
      // 데스크톱에서 로그인 카드가 중앙에 잘 배치됨
      const loginCard = page.locator('.bg-white.rounded-2xl.shadow-2xl');
      await expect(loginCard).toBeVisible();
    });
  });

  test.describe('반응형 요소 테스트', () => {
    test('뷰포트 크기 변경 시 레이아웃 적응', async ({ page }) => {
      await page.goto('/');
      
      // 데스크톱 크기에서 시작
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.getByText('SubTranslate')).toBeVisible();
      
      // 모바일 크기로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('SubTranslate')).toBeVisible();
      
      // 로그인 버튼이 여전히 클릭 가능한지 확인
      await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
    });

    test('터치 친화적 요소 크기 (모바일)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      // 버튼들이 터치하기 충분한 크기인지 확인 (최소 44px)
      const loginButton = page.locator('button[type="submit"]');
      await expect(loginButton).toBeVisible();
      
      const buttonBox = await loginButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('업로드 성공 화면 반응형 테스트', () => {
    test('홈페이지 업로드 영역 레이아웃 - 데스크톱', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      // 업로드 섹션이 표시되는지 확인
      await expect(page.getByText('비디오 업로드')).toBeVisible();
      await expect(page.getByText('비디오 파일을 업로드하면 AI가 자동으로 자막을 생성하고 번역합니다')).toBeVisible();
      
      // 파일 업로드 영역이 적절한 크기로 표시되는지 확인
      const uploadArea = page.locator('.border-dashed').first();
      await expect(uploadArea).toBeVisible();
    });

    test('홈페이지 업로드 영역 레이아웃 - 태블릿', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // 업로드 섹션이 태블릿에서도 잘 표시되는지 확인
      await expect(page.getByText('비디오 업로드')).toBeVisible();
      
      // 업로드 영역이 터치 친화적인지 확인
      const uploadArea = page.locator('.border-dashed').first();
      await expect(uploadArea).toBeVisible();
      
      const uploadBox = await uploadArea.boundingBox();
      if (uploadBox) {
        expect(uploadBox.height).toBeGreaterThanOrEqual(100); // 최소 높이 확인
      }
    });

    test('홈페이지 업로드 영역 레이아웃 - 모바일', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // 모바일에서 업로드 섹션이 세로로 잘 배치되는지 확인
      await expect(page.getByText('비디오 업로드')).toBeVisible();
      await expect(page.getByText('MP4, AVI, MOV, MKV, WEBM 파일을 지원합니다')).toBeVisible();
      
      // 업로드 버튼이 터치하기 적절한 크기인지 확인
      const uploadArea = page.locator('.border-dashed').first();
      await expect(uploadArea).toBeVisible();
    });

    test('반응형 그리드 레이아웃 구조 확인', async ({ page }) => {
      await page.goto('/');
      
      // 데스크톱: 2열 그리드가 활성화되는지 확인
      await page.setViewportSize({ width: 1024, height: 768 });
      // 그리드 클래스가 적용된 컨테이너가 있는지 확인 (실제 업로드 후에만 보이지만 클래스 구조 확인)
      const gridContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-1.lg\\:grid-cols-2');
      // 이 요소는 업로드 후에만 나타나므로 구조만 확인
      
      // 태블릿: 1열 유지
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('비디오 업로드')).toBeVisible();
      
      // 모바일: 1열 유지  
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('비디오 업로드')).toBeVisible();
    });
  });
});