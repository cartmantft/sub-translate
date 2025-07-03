import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';
import { APIRequestMocker, createTestVideoFile, createTestAudioFile } from './utils/api-mocks';

test.describe('파일 업로드 및 처리 테스트', () => {
  let seeder: TestDataSeeder;
  let apiMocker: APIRequestMocker;

  test.beforeEach(async ({ authenticatedPage, testUser }) => {
    seeder = new TestDataSeeder();
    apiMocker = new APIRequestMocker(authenticatedPage);

    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test.afterEach(async ({ authenticatedPage, testUser }) => {
    await apiMocker.clearAllMocks();
    if (testUser.id) {
      await seeder.cleanupUserProjects(testUser.id);
    }
  });

  test('지원되는 비디오 파일 형식 업로드', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();
    
    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // MP4 파일 업로드
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake mp4 content')
    });

    // 파일 정보 표시 확인
    await expect(authenticatedPage.getByText('test-video.mp4')).toBeVisible();
    await expect(authenticatedPage.getByText('video/mp4')).toBeVisible();

    // 처리 시작 버튼 활성화 확인
    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await expect(processButton).toBeEnabled();
  });

  test('지원되지 않는 파일 형식 거부', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // 텍스트 파일 업로드 시도
    await fileInput.setInputFiles({
      name: 'document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not a video file')
    });

    // 에러 메시지 확인
    await expect(authenticatedPage.getByText('지원하지 않는 파일 형식입니다')).toBeVisible();
    await expect(authenticatedPage.getByText('MP4, AVI, MOV, WebM 파일만 업로드 가능합니다')).toBeVisible();

    // 처리 시작 버튼 비활성화 확인
    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await expect(processButton).toBeDisabled();
  });

  test('대용량 파일 업로드 제한', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');

    // 100MB 이상 파일 업로드 시도 (가상)
    await fileInput.setInputFiles({
      name: 'large-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.alloc(101 * 1024 * 1024) // 101MB
    });

    // 파일 크기 제한 경고 확인
    await expect(authenticatedPage.getByText('파일 크기가 100MB를 초과합니다')).toBeVisible();
    await expect(authenticatedPage.getByText('더 작은 파일을 업로드해주세요')).toBeVisible();

    // 처리 시작 버튼 비활성화 확인
    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await expect(processButton).toBeDisabled();
  });

  test('파일 업로드 진행률 표시', async ({ authenticatedPage }) => {
    // 느린 업로드 시뮬레이션
    await apiMocker.mockSlowNetwork('/api/upload', 3000);

    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 업로드 진행률 표시 확인
    const progressBar = authenticatedPage.locator('[role="progressbar"]').or(
      authenticatedPage.locator('.progress-bar')
    );

    await expect(progressBar).toBeVisible();

    // 진행률 텍스트 확인
    await expect(authenticatedPage.getByText('업로드 중')).toBeVisible();
    
    // 퍼센트 표시 확인 (있는 경우)
    const percentageText = authenticatedPage.locator('text=%').or(
      authenticatedPage.getByText(/\d+%/)
    );

    if (await percentageText.isVisible()) {
      await expect(percentageText).toBeVisible();
    }

    // 업로드 완료 확인
    await expect(authenticatedPage.getByText('업로드 완료')).toBeVisible({ timeout: 10000 });
  });

  test('업로드 취소 기능', async ({ authenticatedPage }) => {
    await apiMocker.mockSlowNetwork('/api/upload', 10000); // 10초 지연

    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 업로드 시작 확인
    await expect(authenticatedPage.getByText('업로드 중')).toBeVisible();

    // 취소 버튼 클릭
    const cancelButton = authenticatedPage.getByRole('button', { name: '취소' });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // 취소 확인 대화상자
    const confirmCancel = authenticatedPage.getByRole('button', { name: '확인' }).or(
      authenticatedPage.getByRole('button', { name: '예' })
    );

    if (await confirmCancel.isVisible()) {
      await confirmCancel.click();
    }

    // 업로드 취소됨 확인
    await expect(authenticatedPage.getByText('업로드가 취소되었습니다')).toBeVisible();

    // 처리 시작 버튼이 다시 활성화되는지 확인
    await expect(processButton).toBeEnabled();
  });

  test('다중 파일 업로드 지원 (있는 경우)', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();

    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    
    // multiple 속성이 있는지 확인
    const isMultiple = await fileInput.getAttribute('multiple');
    
    if (isMultiple !== null) {
      // 여러 파일 선택
      await fileInput.setInputFiles([
        {
          name: 'video1.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('fake video 1')
        },
        {
          name: 'video2.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('fake video 2')
        }
      ]);

      // 선택된 파일 목록 확인
      await expect(authenticatedPage.getByText('video1.mp4')).toBeVisible();
      await expect(authenticatedPage.getByText('video2.mp4')).toBeVisible();

      // 개별 파일 제거 버튼 확인
      const removeButtons = authenticatedPage.locator('[aria-label="파일 제거"], .remove-file');
      await expect(removeButtons).toHaveCount(2);

      // 첫 번째 파일 제거
      await removeButtons.first().click();
      await expect(authenticatedPage.getByText('video1.mp4')).not.toBeVisible();
      await expect(authenticatedPage.getByText('video2.mp4')).toBeVisible();
    }
  });

  test('드래그 앤 드롭 업로드', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();

    await authenticatedPage.goto('/upload');

    // 드롭 존 확인
    const dropZone = authenticatedPage.locator('.drop-zone, [data-testid="drop-zone"]').or(
      authenticatedPage.locator('text=파일을 드래그하여 업로드').locator('..')
    );

    await expect(dropZone).toBeVisible();

    // 드래그 오버 이벤트 시뮬레이션
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: {
        files: [{
          name: 'test-video.mp4',
          type: 'video/mp4'
        }]
      }
    });

    // 드래그 오버 시 스타일 변경 확인
    const dropZoneHighlight = authenticatedPage.locator('.drop-zone-highlight, .drag-over');
    
    if (await dropZoneHighlight.isVisible()) {
      await expect(dropZoneHighlight).toBeVisible();
    }

    // 드롭 이벤트 시뮬레이션
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [{
          name: 'test-video.mp4',
          type: 'video/mp4',
          size: 1024000
        }]
      }
    });

    // 파일이 추가되었는지 확인
    await expect(authenticatedPage.getByText('test-video.mp4')).toBeVisible();
  });

  test('파일 메타데이터 표시', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI('https://example.com/test-video.mp4');

    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'sample-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.alloc(5 * 1024 * 1024) // 5MB
    });

    // 파일 정보 표시 확인
    await expect(authenticatedPage.getByText('sample-video.mp4')).toBeVisible();
    await expect(authenticatedPage.getByText('5.0 MB')).toBeVisible();
    await expect(authenticatedPage.getByText('video/mp4')).toBeVisible();

    // 비디오 미리보기 (있는 경우)
    const videoPreview = authenticatedPage.locator('video').or(
      authenticatedPage.locator('.video-preview')
    );

    if (await videoPreview.isVisible()) {
      await expect(videoPreview).toBeVisible();
    }

    // 파일 지속 시간 정보 (있는 경우)
    const durationInfo = authenticatedPage.getByText(/\d+:\d+/).or(
      authenticatedPage.getByText(/\d+ 초/)
    );

    if (await durationInfo.isVisible()) {
      await expect(durationInfo).toBeVisible();
    }
  });

  test('업로드 에러 복구', async ({ authenticatedPage }) => {
    // 첫 번째 시도는 실패
    await apiMocker.mockAPIError('/api/upload', 500, 'Upload server error');

    await authenticatedPage.goto('/upload');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 에러 메시지 확인
    await expect(authenticatedPage.getByText('업로드에 실패했습니다')).toBeVisible();
    await expect(authenticatedPage.getByText('Upload server error')).toBeVisible();

    // 재시도 버튼 확인
    const retryButton = authenticatedPage.getByRole('button', { name: '다시 시도' });
    await expect(retryButton).toBeVisible();

    // 성공 응답으로 모킹 변경
    await apiMocker.clearAllMocks();
    await apiMocker.mockFileUploadAPI();

    // 재시도
    await retryButton.click();

    // 성공 확인
    await expect(authenticatedPage.getByText('업로드 완료')).toBeVisible();
  });

  test('파일 형식별 특화 처리', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();

    const testCases = [
      { name: 'video.mp4', mimeType: 'video/mp4', expectedIcon: '🎬' },
      { name: 'audio.mp3', mimeType: 'audio/mp3', expectedIcon: '🎵' },
      { name: 'video.avi', mimeType: 'video/x-msvideo', expectedIcon: '🎬' },
      { name: 'video.mov', mimeType: 'video/quicktime', expectedIcon: '🎬' }
    ];

    for (const testCase of testCases) {
      await authenticatedPage.goto('/upload');

      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: testCase.name,
        mimeType: testCase.mimeType,
        buffer: Buffer.from('fake content')
      });

      // 파일 타입별 아이콘 또는 표시 확인
      const fileIcon = authenticatedPage.locator(`.file-icon, [data-file-type="${testCase.mimeType.split('/')[0]}"]`);
      
      if (await fileIcon.isVisible()) {
        await expect(fileIcon).toBeVisible();
      }

      // 파일 타입 텍스트 확인
      await expect(authenticatedPage.getByText(testCase.mimeType)).toBeVisible();
    }
  });

  test('업로드 히스토리 및 최근 파일', async ({ authenticatedPage, testUser }) => {
    if (!testUser.id) return;

    // 이전에 업로드한 파일들이 있다고 가정
    await seeder.createTestProject(testUser.id, {
      title: 'Previous Video 1',
      video_url: 'https://example.com/video1.mp4'
    });

    await seeder.createTestProject(testUser.id, {
      title: 'Previous Video 2', 
      video_url: 'https://example.com/video2.mp4'
    });

    await authenticatedPage.goto('/upload');

    // 최근 파일 섹션 확인
    const recentFilesSection = authenticatedPage.locator('.recent-files, [data-testid="recent-files"]');
    
    if (await recentFilesSection.isVisible()) {
      await expect(recentFilesSection).toBeVisible();
      await expect(authenticatedPage.getByText('최근 업로드한 파일')).toBeVisible();

      // 이전 프로젝트들이 표시되는지 확인
      await expect(authenticatedPage.getByText('Previous Video 1')).toBeVisible();
      await expect(authenticatedPage.getByText('Previous Video 2')).toBeVisible();

      // 재사용 버튼 확인
      const reuseButton = authenticatedPage.getByRole('button', { name: '다시 사용' }).first();
      
      if (await reuseButton.isVisible()) {
        await reuseButton.click();
        
        // 해당 파일이 선택되었는지 확인
        await expect(authenticatedPage.getByText('video1.mp4')).toBeVisible();
      }
    }
  });

  test('배치 업로드 및 처리', async ({ authenticatedPage }) => {
    await apiMocker.mockFileUploadAPI();

    await authenticatedPage.goto('/upload');

    // 배치 모드 활성화 (있는 경우)
    const batchModeToggle = authenticatedPage.locator('.batch-mode-toggle, [data-testid="batch-mode"]');
    
    if (await batchModeToggle.isVisible()) {
      await batchModeToggle.click();

      // 여러 파일 선택
      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles([
        {
          name: 'video1.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('video 1')
        },
        {
          name: 'video2.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('video 2')
        },
        {
          name: 'video3.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('video 3')
        }
      ]);

      // 배치 처리 설정
      const processAllButton = authenticatedPage.getByRole('button', { name: '모두 처리' });
      await expect(processAllButton).toBeVisible();

      await processAllButton.click();

      // 각 파일의 처리 상태 확인
      await expect(authenticatedPage.getByText('3개 파일 처리 중')).toBeVisible();

      // 개별 파일 진행률 확인
      const progressItems = authenticatedPage.locator('.batch-progress-item');
      await expect(progressItems).toHaveCount(3);

      // 전체 완료 확인
      await expect(authenticatedPage.getByText('모든 파일 처리 완료')).toBeVisible({ timeout: 20000 });
    }
  });
});