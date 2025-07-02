import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProjectPage extends BasePage {
  // 프로젝트 헤더
  get projectTitle(): Locator {
    return this.page.locator('h1').first();
  }

  get projectDate(): Locator {
    return this.page.locator('text=/생성일:|업데이트:/');
  }

  get backToDashboardLink(): Locator {
    return this.page.getByRole('link', { name: '← 대시보드로 돌아가기' });
  }

  // 비디오 플레이어
  get videoPlayer(): Locator {
    return this.page.locator('video');
  }

  get playButton(): Locator {
    return this.page.locator('button[aria-label="Play"]');
  }

  get subtitleToggle(): Locator {
    return this.page.locator('button').filter({ hasText: /자막|CC/ });
  }

  // 자막 뷰어
  get subtitleTabs(): Locator {
    return this.page.locator('[role="tablist"]');
  }

  get translatedTab(): Locator {
    return this.page.getByRole('tab', { name: '번역' });
  }

  get originalTab(): Locator {
    return this.page.getByRole('tab', { name: '원본' });
  }

  get dualTab(): Locator {
    return this.page.getByRole('tab', { name: '원본 + 번역' });
  }

  get subtitleSegments(): Locator {
    return this.page.locator('.cursor-pointer').filter({ hasText: /\d{2}:\d{2}/ });
  }

  get currentSubtitle(): Locator {
    return this.page.locator('.bg-indigo-50');
  }

  // 다운로드 버튼
  get downloadSRTButton(): Locator {
    return this.page.getByRole('button', { name: 'SRT 다운로드' });
  }

  get downloadVTTButton(): Locator {
    return this.page.getByRole('button', { name: 'VTT 다운로드' });
  }

  // 편집/삭제 버튼
  get editButton(): Locator {
    return this.page.locator('button[aria-label="편집"]');
  }

  get deleteButton(): Locator {
    return this.page.locator('button[aria-label="삭제"]');
  }

  // 액션들
  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/project/${projectId}`);
    await this.waitForPageLoad();
  }

  async playVideo(): Promise<void> {
    const video = this.videoPlayer;
    await video.click();
    // 비디오가 재생 중인지 확인
    await this.page.waitForFunction(
      () => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video && !video.paused;
      },
      { timeout: 5000 }
    );
  }

  async pauseVideo(): Promise<void> {
    const video = this.videoPlayer;
    await video.click();
    // 비디오가 일시정지됐는지 확인
    await this.page.waitForFunction(
      () => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video && video.paused;
      },
      { timeout: 5000 }
    );
  }

  async toggleSubtitles(): Promise<void> {
    await this.subtitleToggle.click();
  }

  async switchToTab(tab: 'translated' | 'original' | 'dual'): Promise<void> {
    switch (tab) {
      case 'translated':
        await this.translatedTab.click();
        break;
      case 'original':
        await this.originalTab.click();
        break;
      case 'dual':
        await this.dualTab.click();
        break;
    }
  }

  async clickSubtitleAtTime(time: string): Promise<void> {
    const subtitle = this.subtitleSegments.filter({ hasText: time });
    await subtitle.click();
  }

  async jumpToTime(seconds: number): Promise<void> {
    await this.page.evaluate((time) => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.currentTime = time;
      }
    }, seconds);
  }

  async downloadSubtitle(format: 'SRT' | 'VTT'): Promise<void> {
    if (format === 'SRT') {
      await this.downloadSRTButton.click();
    } else {
      await this.downloadVTTButton.click();
    }
  }

  // 상태 확인
  async getVideoCurrentTime(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });
  }

  async getVideoDuration(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? video.duration : 0;
    });
  }

  async isVideoPlaying(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video ? !video.paused : false;
    });
  }

  async areSubtitlesEnabled(): Promise<boolean> {
    // 자막 오버레이가 표시되는지 확인
    const subtitleOverlay = this.page.locator('.absolute.bottom-0.left-0.right-0');
    return await subtitleOverlay.isVisible();
  }

  async getActiveTab(): Promise<string | null> {
    const activeTab = this.page.locator('[role="tab"][aria-selected="true"]');
    return await activeTab.textContent();
  }

  async getSubtitleCount(): Promise<number> {
    return await this.subtitleSegments.count();
  }

  async getCurrentSubtitleText(): Promise<string | null> {
    if (await this.currentSubtitle.count() > 0) {
      return await this.currentSubtitle.textContent();
    }
    return null;
  }

  // 프로젝트 관리
  async editProjectName(newName: string): Promise<void> {
    await this.editButton.click();
    const input = this.page.locator('input[type="text"]');
    await input.clear();
    await input.fill(newName);
    await this.page.locator('button[aria-label="저장"]').click();
  }

  async deleteProject(): Promise<void> {
    await this.deleteButton.click();
    // 확인 모달에서 삭제 클릭
    await this.page.getByRole('button', { name: '삭제' }).click();
  }

  async goBackToDashboard(): Promise<void> {
    await this.backToDashboardLink.click();
  }
}