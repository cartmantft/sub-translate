import { test, expect } from '@playwright/test';

test.describe('간단한 로그인 관련 테스트', () => {

  test('홈페이지에서 로그인 페이지로 이동', async ({ page }) => {
    // 홈페이지 방문
    await page.goto('/');
    
    // 로그인 버튼 클릭
    await page.getByRole('link', { name: '로그인하기' }).click();
    
    // 로그인 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/login');
    
    console.log('✅ 홈페이지에서 로그인 페이지로 정상 이동');
  });

  test('로그인 페이지 기본 폼 요소 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 제목 확인 (역할로 찾기)
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    
    // 이메일 입력 필드
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 비밀번호 입력 필드
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 버튼
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ 로그인 페이지의 모든 필수 폼 요소 확인 완료');
  });

  test('대시보드 접근 시 인증 확인', async ({ page }) => {
    // 인증 없이 대시보드 접근 시도
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login');
    
    console.log('✅ 인증되지 않은 사용자는 대시보드 접근 시 로그인 페이지로 리다이렉트');
  });

  test('로그인 폼에 이메일 입력 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 이메일 입력 필드에 테스트 이메일 입력
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    
    // 입력된 값 확인
    await expect(emailInput).toHaveValue('test@example.com');
    
    console.log('✅ 이메일 입력 필드 정상 작동');
  });

  test('로그인 폼에 비밀번호 입력 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // 비밀번호 입력 필드에 테스트 비밀번호 입력
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('testpassword123');
    
    // 입력된 값 확인 (비밀번호는 보안상 실제 값을 확인할 수 없지만 입력은 가능)
    const inputValue = await passwordInput.inputValue();
    expect(inputValue).toBe('testpassword123');
    
    console.log('✅ 비밀번호 입력 필드 정상 작동');
  });

  test('홈으로 돌아가기 링크 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // "홈으로 돌아가기" 링크 클릭
    await page.getByRole('link', { name: '← 홈으로 돌아가기' }).click();
    
    // 홈페이지로 돌아갔는지 확인
    await expect(page).toHaveURL('/');
    
    console.log('✅ 홈으로 돌아가기 링크 정상 작동');
  });

  test('소셜 로그인 버튼 표시 확인', async ({ page }) => {
    await page.goto('/login');
    
    // Google 로그인 버튼 확인
    const googleButton = page.locator('text=/.*Google.*/');
    await expect(googleButton.first()).toBeVisible();
    
    // GitHub 로그인 버튼 확인
    const githubButton = page.locator('text=/.*GitHub.*/');
    await expect(githubButton.first()).toBeVisible();
    
    console.log('✅ 소셜 로그인 버튼들이 표시됨');
  });

  test('API 엔드포인트 보호 확인', async ({ page }) => {
    // 인증 없이 프로젝트 API 호출
    const response = await page.request.get('/api/projects');
    
    // 인증 오류 또는 리다이렉트 응답 확인
    expect([401, 405, 302, 307]).toContain(response.status());
    
    console.log(`✅ API 보호 확인 완료 (응답 코드: ${response.status()})`);
  });

  test('반응형 디자인 - 모바일에서 로그인', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // 모바일에서도 로그인 폼이 잘 보이는지 확인
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    console.log('✅ 모바일 뷰에서도 로그인 폼이 정상 표시');
  });

  test('키보드 네비게이션으로 로그인 폼 탐색', async ({ page }) => {
    await page.goto('/login');
    
    // Tab 키로 이메일 필드에 포커스
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    
    // 이메일 필드에 포커스되었는지 확인
    await expect(focusedElement).toHaveAttribute('type', 'email');
    
    // Tab 키로 비밀번호 필드로 이동
    await page.keyboard.press('Tab');
    focusedElement = page.locator(':focus');
    
    // 비밀번호 필드에 포커스되었는지 확인
    await expect(focusedElement).toHaveAttribute('type', 'password');
    
    console.log('✅ 키보드 네비게이션으로 로그인 폼 탐색 가능');
  });
});