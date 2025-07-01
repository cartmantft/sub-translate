import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // 로그인 페이지 요소들
  get cardHeader(): Locator {
    return this.page.getByRole('heading', { name: '로그인' });
  }

  get descriptionText(): Locator {
    return this.page.getByText('계정에 로그인하여 AI 자막 생성 서비스를 시작하세요');
  }

  // Supabase Auth UI 요소들
  get emailInput(): Locator {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]').filter({ hasText: '로그인' });
  }

  // 소셜 로그인 버튼들
  get googleLoginButton(): Locator {
    return this.page.getByRole('button').filter({ hasText: /Google/i });
  }

  get githubLoginButton(): Locator {
    return this.page.getByRole('button').filter({ hasText: /GitHub/i });
  }

  // 기능 미리보기 섹션
  get featuresPreviewSection(): Locator {
    return this.page.getByText('SubTranslate로 할 수 있는 것들');
  }

  get videoUploadFeature(): Locator {
    return this.page.getByText('비디오 업로드').first();
  }

  get aiSubtitleFeature(): Locator {
    return this.page.getByText('AI 자막 생성').last(); // 마지막 것을 선택해서 미리보기 섹션의 것을 타겟
  }

  get translationFeature(): Locator {
    return this.page.getByText('다국어 번역').first();
  }

  // 네비게이션
  get homeLink(): Locator {
    return this.page.getByRole('link', { name: '← 홈으로 돌아가기' });
  }

  // 액션들
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submitLogin(): Promise<void> {
    await this.submitButton.click();
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.submitLogin();
  }

  async clickGoogleLogin(): Promise<void> {
    await this.googleLoginButton.click();
  }

  async clickGithubLogin(): Promise<void> {
    await this.githubLoginButton.click();
  }

  async goBackToHome(): Promise<void> {
    await this.homeLink.click();
    await this.page.waitForURL('/');
  }

  // 로고를 통한 홈 이동
  async clickLogoToHome(): Promise<void> {
    await this.navigationLogo.click();
    await this.page.waitForURL('/');
  }
}