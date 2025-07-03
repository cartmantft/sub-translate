import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // 대시보드 헤더
  get pageHeading(): Locator {
    return this.page.getByRole('heading', { name: '내 프로젝트' });
  }

  get pageDescription(): Locator {
    return this.page.getByText('생성된 프로젝트들을 관리하고 자막 파일을 다운로드하세요');
  }

  get newProjectButton(): Locator {
    return this.page.getByRole('button', { name: '새 프로젝트' });
  }

  // 통계 카드들
  get totalProjectsCard(): Locator {
    return this.page.locator('.bg-white').filter({ hasText: '총 프로젝트' });
  }

  get completedTranslationsCard(): Locator {
    return this.page.locator('.bg-white').filter({ hasText: '완료된 번역' });
  }

  get lastUpdateCard(): Locator {
    return this.page.locator('.bg-white').filter({ hasText: '최근 업데이트' });
  }

  // 검색 및 필터
  get searchInput(): Locator {
    return this.page.locator('input[placeholder*="검색"]');
  }

  get sortDropdown(): Locator {
    return this.page.locator('select').filter({ hasText: /정렬/ });
  }

  // 프로젝트 목록
  get projectGrid(): Locator {
    return this.page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  }

  get projectCards(): Locator {
    return this.page.locator('.bg-white.rounded-2xl.shadow-sm.border');
  }

  get emptyState(): Locator {
    return this.page.getByText('프로젝트가 없습니다');
  }

  get emptyStateDescription(): Locator {
    return this.page.getByText('첫 번째 비디오를 업로드하여 AI 자막 생성을 시작해보세요');
  }

  get createFirstProjectButton(): Locator {
    return this.page.getByRole('button', { name: '새 프로젝트 시작하기' });
  }

  // 액션들
  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  async clickCreateFirstProject(): Promise<void> {
    await this.createFirstProjectButton.click();
  }

  async getProjectCount(): Promise<number> {
    await this.projectCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.projectCards.count();
  }

  async clickProjectByTitle(title: string): Promise<void> {
    const projectCard = this.projectCards.filter({ hasText: title });
    await projectCard.getByRole('button', { name: '프로젝트 보기' }).click();
  }

  // 프로젝트 편집/삭제 액션
  async editProjectName(oldTitle: string, newTitle: string): Promise<void> {
    const projectCard = this.projectCards.filter({ hasText: oldTitle });
    await projectCard.hover();
    
    // 다양한 방법으로 편집 버튼 찾기
    const editButton = projectCard.getByTestId('edit-button')
      .or(projectCard.locator('button[aria-label="편집"]'))
      .or(projectCard.getByRole('button', { name: '편집' }));
    
    await editButton.click();
    
    const input = projectCard.locator('input[type="text"]')
      .or(projectCard.locator(`input[value="${oldTitle}"]`));
    
    await input.clear();
    await input.fill(newTitle);
    
    const saveButton = projectCard.getByTestId('save-button')
      .or(projectCard.locator('button[aria-label="저장"]'))
      .or(projectCard.getByRole('button', { name: '저장' }));
    
    await saveButton.click();
  }

  async deleteProject(title: string): Promise<void> {
    const projectCard = this.projectCards.filter({ hasText: title });
    await projectCard.hover();
    
    // 다양한 방법으로 삭제 버튼 찾기
    const deleteButton = projectCard.getByTestId('delete-button')
      .or(projectCard.locator('button[aria-label="삭제"]'))
      .or(projectCard.getByRole('button', { name: '삭제' }));
    
    await deleteButton.click();
    
    // 삭제 확인 모달 처리
    const confirmDialog = this.page.locator('[role="dialog"]')
      .or(this.page.getByText('정말 삭제하시겠습니까?'));
    
    await confirmDialog.waitFor({ state: 'visible' });
    
    const confirmButton = this.page.getByTestId('confirm-delete-button')
      .or(this.page.getByRole('button', { name: '삭제' }));
    
    await confirmButton.click();
  }

  async cancelDeleteProject(title: string): Promise<void> {
    const projectCard = this.projectCards.filter({ hasText: title });
    await projectCard.hover();
    
    const deleteButton = projectCard.getByTestId('delete-button')
      .or(projectCard.locator('button[aria-label="삭제"]'))
      .or(projectCard.getByRole('button', { name: '삭제' }));
    
    await deleteButton.click();
    
    // 삭제 취소
    const cancelButton = this.page.getByTestId('cancel-delete-button')
      .or(this.page.getByRole('button', { name: '취소' }));
    
    await cancelButton.click();
  }

  async getProjectTitles(): Promise<string[]> {
    const projectCount = await this.getProjectCount();
    if (projectCount === 0) return [];

    const titles: string[] = [];
    for (let i = 0; i < projectCount; i++) {
      const title = await this.projectCards.nth(i).locator('h2').textContent();
      if (title) titles.push(title.trim());
    }
    return titles;
  }

  // 상태 확인
  async hasProjects(): Promise<boolean> {
    try {
      await this.projectCards.first().waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async isEmpty(): Promise<boolean> {
    try {
      await this.emptyState.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  // 검색 및 필터 액션
  async searchProjects(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingToFinish();
  }

  async sortProjects(sortBy: 'newest' | 'oldest' | 'name'): Promise<void> {
    await this.sortDropdown.selectOption(sortBy);
    await this.waitForLoadingToFinish();
  }

  // 로딩 상태 관리
  async waitForProjectsToLoad(): Promise<void> {
    await this.page.waitForSelector('.bg-white.rounded-2xl', { state: 'visible' });
  }
}