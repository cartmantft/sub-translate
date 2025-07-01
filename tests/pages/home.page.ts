import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // 홈페이지 특화 locator들 - 인증 상태에 따라 다른 UI
  
  // 비인증 상태 요소들 - 더 견고한 locator
  get loginButton(): Locator {
    return this.page.locator('button').filter({ hasText: '로그인하기' });
  }

  get heroSection(): Locator {
    return this.page.locator('p').filter({ hasText: 'AI를 활용하여' });
  }

  get featureCards(): Locator {
    return this.page.locator('.group.bg-white');
  }

  get uploadFeatureCard(): Locator {
    return this.page.locator('.group').filter({ hasText: '간편한 업로드' });
  }

  get aiFeatureCard(): Locator {
    return this.page.locator('.group').filter({ hasText: 'AI 자막 생성' });
  }

  get translateFeatureCard(): Locator {
    return this.page.locator('.group').filter({ hasText: '스마트 번역' });
  }

  // 인증 상태 요소들 (로그인 후)
  get newProjectButton(): Locator {
    return this.page.getByRole('button', { name: '새 프로젝트' });
  }

  get mainContent(): Locator {
    return this.page.locator('[data-testid="main-content"]');
  }

  // 액션들
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
    await this.page.waitForURL('/login');
  }

  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  // 상태 확인
  async isUserLoggedIn(): Promise<boolean> {
    try {
      await this.newProjectButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async isUserLoggedOut(): Promise<boolean> {
    try {
      await this.loginButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}