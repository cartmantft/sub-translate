import { test, expect } from '@playwright/test';

test.describe('테스트 데모 - 사용자가 직접 볼 수 있는 간단한 테스트들', () => {
  
  test('홈페이지 기본 동작 확인', async ({ page }) => {
    // 홈페이지로 이동
    await page.goto('/');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // SubTranslate 제목 확인 (여러 요소 중 첫 번째)
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    
    // 메인 설명 텍스트 확인
    await expect(page.getByText('AI 기반 자동 자막 생성')).toBeVisible();
    
    // 로그인 버튼 확인
    const loginButton = page.getByRole('link', { name: '로그인하기' });
    await expect(loginButton).toBeVisible();
    
    console.log('✅ 홈페이지 기본 요소들이 정상적으로 표시됩니다');
  });

  test('로그인 페이지 이동 및 기본 요소 확인', async ({ page }) => {
    // 홈페이지에서 시작
    await page.goto('/');
    
    // 로그인 버튼 클릭
    await page.getByRole('link', { name: '로그인하기' }).click();
    
    // 로그인 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/login');
    
    // 로그인 제목 확인 (heading 역할의 요소)
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    
    // 이메일 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 버튼 확인 (submit 타입)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ 로그인 페이지의 모든 필수 요소들이 표시됩니다');
  });

  test('홈으로 돌아가기 기능 확인', async ({ page }) => {
    // 로그인 페이지로 직접 이동
    await page.goto('/login');
    
    // "홈으로 돌아가기" 링크 클릭
    await page.getByRole('link', { name: '← 홈으로 돌아가기' }).click();
    
    // 홈페이지로 돌아왔는지 확인
    await expect(page).toHaveURL('/');
    
    // 홈페이지 메인 제목 다시 확인
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    
    console.log('✅ 홈으로 돌아가기 기능이 정상 작동합니다');
  });

  test('대시보드 접근 시 인증 확인', async ({ page }) => {
    // 인증 없이 대시보드 접근 시도
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/login');
    
    // 로그인 페이지 요소 확인
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    
    console.log('✅ 인증되지 않은 사용자는 대시보드에 접근할 수 없습니다');
  });

  test('반응형 디자인 - 모바일 뷰 확인', async ({ page }) => {
    // 모바일 크기로 화면 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 홈페이지 방문
    await page.goto('/');
    
    // 모바일에서도 주요 요소들이 보이는지 확인
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    await expect(page.getByText('AI 기반 자동 자막 생성')).toBeVisible();
    await expect(page.getByRole('link', { name: '로그인하기' })).toBeVisible();
    
    console.log('✅ 모바일 뷰에서도 모든 요소가 정상 표시됩니다');
  });

  test('키보드 네비게이션 기본 테스트', async ({ page }) => {
    await page.goto('/');
    
    // Tab 키로 첫 번째 포커서블 요소로 이동
    await page.keyboard.press('Tab');
    
    // 포커스된 요소가 보이는지 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 로그인 버튼에 포커스하고 Enter로 클릭
    const loginButton = page.getByRole('link', { name: '로그인하기' });
    await loginButton.focus();
    await page.keyboard.press('Enter');
    
    // 로그인 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/login');
    
    console.log('✅ 키보드 네비게이션이 정상 작동합니다');
  });
});

// 사용자가 직접 볼 수 있는 특별한 데모 테스트
test.describe('🎬 데모용 슬로우 모션 테스트', () => {
  
  test('전체 사용자 여정 - 슬로우 모션', async ({ page }) => {
    // 이 테스트는 --slow-mo 옵션과 함께 실행하면 좋습니다
    // npm test -- --headed --slow-mo=2000 demo-test.spec.ts
    
    console.log('🎬 사용자 여정 데모를 시작합니다...');
    
    // 1. 홈페이지 방문
    await page.goto('/');
    console.log('📍 1단계: 홈페이지 방문');
    
    // 주요 요소들 확인
    await expect(page.locator('h1').filter({ hasText: 'SubTranslate' })).toBeVisible();
    await expect(page.getByText('AI 기반 자동 자막 생성')).toBeVisible();
    
    // 2. 로그인 페이지로 이동
    console.log('📍 2단계: 로그인 페이지로 이동');
    await page.getByRole('link', { name: '로그인하기' }).click();
    await expect(page).toHaveURL('/login');
    
    // 3. 로그인 폼 요소들 확인
    console.log('📍 3단계: 로그인 폼 확인');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 4. 홈으로 돌아가기
    console.log('📍 4단계: 홈으로 돌아가기');
    await page.getByRole('link', { name: '← 홈으로 돌아가기' }).click();
    await expect(page).toHaveURL('/');
    
    // 5. 대시보드 접근 시도 (인증 확인)
    console.log('📍 5단계: 대시보드 접근 시도');
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
    
    console.log('✅ 전체 사용자 여정 데모가 완료되었습니다!');
  });
});