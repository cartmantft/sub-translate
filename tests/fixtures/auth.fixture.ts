import { test as base, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// 테스트 사용자 타입 정의
export interface TestUser {
  email: string;
  password: string;
  id?: string;
  name?: string;
}

// 인증 관련 fixture 타입
type AuthFixtures = {
  testUser: TestUser;
  authenticatedPage: any;
  supabaseClient: any;
};

// 테스트 환경 변수
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 테스트용 Supabase 클라이언트 생성
const createTestSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not found. Please check your environment variables.');
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// 테스트 사용자 생성/관리
export class TestUserManager {
  private supabase = createTestSupabaseClient();
  private testUsers: TestUser[] = [];

  async createTestUser(email?: string): Promise<TestUser> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const testEmail = email || `test-${timestamp}-${randomSuffix}@example.com`;
    const testPassword = 'TestPassword123!';

    try {
      // 기존 사용자 삭제 시도 (에러 무시)
      try {
        // 이메일로 사용자 ID 찾기
        const { data: users } = await this.supabase.auth.admin.listUsers();
        const existingUser = users.users?.find(u => u.email === testEmail);
        if (existingUser) {
          await this.supabase.auth.admin.deleteUser(existingUser.id);
        }
      } catch {
        // 사용자가 존재하지 않으면 무시
      }

      // 테스트 사용자 생성
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: `Test User ${timestamp}`,
          created_for_testing: true
        }
      });

      if (error) throw error;

      const testUser: TestUser = {
        email: testEmail,
        password: testPassword,
        id: data.user.id,
        name: `Test User ${timestamp}`
      };

      this.testUsers.push(testUser);
      return testUser;
    } catch (error) {
      console.error('Failed to create test user:', error);
      throw error;
    }
  }

  async cleanupTestUsers(): Promise<void> {
    for (const user of this.testUsers) {
      try {
        if (user.id) {
          await this.supabase.auth.admin.deleteUser(user.id);
        }
      } catch (error) {
        console.warn(`Failed to cleanup test user ${user.email}:`, error);
      }
    }
    this.testUsers = [];
  }

  async deleteTestUser(userId: string): Promise<void> {
    try {
      await this.supabase.auth.admin.deleteUser(userId);
      this.testUsers = this.testUsers.filter(user => user.id !== userId);
    } catch (error) {
      console.error(`Failed to delete test user ${userId}:`, error);
      throw error;
    }
  }
}

// 로그인 헬퍼 함수
export async function loginTestUser(page: any, testUser: TestUser) {
  await page.goto('/login');
  
  // 이메일 입력
  await page.locator('input[type="email"]').fill(testUser.email);
  
  // 패스워드 입력
  await page.locator('input[type="password"]').fill(testUser.password);
  
  // 로그인 버튼 클릭
  await page.locator('button[type="submit"]').click();
  
  // 대시보드로 리다이렉트되는지 확인
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  
  // 로그인 상태 확인 - 더 구체적인 선택자 사용
  await expect(page.getByRole('heading', { name: '내 프로젝트' })).toBeVisible();
}

// 로그아웃 헬퍼 함수
export async function logoutTestUser(page: any) {
  // 로그아웃 버튼 찾기 (실제 구현에 따라 조정 필요)
  const logoutButton = page.getByRole('button', { name: '로그아웃' })
    .or(page.getByText('로그아웃'))
    .or(page.locator('[data-testid="logout-button"]'));
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // 직접 로그아웃 API 호출
    await page.evaluate(() => {
      return fetch('/api/auth/logout', { method: 'POST' });
    });
  }
  
  // 홈페이지로 리다이렉트되는지 확인
  await expect(page).toHaveURL('/', { timeout: 5000 });
}

// 인증 상태 확인 헬퍼
export async function checkAuthStatus(page: any): Promise<boolean> {
  try {
    const response = await page.request.get('/api/auth/user');
    return response.status() === 200;
  } catch {
    return false;
  }
}

// Auth fixture 확장
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const userManager = new TestUserManager();
    const testUser = await userManager.createTestUser();
    
    await use(testUser);
    
    // 테스트 완료 후 사용자 정리
    await userManager.cleanupTestUsers();
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // 테스트 사용자로 로그인
    await loginTestUser(page, testUser);
    
    await use(page);
    
    // 테스트 완료 후 로그아웃
    await logoutTestUser(page);
  },

  supabaseClient: async ({}, use) => {
    const client = createTestSupabaseClient();
    await use(client);
  }
});

export { expect } from '@playwright/test';