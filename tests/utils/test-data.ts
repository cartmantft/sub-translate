import { createClient } from '@supabase/supabase-js';
import { TestUser } from '../fixtures/auth.fixture';

// 테스트 프로젝트 데이터 타입
export interface TestProject {
  id?: string;
  title: string;
  description?: string;
  video_url?: string;
  transcript?: string;
  translation?: string;
  language?: string;
  target_language?: string;
  status?: 'processing' | 'completed' | 'failed';
  created_at?: string;
  user_id?: string;
}

// 테스트 데이터 생성 클래스
export class TestDataSeeder {
  private supabase;

  constructor() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  // 테스트 프로젝트 생성
  async createTestProject(userId: string, projectData?: Partial<TestProject>): Promise<TestProject> {
    const defaultProject: TestProject = {
      title: `Test Project ${Date.now()}`,
      language: 'ko',
      target_language: 'en',
      status: 'completed',
      transcript: '안녕하세요. 이것은 테스트 전사 내용입니다.',
      translation: 'Hello. This is test transcription content.',
      user_id: userId,
      ...projectData
    };

    const { data, error } = await this.supabase
      .from('projects')
      .insert(defaultProject)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test project: ${error.message}`);
    }

    return data;
  }

  // 여러 테스트 프로젝트 생성
  async createMultipleTestProjects(userId: string, count: number = 3): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    
    for (let i = 0; i < count; i++) {
      const project = await this.createTestProject(userId, {
        title: `Test Project ${i + 1}`,
        status: i % 2 === 0 ? 'completed' : 'processing'
      });
      projects.push(project);
    }

    return projects;
  }

  // 특정 상태의 프로젝트 생성
  async createProjectWithStatus(userId: string, status: TestProject['status']): Promise<TestProject> {
    return this.createTestProject(userId, { status });
  }

  // 다양한 언어 조합의 프로젝트 생성
  async createMultiLanguageProjects(userId: string): Promise<TestProject[]> {
    const languagePairs = [
      { language: 'ko', target_language: 'en' },
      { language: 'en', target_language: 'ko' },
      { language: 'ja', target_language: 'ko' },
      { language: 'zh', target_language: 'en' }
    ];

    const projects: TestProject[] = [];
    
    for (const [index, langPair] of languagePairs.entries()) {
      const project = await this.createTestProject(userId, {
        title: `Multi-language Project ${index + 1}`,
        ...langPair
      });
      projects.push(project);
    }

    return projects;
  }

  // 사용자의 모든 테스트 프로젝트 삭제
  async cleanupUserProjects(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn(`Failed to cleanup projects for user ${userId}:`, error);
    }
  }

  // 특정 프로젝트 삭제
  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project ${projectId}: ${error.message}`);
    }
  }

  // 프로젝트 데이터 업데이트
  async updateProject(projectId: string, updates: Partial<TestProject>): Promise<TestProject> {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project ${projectId}: ${error.message}`);
    }

    return data;
  }

  // 사용자의 프로젝트 조회
  async getUserProjects(userId: string): Promise<TestProject[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects for user ${userId}: ${error.message}`);
    }

    return data || [];
  }

  // 프로젝트 통계 조회
  async getProjectStats(userId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    const projects = await this.getUserProjects(userId);
    
    return {
      total: projects.length,
      completed: projects.filter(p => p.status === 'completed').length,
      processing: projects.filter(p => p.status === 'processing').length,
      failed: projects.filter(p => p.status === 'failed').length
    };
  }
}

// 테스트 데이터 팩토리 함수들
export const createSampleTranscript = (language: string = 'ko'): string => {
  const transcripts = {
    ko: '안녕하세요. 이것은 한국어 테스트 전사 내용입니다. 비디오에서 추출된 음성을 텍스트로 변환한 결과입니다.',
    en: 'Hello. This is English test transcription content. This is the result of converting audio extracted from video to text.',
    ja: 'こんにちは。これは日本語のテスト転写内容です。ビデオから抽出された音声をテキストに変換した結果です。',
    zh: '你好。这是中文测试转录内容。这是将从视频中提取的音频转换为文本的结果。'
  };
  
  return transcripts[language as keyof typeof transcripts] || transcripts.ko;
};

export const createSampleTranslation = (targetLanguage: string = 'en'): string => {
  const translations = {
    en: 'Hello. This is test transcription content. This is the result of converting audio extracted from video to text.',
    ko: '안녕하세요. 이것은 테스트 전사 내용입니다. 비디오에서 추출된 음성을 텍스트로 변환한 결과입니다.',
    ja: 'こんにちは。これはテスト転写内容です。ビデオから抽出された音声をテキストに変換した結果です。',
    zh: '你好。这是测试转录内容。这是将从视频中提取的音频转换为文本的结果。'
  };
  
  return translations[targetLanguage as keyof typeof translations] || translations.en;
};

// 테스트 환경 초기화
export async function setupTestEnvironment(testUser: TestUser): Promise<{
  seeder: TestDataSeeder;
  projects: TestProject[];
}> {
  const seeder = new TestDataSeeder();
  
  // 기존 데이터 정리
  if (testUser.id) {
    await seeder.cleanupUserProjects(testUser.id);
  }
  
  // 테스트 프로젝트 생성
  const projects = testUser.id ? await seeder.createMultipleTestProjects(testUser.id) : [];
  
  return { seeder, projects };
}

// 테스트 환경 정리
export async function cleanupTestEnvironment(testUser: TestUser): Promise<void> {
  const seeder = new TestDataSeeder();
  
  if (testUser.id) {
    await seeder.cleanupUserProjects(testUser.id);
  }
}