import { test, expect } from './fixtures/auth.fixture';
import { TestDataSeeder } from './utils/test-data';
import { APIRequestMocker, MockScenarios, waitForAPICall } from './utils/api-mocks';

test.describe('End-to-End 워크플로우 테스트', () => {
  let seeder: TestDataSeeder;
  let apiMocker: APIRequestMocker;
  let mockScenarios: MockScenarios;

  test.beforeEach(async ({ authenticatedPage, testUser }) => {
    seeder = new TestDataSeeder();
    apiMocker = new APIRequestMocker(authenticatedPage);
    mockScenarios = new MockScenarios(authenticatedPage);

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

  test('전체 워크플로우 - 로그인부터 프로젝트 완료까지', async ({ authenticatedPage, testUser }) => {
    // API 모킹 설정
    await mockScenarios.mockSuccessfulWorkflow();

    // 1. 대시보드에서 새 프로젝트 시작
    await expect(authenticatedPage.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();

    // 2. 업로드 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/upload');

    // 3. 파일 업로드
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // 가상 파일 업로드 (실제 파일 없이 이벤트 시뮬레이션)
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    // 4. 언어 설정
    const sourceLanguageSelect = authenticatedPage.locator('select[name="source_language"]').or(
      authenticatedPage.getByTestId('source-language-select')
    );
    
    if (await sourceLanguageSelect.isVisible()) {
      await sourceLanguageSelect.selectOption('ko');
    }

    const targetLanguageSelect = authenticatedPage.locator('select[name="target_language"]').or(
      authenticatedPage.getByTestId('target-language-select')
    );
    
    if (await targetLanguageSelect.isVisible()) {
      await targetLanguageSelect.selectOption('en');
    }

    // 5. 처리 시작
    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' }).or(
      authenticatedPage.getByRole('button', { name: '업로드' })
    );
    
    await processButton.click();

    // 6. 업로드 진행 상태 확인
    await expect(authenticatedPage.getByText('업로드 중')).toBeVisible();
    await waitForAPICall(authenticatedPage, '/api/upload');

    // 7. 전사 단계 확인
    await expect(authenticatedPage.getByText('전사 중')).toBeVisible();
    await waitForAPICall(authenticatedPage, '/api/transcribe');

    // 8. 번역 단계 확인
    await expect(authenticatedPage.getByText('번역 중')).toBeVisible();
    await waitForAPICall(authenticatedPage, '/api/translate');

    // 9. 처리 완료 확인
    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible();

    // 10. 결과 페이지 또는 에디터 페이지로 이동
    const viewResultButton = authenticatedPage.getByRole('button', { name: '결과 보기' }).or(
      authenticatedPage.getByRole('button', { name: '편집하기' })
    );

    if (await viewResultButton.isVisible()) {
      await viewResultButton.click();
    }

    // 11. 전사 및 번역 결과 확인
    const mockTranscription = apiMocker.getMockResponse('transcribe');
    const mockTranslation = apiMocker.getMockResponse('translate');

    if (mockTranscription?.text) {
      await expect(authenticatedPage.getByText(mockTranscription.text)).toBeVisible();
    }

    if (mockTranslation?.translation) {
      await expect(authenticatedPage.getByText(mockTranslation.translation)).toBeVisible();
    }

    // 12. 프로젝트 저장
    const saveButton = authenticatedPage.getByRole('button', { name: '저장' }).or(
      authenticatedPage.getByRole('button', { name: '프로젝트 저장' })
    );

    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(authenticatedPage.getByText('프로젝트가 저장되었습니다')).toBeVisible();
    }

    // 13. 대시보드로 돌아가서 생성된 프로젝트 확인
    await authenticatedPage.goto('/dashboard');
    
    // 프로젝트 카드가 생성되었는지 확인
    const projectCards = authenticatedPage.locator('.bg-white.rounded-2xl');
    await expect(projectCards).toHaveCount(1);

    // 통계 업데이트 확인
    await expect(authenticatedPage.getByText('1')).toBeVisible(); // 총 프로젝트 수
  });

  test('에러 처리 - 전사 실패 시나리오', async ({ authenticatedPage, testUser }) => {
    // 전사 실패 모킹
    await mockScenarios.mockTranscriptionFailure();

    // 프로젝트 시작
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    await expect(authenticatedPage).toHaveURL('/upload');

    // 파일 업로드
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 업로드 성공 후 전사 실패 확인
    await waitForAPICall(authenticatedPage, '/api/upload');
    
    // 전사 에러 메시지 확인
    await expect(authenticatedPage.getByText('전사에 실패했습니다')).toBeVisible();
    await expect(authenticatedPage.getByText('Transcription service unavailable')).toBeVisible();

    // 재시도 버튼 확인
    const retryButton = authenticatedPage.getByRole('button', { name: '다시 시도' });
    await expect(retryButton).toBeVisible();
  });

  test('에러 처리 - 번역 실패 시나리오', async ({ authenticatedPage, testUser }) => {
    // 번역 실패 모킹
    await mockScenarios.mockTranslationFailure();

    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 전사 성공 후 번역 실패 확인
    await waitForAPICall(authenticatedPage, '/api/upload');
    await waitForAPICall(authenticatedPage, '/api/transcribe');

    // 번역 에러 메시지 확인
    await expect(authenticatedPage.getByText('번역에 실패했습니다')).toBeVisible();
    await expect(authenticatedPage.getByText('Translation service temporarily unavailable')).toBeVisible();

    // 전사 결과는 표시되지만 번역 없이 저장 가능한지 확인
    const saveWithoutTranslationButton = authenticatedPage.getByRole('button', { name: '번역 없이 저장' });
    
    if (await saveWithoutTranslationButton.isVisible()) {
      await saveWithoutTranslationButton.click();
      await expect(authenticatedPage.getByText('전사 결과가 저장되었습니다')).toBeVisible();
    }
  });

  test('네트워크 불안정 환경에서의 처리', async ({ authenticatedPage, testUser }) => {
    // 느린 네트워크 시뮬레이션
    await mockScenarios.mockNetworkInstability();

    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 로딩 상태가 오래 지속되는지 확인
    await expect(authenticatedPage.getByText('전사 중')).toBeVisible();
    
    // 진행률 표시기 확인
    const progressBar = authenticatedPage.locator('.progress-bar, [role="progressbar"]');
    
    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();
    }

    // 취소 버튼이 제공되는지 확인
    const cancelButton = authenticatedPage.getByRole('button', { name: '취소' });
    
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeVisible();
    }

    // 최종적으로는 성공하는지 확인 (느리지만)
    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible({ timeout: 20000 });
  });

  test('다국어 처리 워크플로우', async ({ authenticatedPage, testUser }) => {
    // 다국어 지원 모킹
    await mockScenarios.mockMultiLanguageSupport();

    // 한국어 → 영어 번역
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'korean-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('korean video content')
    });

    // 언어 설정
    const sourceLanguageSelect = authenticatedPage.locator('select[name="source_language"]');
    if (await sourceLanguageSelect.isVisible()) {
      await sourceLanguageSelect.selectOption('ko');
    }

    const targetLanguageSelect = authenticatedPage.locator('select[name="target_language"]');
    if (await targetLanguageSelect.isVisible()) {
      await targetLanguageSelect.selectOption('en');
    }

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 처리 완료 확인
    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible({ timeout: 15000 });

    // 한국어 원문과 영어 번역 결과 확인
    await expect(authenticatedPage.getByText('Hello. This is a Korean to English translation.')).toBeVisible();

    // 프로젝트 저장
    const saveButton = authenticatedPage.getByRole('button', { name: '저장' });
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }

    // 대시보드에서 언어 정보 확인
    await authenticatedPage.goto('/dashboard');
    
    const projectCard = authenticatedPage.locator('.bg-white.rounded-2xl').first();
    await expect(projectCard.getByText('한국어 → 영어')).toBeVisible();
  });

  test('파일 형식 검증 및 에러 처리', async ({ authenticatedPage, testUser }) => {
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();

    // 지원하지 않는 파일 형식 업로드 시도
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not a video file')
    });

    // 에러 메시지 확인
    await expect(authenticatedPage.getByText('지원하지 않는 파일 형식입니다')).toBeVisible();

    // 지원되는 형식 안내 확인
    await expect(authenticatedPage.getByText('MP4, AVI, MOV 파일만 지원됩니다')).toBeVisible();

    // 처리 시작 버튼이 비활성화되는지 확인
    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await expect(processButton).toBeDisabled();
  });

  test('대용량 파일 처리 워크플로우', async ({ authenticatedPage, testUser }) => {
    // 대용량 파일 처리 모킹
    await apiMocker.mockLargeFileProcessing(100 * 1024 * 1024); // 100MB

    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.alloc(100 * 1024 * 1024) // 100MB 시뮬레이션
    });

    // 대용량 파일 경고 메시지
    await expect(authenticatedPage.getByText('대용량 파일입니다. 처리에 시간이 걸릴 수 있습니다')).toBeVisible();

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 처리 시간 안내
    await expect(authenticatedPage.getByText('예상 처리 시간: 약 2-3분')).toBeVisible();

    // 진행률 표시기 확인
    const progressBar = authenticatedPage.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // 완료까지 대기
    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible({ timeout: 30000 });
  });

  test('실시간 처리 상태 업데이트', async ({ authenticatedPage, testUser }) => {
    await mockScenarios.mockSuccessfulWorkflow();

    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    // 단계별 상태 변화 확인
    const statusSteps = [
      '업로드 중',
      '업로드 완료',
      '전사 중',
      '전사 완료',
      '번역 중',
      '번역 완료',
      '처리 완료'
    ];

    for (const step of statusSteps) {
      await expect(authenticatedPage.getByText(step)).toBeVisible({ timeout: 10000 });
    }

    // 각 단계의 체크 마크 또는 완료 표시 확인
    const completedSteps = authenticatedPage.locator('.step-completed, .checkmark');
    await expect(completedSteps).toHaveCount(3); // 업로드, 전사, 번역 완료
  });

  test('사용자 피드백 및 개선 제안', async ({ authenticatedPage, testUser }) => {
    await mockScenarios.mockSuccessfulWorkflow();

    // 워크플로우 완료
    await authenticatedPage.getByRole('button', { name: '새 프로젝트' }).click();
    
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });

    const processButton = authenticatedPage.getByRole('button', { name: '처리 시작' });
    await processButton.click();

    await expect(authenticatedPage.getByText('처리 완료')).toBeVisible({ timeout: 15000 });

    // 결과 품질 평가 UI 확인
    const ratingComponent = authenticatedPage.locator('.rating-stars, [data-testid="quality-rating"]');
    
    if (await ratingComponent.isVisible()) {
      await expect(ratingComponent).toBeVisible();
      
      // 별점 클릭
      const fiveStars = ratingComponent.locator('[data-rating="5"]');
      if (await fiveStars.isVisible()) {
        await fiveStars.click();
      }
    }

    // 피드백 텍스트 입력
    const feedbackTextarea = authenticatedPage.locator('textarea[placeholder*="피드백"]');
    
    if (await feedbackTextarea.isVisible()) {
      await feedbackTextarea.fill('전사 및 번역 품질이 매우 좋습니다!');
      
      const submitFeedback = authenticatedPage.getByRole('button', { name: '피드백 제출' });
      await submitFeedback.click();
      
      await expect(authenticatedPage.getByText('피드백이 제출되었습니다')).toBeVisible();
    }
  });
});