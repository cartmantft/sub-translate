import { test, expect } from './fixtures/auth.fixture';

test.describe('실제 로그인 플로우 테스트', () => {
  test('테스트 사용자로 로그인 후 대시보드 접근', async ({ testUser, page }) => {
    console.log(`📝 테스트 사용자 생성: ${testUser.email}`);
    
    // 1. 로그인 페이지로 이동
    await page.goto('/login');
    console.log('🔗 로그인 페이지 접근');
    
    // 2. 로그인 폼 입력
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    console.log('📋 로그인 정보 입력 완료');
    
    // 3. 로그인 버튼 클릭
    await page.locator('button[type="submit"]').click();
    console.log('🔘 로그인 버튼 클릭');
    
    // 4. 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 대시보드 페이지 리다이렉트 성공');
    
    // 5. 대시보드 기본 요소 확인
    await expect(page.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
    console.log('✅ 대시보드 "내 프로젝트" 제목 확인');
    
    // 6. 로그인 상태에서 새 프로젝트 버튼 확인
    const newProjectButton = page.getByRole('button', { name: /새 프로젝트/ });
    if (await newProjectButton.count() > 0) {
      await expect(newProjectButton.first()).toBeVisible();
      console.log('✅ "새 프로젝트" 버튼 확인');
    }
    
    console.log('🎉 로그인 → 대시보드 접근 시나리오 완료');
  });

  test('인증된 사용자가 대시보드에서 기본 요소들을 볼 수 있음', async ({ authenticatedPage }) => {
    console.log('🔐 인증된 페이지 사용 (이미 로그인됨)');
    
    // 이미 authenticatedPage fixture가 로그인을 완료함
    await expect(authenticatedPage).toHaveURL('/dashboard');
    console.log('✅ 대시보드 URL 확인');
    
    // 대시보드 기본 구조 확인
    await expect(authenticatedPage.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
    console.log('✅ 페이지 제목 확인');
    
    // 네비게이션 바 확인
    const nav = authenticatedPage.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
      console.log('✅ 네비게이션 바 확인');
    }
    
    // 메인 콘텐츠 영역 확인
    const mainContent = authenticatedPage.locator('main').or(
      authenticatedPage.locator('[role="main"]')
    );
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
      console.log('✅ 메인 콘텐츠 영역 확인');
    }
    
    console.log('🎉 인증된 사용자 대시보드 기본 요소 확인 완료');
  });

  test('로그인 → 로그아웃 → 다시 대시보드 접근 시도', async ({ testUser, page }) => {
    console.log(`📝 테스트 사용자: ${testUser.email}`);
    
    // 1. 로그인
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료');
    
    // 2. 로그아웃 (직접 API 호출로 로그아웃)
    await page.evaluate(() => {
      return fetch('/auth/logout', { method: 'POST' });
    });
    console.log('🚪 로그아웃 API 호출');
    
    // 3. 다시 대시보드 접근 시도
    await page.goto('/dashboard');
    
    // 4. 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    console.log('✅ 로그아웃 후 대시보드 접근 시 로그인 페이지로 리다이렉트');
    
    console.log('🎉 로그인 → 로그아웃 → 접근 차단 시나리오 완료');
  });

  test('여러 탭에서 동일한 세션 유지 확인', async ({ testUser, context }) => {
    console.log(`📝 멀티탭 테스트 사용자: ${testUser.email}`);
    
    // 첫 번째 탭에서 로그인
    const page1 = await context.newPage();
    await page1.goto('/login');
    await page1.locator('input[type="email"]').fill(testUser.email);
    await page1.locator('input[type="password"]').fill(testUser.password);
    await page1.locator('button[type="submit"]').click();
    
    await expect(page1).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 첫 번째 탭에서 로그인 완료');
    
    // 두 번째 탭에서 대시보드 직접 접근
    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    
    // 세션이 공유되어 로그인 없이 대시보드 접근 가능해야 함
    await expect(page2).toHaveURL('/dashboard', { timeout: 5000 });
    await expect(page2.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
    console.log('✅ 두 번째 탭에서 세션 공유 확인');
    
    await page1.close();
    await page2.close();
    
    console.log('🎉 멀티탭 세션 공유 테스트 완료');
  });
});