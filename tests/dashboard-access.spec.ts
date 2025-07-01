import { test, expect } from '@playwright/test';

test.describe('대시보드 접근 권한', () => {
  test('인증되지 않은 사용자는 대시보드 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 대시보드에 직접 접근 시도
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login');
    
    // 로그인 페이지 요소들이 표시되는지 확인
    await expect(page.getByText('로그인')).toBeVisible();
    await expect(page.getByText('계정에 로그인하여 AI 자막 생성 서비스를 시작하세요')).toBeVisible();
  });

  test('홈페이지에서 인증되지 않은 사용자에게 로그인 옵션 표시', async ({ page }) => {
    // 홈페이지 방문
    await page.goto('/');
    
    // 로그인 버튼이 표시되는지 확인 (로그인하지 않은 상태)
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible();
    
    // 대시보드 관련 요소들이 표시되지 않는지 확인
    await expect(page.getByText('내 프로젝트')).not.toBeVisible();
    await expect(page.getByText('새 프로젝트')).not.toBeVisible();
  });

  test('프로젝트 상세 페이지도 인증 필요', async ({ page }) => {
    // 임의의 프로젝트 ID로 접근 시도
    await page.goto('/project/test-id');
    
    // 로그인 페이지로 리다이렉트되거나 접근 거부되는지 확인
    // (실제 구현에 따라 다를 수 있음 - 404 페이지 또는 로그인 페이지)
    const url = page.url();
    const hasLoginRedirect = url.includes('/login');
    const hasNotFound = await page.getByText('Not Found').isVisible().catch(() => false);
    
    // 둘 중 하나는 true여야 함 (보안상 인증되지 않은 접근은 차단되어야 함)
    expect(hasLoginRedirect || hasNotFound).toBe(true);
  });

  test('API 라우트도 인증 보호 확인', async ({ page }) => {
    // 브라우저에서 직접 API 접근 (실제로는 서버에서 처리)
    const response = await page.request.get('/api/projects');
    
    // 401 Unauthorized 또는 리다이렉트 응답을 받아야 함
    expect([401, 302, 307]).toContain(response.status());
  });
});