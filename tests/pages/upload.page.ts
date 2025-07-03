import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class UploadPage extends BasePage {
  // 업로드 영역
  get uploadDropzone(): Locator {
    return this.page.locator('[data-testid="upload-dropzone"], .border-2.border-dashed');
  }

  get uploadInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  get uploadButton(): Locator {
    return this.page.getByRole('button', { name: /비디오 선택|파일 선택/ });
  }

  // 업로드 상태
  get uploadProgress(): Locator {
    return this.page.locator('[role="progressbar"], .bg-gradient-to-r');
  }

  get uploadStatusText(): Locator {
    return this.page.locator('text=/업로드 중|처리 중|완료/');
  }

  // 처리 단계 표시
  get stepIndicator(): Locator {
    return this.page.locator('.flex.items-center.space-x-4');
  }

  get currentStep(): Locator {
    return this.page.locator('.bg-gradient-to-r.from-indigo-500.to-purple-600');
  }

  // 결과 영역
  get videoPlayer(): Locator {
    return this.page.locator('video');
  }

  get subtitleViewer(): Locator {
    return this.page.locator('.max-h-96.overflow-y-auto');
  }

  get downloadButtons(): Locator {
    return this.page.locator('button').filter({ hasText: /다운로드/ });
  }

  // 액션들
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.uploadInput.setInputFiles(filePath);
  }

  async dragAndDropFile(filePath: string): Promise<void> {
    // 파일 드래그 앤 드롭 시뮬레이션
    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
    await this.page.dispatchEvent('[data-testid="upload-dropzone"]', 'drop', { dataTransfer });
  }

  async waitForUploadComplete(): Promise<void> {
    await this.page.waitForSelector('text=/업로드 완료|처리 완료/', { timeout: 60000 });
  }

  async waitForProcessingComplete(): Promise<void> {
    await this.page.waitForSelector('text=/번역 완료|완료됨/', { timeout: 120000 });
  }

  async downloadSubtitle(format: 'SRT' | 'VTT'): Promise<void> {
    await this.page.getByRole('button', { name: `${format} 다운로드` }).click();
  }

  async saveProject(): Promise<void> {
    await this.page.getByRole('button', { name: '프로젝트 저장' }).click();
  }

  // 상태 확인
  async isUploadAreaVisible(): Promise<boolean> {
    return await this.uploadDropzone.isVisible();
  }

  async getUploadProgress(): Promise<string | null> {
    const progressBar = this.page.locator('[role="progressbar"]');
    if (await progressBar.count() > 0) {
      return await progressBar.getAttribute('aria-valuenow');
    }
    return null;
  }

  async getCurrentStepName(): Promise<string | null> {
    const activeStep = this.currentStep;
    if (await activeStep.count() > 0) {
      return await activeStep.textContent();
    }
    return null;
  }

  async hasVideoPlayer(): Promise<boolean> {
    return await this.videoPlayer.isVisible();
  }

  async hasSubtitles(): Promise<boolean> {
    const subtitleSegments = this.page.locator('.cursor-pointer.hover\\:bg-gray-50');
    return (await subtitleSegments.count()) > 0;
  }

  // 에러 처리
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('.text-red-500, .text-red-600');
    if (await errorElement.count() > 0) {
      return await errorElement.first().textContent();
    }
    return null;
  }

  async dismissError(): Promise<void> {
    const dismissButton = this.page.locator('button').filter({ hasText: /닫기|확인/ });
    if (await dismissButton.count() > 0) {
      await dismissButton.first().click();
    }
  }
}