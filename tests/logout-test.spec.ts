import { test, expect } from './fixtures/auth.fixture';

test.describe('Logout Functionality Tests', () => {
  test('Logout button works properly', async ({ testUser, page }) => {
    console.log(`📝 테스트 사용자: ${testUser.email}`);
    
    // 1. 로그인
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료');
    
    // 2. 로그아웃 버튼이 보이는지 확인
    const logoutButton = page.getByRole('button', { name: /로그아웃/ });
    await expect(logoutButton).toBeVisible();
    console.log('✅ 로그아웃 버튼 확인');
    
    // 3. 로그아웃 버튼 클릭
    await logoutButton.click();
    console.log('🚪 로그아웃 버튼 클릭');
    
    // 4. 홈페이지로 리다이렉트 확인 (더 긴 타임아웃)
    await expect(page).toHaveURL('/', { timeout: 15000 });
    console.log('✅ 홈페이지로 리다이렉트 확인');
    
    // 5. 다시 대시보드 접근 시도
    await page.goto('/dashboard');
    
    // 6. 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    console.log('✅ 로그아웃 후 대시보드 접근 시 로그인 페이지로 리다이렉트');
    
    console.log('🎉 로그아웃 기능 테스트 완료');
  });

  test('API logout endpoint works independently', async ({ testUser, page }) => {
    console.log(`📝 테스트 사용자: ${testUser.email}`);
    
    // 1. 로그인
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료');
    
    // 2. 직접 API 호출로 로그아웃 및 응답 확인
    const responseData = await page.evaluate(() => {
      return fetch('/api/auth/signout', { method: 'POST' }).then(r => r.json());
    });
    console.log('🚪 로그아웃 API 호출');
    console.log('📋 API 응답:', responseData);
    
    // 3. 페이지 새로고침 후 상태 확인
    await page.reload();
    
    // 4. 대시보드 접근 시도
    await page.goto('/dashboard');
    
    // 5. 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    console.log('✅ API 로그아웃 후 대시보드 접근 시 로그인 페이지로 리다이렉트');
    
    console.log('🎉 API 로그아웃 테스트 완료');
  });

  test('Network timeout fallback works', async ({ testUser, page }) => {
    console.log(`📝 테스트 사용자: ${testUser.email}`);
    
    // 1. 로그인
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료');
    
    // 2. 네트워크 조건 시뮬레이션 (느린 연결)
    await page.route('/api/auth/signout', async route => {
      // 6초 지연 (타임아웃보다 길게)
      await new Promise(resolve => setTimeout(resolve, 6000));
      await route.continue();
    });
    
    // 3. 로그아웃 버튼 클릭
    const logoutButton = page.getByRole('button', { name: /로그아웃/ });
    await logoutButton.click();
    console.log('🚪 로그아웃 버튼 클릭 (네트워크 지연 상황)');
    
    // 4. 타임아웃에도 불구하고 홈페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/', { timeout: 15000 });
    console.log('✅ 네트워크 타임아웃 상황에서도 홈페이지로 리다이렉트');
    
    console.log('🎉 네트워크 타임아웃 처리 테스트 완료');
  });
});