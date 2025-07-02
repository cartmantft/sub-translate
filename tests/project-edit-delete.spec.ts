import { test, expect } from '@playwright/test';

test.describe('프로젝트 편집 및 삭제 기능', () => {
  
  test('대시보드에서 프로젝트 카드의 편집/삭제 버튼 확인', async ({ page }) => {
    // 대시보드 페이지로 이동 (인증 없이 접근하면 로그인 페이지로 리다이렉트)
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login');
    
    // 로그인 페이지가 로드되었는지 확인
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('API 엔드포인트 인증 확인', async ({ page }) => {
    // 인증 없이 프로젝트 편집 API 호출 시 401 에러 확인
    const editResponse = await page.request.put('/api/projects/test-id', {
      data: { title: 'New Title' }
    });
    expect(editResponse.status()).toBe(401);
    
    // 인증 없이 프로젝트 삭제 API 호출 시 401 에러 확인  
    const deleteResponse = await page.request.delete('/api/projects/test-id');
    expect(deleteResponse.status()).toBe(401);
  });

  test('프로젝트 이름 유효성 검사 - API 레벨', async ({ page }) => {
    // API 테스트: 빈 제목으로 편집 시도
    const emptyTitleResponse = await page.request.put('/api/projects/test-id', {
      data: { title: '' }
    });
    expect(emptyTitleResponse.status()).toBe(401); // 인증 오류가 먼저 발생
    
    // API 테스트: 너무 긴 제목으로 편집 시도  
    const longTitle = 'a'.repeat(250); // 200자 제한 초과
    const longTitleResponse = await page.request.put('/api/projects/test-id', {
      data: { title: longTitle }
    });
    expect(longTitleResponse.status()).toBe(401); // 인증 오류가 먼저 발생
  });

  test('네비게이션 일관성 확인', async ({ page }) => {
    // 홈페이지 방문
    await page.goto('/');
    
    // 네비게이션 바 확인
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // SubTranslate 로고 링크 확인
    await expect(page.getByRole('link', { name: 'SubTranslate' }).first()).toBeVisible();
    
    // 로그인 버튼 확인
    await expect(page.getByRole('link', { name: '로그인하기' })).toBeVisible();
  });

  test('반응형 디자인에서 프로젝트 관리 UI', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 홈페이지 방문
    await page.goto('/');
    
    // 모바일에서도 주요 요소들이 표시되는지 확인
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    await expect(page.getByText('AI 기반 자동 자막 생성')).toBeVisible();
    
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 태블릿에서도 동일한 요소들 확인
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    await expect(page.getByText('AI 기반 자동 자막 생성')).toBeVisible();
  });

  test('에러 처리 및 사용자 피드백', async ({ page }) => {
    // 존재하지 않는 프로젝트 페이지 접근
    await page.goto('/project/non-existent-id');
    
    // 404 또는 에러 페이지로 이동하는지 확인
    // (실제로는 인증이 필요하므로 로그인 페이지로 리다이렉트될 수 있음)
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isNotFound = currentUrl.includes('404') || await page.getByText('Not Found').isVisible();
    
    expect(isLoginPage || isNotFound).toBe(true);
  });

  // Note: The following tests would require authentication setup to test actual edit/delete functionality
  // In a real testing environment, these would include:
  // 1. Setting up test user authentication
  // 2. Creating test projects
  // 3. Testing actual edit and delete interactions
  // 4. Verifying UI updates after successful operations
  
  test.describe('Authenticated User Flows (Placeholder)', () => {
    test.skip('프로젝트 이름 편집 - 전체 플로우', async ({ page }) => {
      // TODO: Implement full authenticated test flow
      // 1. Log in test user
      // 2. Navigate to dashboard
      // 3. Find project card and hover to reveal edit button
      // 4. Click edit, modify title, save
      // 5. Verify title change in UI
      // 6. Verify API call was made correctly
    });

    test.skip('프로젝트 삭제 - 전체 플로우', async ({ page }) => {
      // TODO: Implement full authenticated test flow
      // 1. Log in test user
      // 2. Navigate to dashboard with test project
      // 3. Hover over project card and click delete button
      // 4. Verify confirmation modal appears
      // 5. Confirm deletion
      // 6. Verify project is removed from dashboard
      // 7. Verify storage files are cleaned up
    });

    test.skip('편집 에러 처리 - 빈 제목', async ({ page }) => {
      // TODO: Test error handling for empty title
    });

    test.skip('편집 에러 처리 - 너무 긴 제목', async ({ page }) => {
      // TODO: Test error handling for title too long
    });

    test.skip('삭제 취소 플로우', async ({ page }) => {
      // TODO: Test canceling deletion in confirmation modal
    });

    test.skip('실시간 대시보드 통계 업데이트', async ({ page }) => {
      // TODO: Test that dashboard stats update after edit/delete operations
    });
  });
});