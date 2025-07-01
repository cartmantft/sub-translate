import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(public readonly page: Page) {}

  // 공통 네비게이션 요소들 - 더 견고한 locator 사용
  get navigationLogo(): Locator {
    return this.page.locator('a[href="/"]').first();
  }

  get pageTitle(): Locator {
    return this.page.locator('h1').filter({ hasText: 'SubTranslate' }).first();
  }

  // 공통 액션들
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToHome(): Promise<void> {
    await this.navigationLogo.click();
  }

  // 알림 메시지 확인
  async waitForToast(message: string): Promise<void> {
    await this.page.getByText(message).waitFor({ state: 'visible' });
  }

  // 로딩 상태 확인
  async waitForLoadingToFinish(): Promise<void> {
    await this.page.locator('.loading, [data-loading="true"]').waitFor({ state: 'hidden' });
  }
}