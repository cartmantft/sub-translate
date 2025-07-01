import { test, expect } from '@playwright/test';

test.describe('로그인 페이지 UI 요소', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지 기본 요소들이 표시됨', async ({ page }) => {
    // SubTranslate 로고와 제목 확인
    await expect(page.getByText('SubTranslate')).toBeVisible();
    
    // 로그인 카드 헤더 확인
    await expect(page.getByText('로그인')).toBeVisible();
    await expect(page.getByText('새 계정을 만들거나 기존 계정으로 로그인하세요')).toBeVisible();
    
    // 설명 텍스트 확인
    await expect(page.getByText('계정에 로그인하여 AI 자막 생성 서비스를 시작하세요')).toBeVisible();
  });

  test('Supabase Auth 컴포넌트 요소들이 표시됨', async ({ page }) => {
    // 이메일 입력 필드 확인 (Supabase Auth UI에서 생성)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 버튼 확인 (텍스트가 동적으로 변할 수 있음)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('소셜 로그인 버튼들이 표시됨', async ({ page }) => {
    // Google 로그인 버튼 확인
    await expect(page.getByText(/Google/i)).toBeVisible();
    
    // GitHub 로그인 버튼 확인  
    await expect(page.getByText(/GitHub/i)).toBeVisible();
  });

  test('기능 미리보기 섹션이 표시됨', async ({ page }) => {
    // "SubTranslate로 할 수 있는 것들" 텍스트 확인
    await expect(page.getByText('SubTranslate로 할 수 있는 것들')).toBeVisible();
    
    // 기능 미리보기 항목들 확인
    await expect(page.getByText('비디오 업로드')).toBeVisible();
    await expect(page.getByText('AI 자막 생성')).toBeVisible();
    await expect(page.getByText('다국어 번역')).toBeVisible();
  });

  test('홈으로 돌아가기 링크가 표시됨', async ({ page }) => {
    await expect(page.getByRole('link', { name: '← 홈으로 돌아가기' })).toBeVisible();
  });

  test('로그인 페이지 스타일링 확인', async ({ page }) => {
    // 그라데이션 배경 확인 (클래스명으로)
    const backgroundDiv = page.locator('div').filter({ hasText: 'SubTranslate' }).first();
    await expect(backgroundDiv).toHaveClass(/bg-gradient-to-br/);
    
    // 로그인 카드 스타일 확인
    const loginCard = page.locator('.bg-white.rounded-2xl.shadow-2xl');
    await expect(loginCard).toBeVisible();
  });
});