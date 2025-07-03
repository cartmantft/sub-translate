import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder, setupTestEnvironment, cleanupTestEnvironment } from './utils/test-data';
import { DashboardPage } from './pages/dashboard.page';

test.describe('인증된 사용자 대시보드 테스트', () => {
  let seeder: TestDataSeeder;

  test.beforeEach(async ({ testUser }) => {
    seeder = new TestDataSeeder();
    // 각 테스트 전에 깨끗한 상태로 시작
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.afterEach(async ({ testUser }) => {
    // 각 테스트 후 데이터 정리
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test('인증된 사용자가 대시보드에 접근할 수 있음', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    // 대시보드 페이지 확인
    await expect(authenticatedPage).toHaveURL('/dashboard');
    
    // Page Object를 사용한 요소 확인
    await expect(dashboardPage.pageHeading).toBeVisible();
    await expect(dashboardPage.pageDescription).toBeVisible();
    await expect(dashboardPage.newProjectButton).toBeVisible();
  });

  test('빈 대시보드 상태 확인', async ({ authenticatedPage, testUser }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    
    // Page Object를 사용한 빈 상태 확인
    await expect(dashboardPage.emptyState).toBeVisible();
    await expect(dashboardPage.emptyStateDescription).toBeVisible();
    await expect(dashboardPage.createFirstProjectButton).toBeVisible();
    
    // 통계 카드 확인
    await expect(dashboardPage.totalProjectsCard).toBeVisible();
    await expect(authenticatedPage.getByText('0').first()).toBeVisible();
  });

  test('프로젝트가 있는 대시보드 상태 확인', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 테스트 프로젝트 생성
    const projects = await seeder.createMultipleTestProjects(testUser.id, 3);
    
    // 페이지 새로고침하여 데이터 반영
    await authenticatedPage.reload();
    
    // 프로젝트 카드들이 표시되는지 확인
    for (const project of projects) {
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();
    }
    
    // 빈 상태 메시지가 표시되지 않는지 확인
    await expect(authenticatedPage.getByText('프로젝트가 없습니다')).not.toBeVisible();
    
    // 통계 카드 확인
    await expect(authenticatedPage.getByText('3')).toBeVisible(); // 총 프로젝트 수
  });

  test('프로젝트 상태별 표시 확인', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 다양한 상태의 프로젝트 생성
    await seeder.createProjectWithStatus(testUser.id, 'completed');
    await seeder.createProjectWithStatus(testUser.id, 'processing');
    await seeder.createProjectWithStatus(testUser.id, 'failed');
    
    await authenticatedPage.reload();
    
    // 완료된 프로젝트 확인
    await expect(authenticatedPage.locator('.text-green-600')).toBeVisible(); // 완료 상태 표시
    
    // 처리 중인 프로젝트 확인
    await expect(authenticatedPage.locator('.text-blue-600')).toBeVisible(); // 처리 중 상태 표시
    
    // 실패한 프로젝트 확인
    await expect(authenticatedPage.locator('.text-red-600')).toBeVisible(); // 실패 상태 표시
  });

  test('프로젝트 카드 호버 시 액션 버튼 표시', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 테스트 프로젝트 생성
    const project = await seeder.createTestProject(testUser.id);
    
    await authenticatedPage.reload();
    
    // 프로젝트 카드 찾기
    const projectCard = authenticatedPage.locator('.bg-white.rounded-2xl').filter({ hasText: project.title });
    
    // 호버 시 액션 버튼들이 표시되는지 확인
    await projectCard.hover();
    
    // 편집 버튼 확인
    await expect(projectCard.getByTestId('edit-button')).toBeVisible();
    
    // 삭제 버튼 확인
    await expect(projectCard.getByTestId('delete-button')).toBeVisible();
    
    // 프로젝트 보기 버튼 확인
    await expect(projectCard.getByRole('button', { name: '프로젝트 보기' })).toBeVisible();
  });

  test('새 프로젝트 버튼 클릭 시 업로드 페이지로 이동', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    // 업로드 페이지로 이동하는지 확인 (실제 구현에 따라 URL 조정 필요)
    await expect(authenticatedPage).toHaveURL('/upload');
  });

  test('대시보드 통계 카드 정확성 확인', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 다양한 상태의 프로젝트 생성
    await seeder.createProjectWithStatus(testUser.id, 'completed');
    await seeder.createProjectWithStatus(testUser.id, 'completed');
    await seeder.createProjectWithStatus(testUser.id, 'processing');
    
    await authenticatedPage.reload();
    
    // 총 프로젝트 수 확인
    const totalProjectsCard = authenticatedPage.locator('.bg-white').filter({ hasText: '총 프로젝트' });
    await expect(totalProjectsCard.getByText('3')).toBeVisible();
    
    // 완료된 번역 수 확인
    const completedCard = authenticatedPage.locator('.bg-white').filter({ hasText: '완료된 번역' });
    await expect(completedCard.getByText('2')).toBeVisible();
  });

  test('프로젝트 검색 기능 (있는 경우)', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 서로 다른 제목의 프로젝트 생성
    await seeder.createTestProject(testUser.id, { title: 'Video Project 1' });
    await seeder.createTestProject(testUser.id, { title: 'Audio Project 2' });
    
    await authenticatedPage.reload();
    
    // 검색 입력 필드가 있는지 확인
    const searchInput = authenticatedPage.locator('input[placeholder*="검색"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      // 검색 테스트
      await searchInput.fill('Video');
      await authenticatedPage.waitForTimeout(500); // 검색 결과 로딩 대기
      
      // 검색 결과 확인
      await expect(authenticatedPage.getByText('Video Project 1')).toBeVisible();
      await expect(authenticatedPage.getByText('Audio Project 2')).not.toBeVisible();
    }
  });

  test('반응형 대시보드 - 모바일 뷰', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 테스트 프로젝트 생성
    await seeder.createTestProject(testUser.id);
    
    // 모바일 뷰포트로 설정
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.reload();
    
    // 대시보드 주요 요소들이 모바일에서도 표시되는지 확인
    await expect(authenticatedPage.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
    await expect(authenticatedPage.getByRole('button', { name: '새 프로젝트' })).toBeVisible();
    
    // 프로젝트 카드가 모바일에서 적절히 표시되는지 확인
    const projectCards = authenticatedPage.locator('.bg-white.rounded-2xl');
    await expect(projectCards.first()).toBeVisible();
  });

  test('대시보드 로딩 상태 확인', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 많은 프로젝트 생성하여 로딩 시간 확보
    await seeder.createMultipleTestProjects(testUser.id, 10);
    
    // 페이지 새로고침
    await authenticatedPage.reload();
    
    // 로딩 상태 확인 (로딩 스피너 또는 스켈레톤 UI)
    const loadingIndicator = authenticatedPage.locator('.loading, .skeleton, [data-loading="true"]');
    
    if (await loadingIndicator.isVisible()) {
      // 로딩이 완료될 때까지 대기
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // 로딩 완료 후 콘텐츠 확인
    await expect(authenticatedPage.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
  });
});