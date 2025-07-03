import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder, TestProject } from './utils/test-data';
import { DashboardPage } from './pages/dashboard.page';

test.describe('프로젝트 CRUD 통합 테스트 - 완전 리팩토링', () => {
  let seeder: TestDataSeeder;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage, testUser }) => {
    // TestDataSeeder와 Page Object 초기화
    seeder = new TestDataSeeder();
    dashboardPage = new DashboardPage(authenticatedPage);
    
    // 테스트 환경 정리
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
    
    // 대시보드로 이동
    await dashboardPage.goto();
  });

  test.afterEach(async ({ testUser }) => {
    // 테스트 완료 후 데이터 정리
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.describe('프로젝트 생성 (Create)', () => {
    test('새 프로젝트 생성 - 전체 플로우', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      // 빈 상태 확인
      expect(await dashboardPage.isEmpty()).toBe(true);
      await expect(dashboardPage.emptyState).toBeVisible();

      // 새 프로젝트 시작
      await dashboardPage.clickCreateFirstProject();
      await expect(authenticatedPage).toHaveURL('/upload');

      // 데이터베이스에 직접 프로젝트 생성 (파일 업로드 프로세스 시뮬레이션)
      const project = await seeder.createTestProject(testUser.id, {
        title: 'New Created Project',
        status: 'completed'
      });

      // 대시보드로 돌아가서 확인
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      expect(await dashboardPage.hasProjects()).toBe(true);
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();
    });

    test('다양한 상태의 프로젝트 생성', async ({ testUser }) => {
      if (!testUser.id) return;

      const statuses: TestProject['status'][] = ['processing', 'completed', 'failed'];
      const projects: TestProject[] = [];

      // 각 상태별 프로젝트 생성
      for (const status of statuses) {
        const project = await seeder.createProjectWithStatus(testUser.id, status);
        projects.push(project);
      }

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 모든 프로젝트가 표시되는지 확인
      for (const project of projects) {
        await expect(dashboardPage.page.getByText(project.title)).toBeVisible();
      }

      expect(await dashboardPage.getProjectCount()).toBe(3);
    });
  });

  test.describe('프로젝트 조회 (Read)', () => {
    test('프로젝트 목록 조회 - 페이지네이션', async ({ testUser }) => {
      if (!testUser.id) return;

      // 대량 프로젝트 생성 (15개)
      await seeder.createMultipleTestProjects(testUser.id, 15);
      
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      const displayedCount = await dashboardPage.getProjectCount();
      expect(displayedCount).toBeGreaterThan(0);
      expect(displayedCount).toBeLessThanOrEqual(15);

      // 프로젝트 제목들이 표시되는지 확인
      const displayedTitles = await dashboardPage.getProjectTitles();
      expect(displayedTitles.length).toBeGreaterThan(0);
    });

    test('프로젝트 상세 조회', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id, {
        title: 'Detailed Project',
        transcript: '테스트 전사 내용입니다.',
        translation: 'This is test transcription content.',
        status: 'completed'
      });

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 프로젝트 상세 페이지로 이동
      await dashboardPage.clickProjectByTitle(project.title);
      await expect(authenticatedPage).toHaveURL(`/project/${project.id}`);

      // 상세 정보 확인
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();
      if (project.transcript) {
        await expect(authenticatedPage.getByText(project.transcript)).toBeVisible();
      }
      if (project.translation) {
        await expect(authenticatedPage.getByText(project.translation)).toBeVisible();
      }
    });

    test('통계 정보 조회', async ({ testUser }) => {
      if (!testUser.id) return;

      // 다양한 상태의 프로젝트 생성
      await seeder.createProjectWithStatus(testUser.id, 'completed');
      await seeder.createProjectWithStatus(testUser.id, 'completed');
      await seeder.createProjectWithStatus(testUser.id, 'processing');
      await seeder.createProjectWithStatus(testUser.id, 'failed');

      const stats = await seeder.getProjectStats(testUser.id);
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.processing).toBe(1);
      expect(stats.failed).toBe(1);

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // UI에서 통계 확인 (통계 카드가 있다면)
      const projectCount = await dashboardPage.getProjectCount();
      expect(projectCount).toBe(4);
    });
  });

  test.describe('프로젝트 수정 (Update)', () => {
    test('프로젝트 제목 수정 - 성공 케이스', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const originalProject = await seeder.createTestProject(testUser.id, {
        title: 'Original Title'
      });

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      const newTitle = 'Updated Title';
      await dashboardPage.editProjectName(originalProject.title, newTitle);

      // 성공 토스트 메시지 확인
      await dashboardPage.waitForToast('프로젝트가 수정되었습니다');

      // UI 업데이트 확인
      await expect(authenticatedPage.getByText(newTitle)).toBeVisible();
      await expect(authenticatedPage.getByText(originalProject.title)).not.toBeVisible();

      // 데이터베이스 확인
      const updatedProjects = await seeder.getUserProjects(testUser.id);
      const updatedProject = updatedProjects.find(p => p.id === originalProject.id);
      expect(updatedProject?.title).toBe(newTitle);
    });

    test('프로젝트 수정 - 유효성 검사 오류', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      const projectCard = dashboardPage.projectCards.filter({ hasText: project.title });
      await projectCard.hover();
      await projectCard.getByTestId('edit-button').click();

      const editInput = projectCard.locator('input[type="text"]');

      // 빈 제목으로 저장 시도
      await editInput.clear();
      await projectCard.getByTestId('save-button').click();

      await expect(authenticatedPage.getByText('제목을 입력해주세요')).toBeVisible();
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();

      // 너무 긴 제목으로 저장 시도
      const longTitle = 'a'.repeat(201);
      await editInput.fill(longTitle);
      await projectCard.getByTestId('save-button').click();

      await expect(authenticatedPage.getByText('제목이 너무 깁니다')).toBeVisible();
    });

    test('여러 프로젝트 동시 수정', async ({ testUser }) => {
      if (!testUser.id) return;

      const projects = await seeder.createMultipleTestProjects(testUser.id, 3);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 첫 번째 프로젝트만 수정
      await dashboardPage.editProjectName(projects[0].title, 'Modified Project 1');

      // 수정된 프로젝트만 변경되고 나머지는 그대로인지 확인
      await expect(dashboardPage.page.getByText('Modified Project 1')).toBeVisible();
      await expect(dashboardPage.page.getByText(projects[1].title)).toBeVisible();
      await expect(dashboardPage.page.getByText(projects[2].title)).toBeVisible();
    });

    test('프로젝트 상태 업데이트', async ({ testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id, {
        status: 'processing'
      });

      // 상태를 완료로 업데이트
      const updatedProject = await seeder.updateProject(project.id!, {
        status: 'completed'
      });

      expect(updatedProject.status).toBe('completed');

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // UI에서 상태 변경 반영 확인 (상태 표시가 있다면)
      await expect(dashboardPage.page.getByText(project.title)).toBeVisible();
    });
  });

  test.describe('프로젝트 삭제 (Delete)', () => {
    test('프로젝트 삭제 - 확인 플로우', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const projects = await seeder.createMultipleTestProjects(testUser.id, 3);
      const projectToDelete = projects[0];

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      await dashboardPage.deleteProject(projectToDelete.title);

      // 삭제 성공 토스트 확인
      await dashboardPage.waitForToast('프로젝트가 삭제되었습니다');

      // UI에서 삭제된 프로젝트 확인
      await expect(authenticatedPage.getByText(projectToDelete.title)).not.toBeVisible();
      await expect(authenticatedPage.getByText(projects[1].title)).toBeVisible();
      await expect(authenticatedPage.getByText(projects[2].title)).toBeVisible();

      // 데이터베이스에서 삭제 확인
      const remainingProjects = await seeder.getUserProjects(testUser.id);
      expect(remainingProjects).toHaveLength(2);
      expect(remainingProjects.find(p => p.id === projectToDelete.id)).toBeUndefined();
    });

    test('프로젝트 삭제 - 취소 플로우', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      await dashboardPage.cancelDeleteProject(project.title);

      // 프로젝트가 여전히 존재하는지 확인
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();

      const projects = await seeder.getUserProjects(testUser.id);
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
    });

    test('모든 프로젝트 삭제', async ({ testUser }) => {
      if (!testUser.id) return;

      const projects = await seeder.createMultipleTestProjects(testUser.id, 5);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 모든 프로젝트를 하나씩 삭제
      for (const project of projects) {
        await dashboardPage.deleteProject(project.title);
        await dashboardPage.waitForToast('프로젝트가 삭제되었습니다');
      }

      // 빈 상태 확인
      expect(await dashboardPage.isEmpty()).toBe(true);
      await expect(dashboardPage.emptyState).toBeVisible();

      const remainingProjects = await seeder.getUserProjects(testUser.id);
      expect(remainingProjects).toHaveLength(0);
    });
  });

  test.describe('대량 데이터 처리 테스트', () => {
    test('대량 프로젝트 생성 및 표시 성능', async ({ testUser }) => {
      if (!testUser.id) return;

      const startTime = Date.now();
      
      // 50개 프로젝트 생성
      const projects: TestProject[] = [];
      for (let i = 0; i < 50; i++) {
        const project = await seeder.createTestProject(testUser.id, {
          title: `Bulk Project ${i + 1}`,
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'processing' : 'failed'
        });
        projects.push(project);
      }

      const creationTime = Date.now() - startTime;
      console.log(`대량 프로젝트 생성 시간: ${creationTime}ms`);

      // 페이지 로딩 성능 측정
      const loadStartTime = Date.now();
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();
      const loadTime = Date.now() - loadStartTime;

      console.log(`대량 데이터 페이지 로딩 시간: ${loadTime}ms`);

      // 성능 임계값 확인 (10초 이내)
      expect(loadTime).toBeLessThan(10000);

      // 프로젝트 개수 확인
      const displayedCount = await dashboardPage.getProjectCount();
      expect(displayedCount).toBeGreaterThan(0);
    });

    test('대량 프로젝트 삭제 성능', async ({ testUser }) => {
      if (!testUser.id) return;

      // 20개 프로젝트 생성
      await seeder.createMultipleTestProjects(testUser.id, 20);

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      const startTime = Date.now();
      
      // 데이터베이스에서 직접 모든 프로젝트 삭제 (실제 대량 삭제 시뮬레이션)
      await seeder.cleanupUserProjects(testUser.id);
      
      const deleteTime = Date.now() - startTime;
      console.log(`대량 프로젝트 삭제 시간: ${deleteTime}ms`);

      // 성능 임계값 확인 (5초 이내)
      expect(deleteTime).toBeLessThan(5000);

      // 삭제 확인
      const remainingProjects = await seeder.getUserProjects(testUser.id);
      expect(remainingProjects).toHaveLength(0);
    });
  });

  test.describe('동시성 테스트', () => {
    test('동시 프로젝트 생성', async ({ testUser }) => {
      if (!testUser.id) return;

      const promises = Array.from({ length: 5 }, (_, i) =>
        seeder.createTestProject(testUser.id!, {
          title: `Concurrent Project ${i + 1}`
        })
      );

      const projects = await Promise.all(promises);
      expect(projects).toHaveLength(5);

      // 모든 프로젝트가 고유한 ID를 가지는지 확인
      const ids = projects.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test('동시 프로젝트 수정', async ({ testUser }) => {
      if (!testUser.id) return;

      const projects = await seeder.createMultipleTestProjects(testUser.id, 3);

      const updatePromises = projects.map((project, index) =>
        seeder.updateProject(project.id!, {
          title: `Concurrently Updated ${index + 1}`
        })
      );

      const updatedProjects = await Promise.all(updatePromises);
      
      for (let i = 0; i < updatedProjects.length; i++) {
        expect(updatedProjects[i].title).toBe(`Concurrently Updated ${i + 1}`);
      }
    });

    test('동시 읽기 작업', async ({ testUser }) => {
      if (!testUser.id) return;

      await seeder.createMultipleTestProjects(testUser.id, 10);

      // 동시에 여러 번 프로젝트 목록 조회
      const readPromises = Array.from({ length: 5 }, () =>
        seeder.getUserProjects(testUser.id!)
      );

      const results = await Promise.all(readPromises);
      
      // 모든 결과가 동일한지 확인
      for (const result of results) {
        expect(result).toHaveLength(10);
      }
    });
  });

  test.describe('에러 처리 테스트', () => {
    test('존재하지 않는 프로젝트 수정 시도', async ({ authenticatedPage }) => {
      // API 레벨에서 존재하지 않는 프로젝트 수정 시도
      const response = await authenticatedPage.request.put('/api/projects/non-existent-id', {
        data: { title: 'New Title' }
      });

      expect(response.status()).toBe(404);
    });

    test('존재하지 않는 프로젝트 삭제 시도', async ({ authenticatedPage }) => {
      const response = await authenticatedPage.request.delete('/api/projects/non-existent-id');
      expect(response.status()).toBe(404);
    });

    test('권한 없는 프로젝트 수정 시도', async ({ page }) => {
      // 인증되지 않은 상태에서 API 호출
      const response = await page.request.put('/api/projects/some-id', {
        data: { title: 'Unauthorized Update' }
      });

      expect(response.status()).toBe(401);
    });

    test('네트워크 오류 시뮬레이션', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 네트워크 차단
      await authenticatedPage.route('**/api/projects/**', (route: any) => route.abort());

      const projectCard = dashboardPage.projectCards.filter({ hasText: project.title });
      await projectCard.hover();
      await projectCard.getByTestId('edit-button').click();

      const editInput = projectCard.locator('input[type="text"]');
      await editInput.fill('New Title');
      await projectCard.getByTestId('save-button').click();

      // 에러 메시지 확인
      await expect(authenticatedPage.getByText('네트워크 오류가 발생했습니다')).toBeVisible();
    });
  });

  test.describe('검색 및 필터링 테스트', () => {
    test('프로젝트 제목으로 검색', async ({ testUser }) => {
      if (!testUser.id) return;

      await seeder.createTestProject(testUser.id, { title: 'Searchable Project Alpha' });
      await seeder.createTestProject(testUser.id, { title: 'Different Project Beta' });
      await seeder.createTestProject(testUser.id, { title: 'Another Alpha Project' });

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 검색 기능이 있다면 테스트
      if (await dashboardPage.searchInput.isVisible()) {
        await dashboardPage.searchProjects('Alpha');

        await expect(dashboardPage.page.getByText('Searchable Project Alpha')).toBeVisible();
        await expect(dashboardPage.page.getByText('Another Alpha Project')).toBeVisible();
        await expect(dashboardPage.page.getByText('Different Project Beta')).not.toBeVisible();
      }
    });

    test('상태별 필터링', async ({ testUser }) => {
      if (!testUser.id) return;

      await seeder.createProjectWithStatus(testUser.id, 'completed');
      await seeder.createProjectWithStatus(testUser.id, 'processing');
      await seeder.createProjectWithStatus(testUser.id, 'failed');

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 필터 기능이 구현되어 있다면 테스트
      const statusFilter = dashboardPage.page.getByTestId('status-filter');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('completed');
        
        const visibleProjects = await dashboardPage.getProjectCount();
        expect(visibleProjects).toBe(1);
      }
    });

    test('프로젝트 정렬', async ({ testUser }) => {
      if (!testUser.id) return;

      await seeder.createTestProject(testUser.id, { title: 'Z Project' });
      await seeder.createTestProject(testUser.id, { title: 'A Project' });
      await seeder.createTestProject(testUser.id, { title: 'M Project' });

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 정렬 기능이 있다면 테스트
      if (await dashboardPage.sortDropdown.isVisible()) {
        await dashboardPage.sortProjects('name');
        
        const titles = await dashboardPage.getProjectTitles();
        expect(titles[0]).toContain('A Project');
        expect(titles[2]).toContain('Z Project');
      }
    });
  });

  test.describe('실시간 업데이트 테스트', () => {
    test('프로젝트 통계 실시간 업데이트', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      await dashboardPage.goto();
      
      // 초기 통계 확인 (빈 상태)
      expect(await dashboardPage.isEmpty()).toBe(true);

      // 백그라운드에서 프로젝트 생성
      const project = await seeder.createTestProject(testUser.id);

      // 페이지 새로고침하여 업데이트된 통계 확인
      await authenticatedPage.reload();
      await dashboardPage.waitForProjectsToLoad();

      expect(await dashboardPage.hasProjects()).toBe(true);
      await expect(authenticatedPage.getByText(project.title)).toBeVisible();

      // 프로젝트 삭제 후 다시 확인
      await seeder.deleteProject(project.id!);
      await authenticatedPage.reload();

      expect(await dashboardPage.isEmpty()).toBe(true);
    });
  });

  test.describe('접근성 및 사용성 테스트', () => {
    test('키보드 네비게이션', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const project = await seeder.createTestProject(testUser.id);
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // Tab 키로 프로젝트 카드 포커스
      await authenticatedPage.keyboard.press('Tab');
      
      // Enter 키로 프로젝트 열기
      await authenticatedPage.keyboard.press('Enter');
      
      // 프로젝트 상세 페이지로 이동했는지 확인
      await expect(authenticatedPage).toHaveURL(`/project/${project.id}`);
    });

    test('반응형 디자인 테스트', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const projects = await seeder.createMultipleTestProjects(testUser.id, 3);
      
      // 모바일 뷰포트
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 모바일에서도 프로젝트들이 표시되는지 확인
      for (const project of projects) {
        await expect(authenticatedPage.getByText(project.title)).toBeVisible();
      }

      // 태블릿 뷰포트
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.waitForProjectsToLoad();

      // 태블릿에서도 정상 표시 확인
      for (const project of projects) {
        await expect(authenticatedPage.getByText(project.title)).toBeVisible();
      }

      // 데스크톱 뷰포트로 복원
      await authenticatedPage.setViewportSize({ width: 1200, height: 800 });
    });
  });

  test.describe('다국어 지원 테스트', () => {
    test('다양한 언어의 프로젝트 생성', async ({ testUser }) => {
      if (!testUser.id) return;

      const multiLangProjects = await seeder.createMultiLanguageProjects(testUser.id);
      
      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      // 모든 다국어 프로젝트가 표시되는지 확인
      for (const project of multiLangProjects) {
        await expect(dashboardPage.page.getByText(project.title)).toBeVisible();
      }

      expect(await dashboardPage.getProjectCount()).toBe(4);
    });

    test('긴 유니코드 제목 처리', async ({ authenticatedPage, testUser }) => {
      if (!testUser.id) return;

      const unicodeTitle = '🎬 한글과 English와 日本語가 섞인 매우 긴 프로젝트 제목입니다 🚀✨';
      await seeder.createTestProject(testUser.id, {
        title: unicodeTitle
      });

      await dashboardPage.goto();
      await dashboardPage.waitForProjectsToLoad();

      await expect(authenticatedPage.getByText(unicodeTitle)).toBeVisible();

      // 제목 수정도 정상 작동하는지 확인
      const newTitle = '수정된 유니코드 제목 ✏️';
      await dashboardPage.editProjectName(unicodeTitle, newTitle);
      
      await expect(authenticatedPage.getByText(newTitle)).toBeVisible();
    });
  });
});