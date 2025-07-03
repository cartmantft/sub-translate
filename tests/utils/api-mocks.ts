import { Page } from '@playwright/test';

// OpenAI API 응답 모킹
export interface MockTranscriptionResponse {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

// Google Gemini API 응답 모킹
export interface MockTranslationResponse {
  translation: string;
  confidence?: number;
  detected_language?: string;
}

// API 모킹 클래스
export class APIRequestMocker {
  private page: Page;
  private mockResponses: Map<string, any> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  // OpenAI Whisper API 모킹
  async mockTranscriptionAPI(mockResponse: MockTranscriptionResponse = {
    text: "안녕하세요. 이것은 테스트 전사 결과입니다.",
    segments: [
      { start: 0, end: 2, text: "안녕하세요." },
      { start: 2, end: 5, text: " 이것은 테스트 전사 결과입니다." }
    ]
  }) {
    await this.page.route('**/api/transcribe', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockResponse
        })
      });
    });

    this.mockResponses.set('transcribe', mockResponse);
  }

  // Google Gemini API 모킹
  async mockTranslationAPI(mockResponse: MockTranslationResponse = {
    translation: "Hello. This is a test transcription result.",
    confidence: 0.95,
    detected_language: "ko"
  }) {
    await this.page.route('**/api/translate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockResponse
        })
      });
    });

    this.mockResponses.set('translate', mockResponse);
  }

  // 프로젝트 생성 API 모킹
  async mockProjectCreateAPI(mockProjectId: string = 'test-project-123') {
    await this.page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = JSON.parse(route.request().postData() || '{}');
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: mockProjectId,
              ...requestBody,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  // 프로젝트 목록 API 모킹
  async mockProjectListAPI(mockProjects: any[] = []) {
    await this.page.route('**/api/projects', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockProjects
          })
        });
      } else {
        route.continue();
      }
    });
  }

  // 프로젝트 편집 API 모킹
  async mockProjectEditAPI() {
    await this.page.route('**/api/projects/*', (route) => {
      if (route.request().method() === 'PUT') {
        const requestBody = JSON.parse(route.request().postData() || '{}');
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...requestBody,
              updated_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  // 프로젝트 삭제 API 모킹
  async mockProjectDeleteAPI() {
    await this.page.route('**/api/projects/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Project deleted successfully'
          })
        });
      } else {
        route.continue();
      }
    });
  }

  // 파일 업로드 API 모킹
  async mockFileUploadAPI(mockVideoUrl: string = 'https://example.com/test-video.mp4') {
    await this.page.route('**/api/upload', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            url: mockVideoUrl,
            filename: 'test-video.mp4',
            size: 1024000,
            duration: 120
          }
        })
      });
    });
  }

  // API 에러 시나리오 모킹
  async mockAPIError(endpoint: string, statusCode: number = 500, errorMessage: string = 'Internal Server Error') {
    await this.page.route(`**${endpoint}`, (route) => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: errorMessage
        })
      });
    });
  }

  // 네트워크 타임아웃 모킹
  async mockNetworkTimeout(endpoint: string, delayMs: number = 30000) {
    await this.page.route(`**${endpoint}`, (route) => {
      // 타임아웃 시뮬레이션 - 응답을 지연시키고 abort
      setTimeout(() => {
        route.abort();
      }, delayMs);
    });
  }

  // 느린 네트워크 모킹
  async mockSlowNetwork(endpoint: string, delayMs: number = 5000) {
    await this.page.route(`**${endpoint}`, (route) => {
      setTimeout(() => {
        route.continue();
      }, delayMs);
    });
  }

  // 특정 언어 조합에 대한 번역 모킹
  async mockTranslationForLanguages(sourceLanguage: string, targetLanguage: string, translatedText: string) {
    await this.page.route('**/api/translate', (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      
      if (requestBody.source_language === sourceLanguage && requestBody.target_language === targetLanguage) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              translation: translatedText,
              confidence: 0.95,
              detected_language: sourceLanguage
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  // 대용량 파일 처리 모킹
  async mockLargeFileProcessing(fileSize: number = 100 * 1024 * 1024) { // 100MB
    await this.page.route('**/api/transcribe', (route) => {
      // 대용량 파일 처리 시뮬레이션
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              text: `대용량 파일 (${fileSize} bytes) 전사 완료`,
              processing_time: 120, // 2분
              segments: [
                { start: 0, end: 10, text: "대용량 파일 전사 시작" },
                { start: 10, end: 20, text: "처리 중간 단계" },
                { start: 20, end: 30, text: "전사 완료" }
              ]
            }
          })
        });
      }, 5000); // 5초 지연
    });
  }

  // 모든 모킹 해제
  async clearAllMocks() {
    await this.page.unroute('**/api/transcribe');
    await this.page.unroute('**/api/translate');
    await this.page.unroute('**/api/projects');
    await this.page.unroute('**/api/projects/*');
    await this.page.unroute('**/api/upload');
    this.mockResponses.clear();
  }

  // 모킹된 응답 가져오기
  getMockResponse(endpoint: string): any {
    return this.mockResponses.get(endpoint);
  }

  // 네트워크 요청 로깅
  async enableRequestLogging() {
    this.page.on('request', (request) => {
      console.log(`[API Request] ${request.method()} ${request.url()}`);
    });

    this.page.on('response', (response) => {
      console.log(`[API Response] ${response.status()} ${response.url()}`);
    });
  }

  // 특정 API 호출 카운트 추적
  async trackAPICallCount(endpoint: string): Promise<() => number> {
    let callCount = 0;
    
    await this.page.route(`**${endpoint}`, (route) => {
      callCount++;
      route.continue();
    });

    return () => callCount;
  }
}

// 테스트 시나리오별 프리셋 모킹
export class MockScenarios {
  private mocker: APIRequestMocker;

  constructor(page: Page) {
    this.mocker = new APIRequestMocker(page);
  }

  // 성공적인 전체 워크플로우 모킹
  async mockSuccessfulWorkflow() {
    await this.mocker.mockFileUploadAPI();
    await this.mocker.mockTranscriptionAPI();
    await this.mocker.mockTranslationAPI();
    await this.mocker.mockProjectCreateAPI();
  }

  // 전사 실패 시나리오
  async mockTranscriptionFailure() {
    await this.mocker.mockFileUploadAPI();
    await this.mocker.mockAPIError('/api/transcribe', 500, 'Transcription service unavailable');
  }

  // 번역 실패 시나리오
  async mockTranslationFailure() {
    await this.mocker.mockFileUploadAPI();
    await this.mocker.mockTranscriptionAPI();
    await this.mocker.mockAPIError('/api/translate', 503, 'Translation service temporarily unavailable');
  }

  // 네트워크 연결 불안정 시나리오
  async mockNetworkInstability() {
    await this.mocker.mockSlowNetwork('/api/transcribe', 10000);
    await this.mocker.mockSlowNetwork('/api/translate', 8000);
  }

  // 다국어 처리 시나리오
  async mockMultiLanguageSupport() {
    await this.mocker.mockTranslationForLanguages('ko', 'en', 'Hello. This is a Korean to English translation.');
    await this.mocker.mockTranslationForLanguages('en', 'ko', '안녕하세요. 이것은 영어에서 한국어 번역입니다.');
    await this.mocker.mockTranslationForLanguages('ja', 'ko', '안녕하세요. 이것은 일본어에서 한국어 번역입니다.');
  }

  // 인증 오류 시나리오
  async mockAuthenticationErrors() {
    await this.mocker.mockAPIError('/api/projects', 401, 'Unauthorized');
    await this.mocker.mockAPIError('/api/transcribe', 401, 'Authentication required');
    await this.mocker.mockAPIError('/api/translate', 401, 'Invalid credentials');
  }
}

// 테스트 헬퍼 함수들
export function createTestVideoFile(): File {
  // 가상의 비디오 파일 생성 (테스트용)
  const buffer = new ArrayBuffer(1024);
  return new File([buffer], 'test-video.mp4', { type: 'video/mp4' });
}

export function createTestAudioFile(): File {
  // 가상의 오디오 파일 생성 (테스트용)
  const buffer = new ArrayBuffer(512);
  return new File([buffer], 'test-audio.mp3', { type: 'audio/mp3' });
}

export async function waitForAPICall(page: Page, endpoint: string, timeout: number = 10000): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}