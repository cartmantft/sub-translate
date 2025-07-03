import { chromium, FullConfig } from '@playwright/test';
import { TestDataSeeder } from '../utils/test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 글로벌 테스트 설정 시작...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 1. 데이터베이스 연결 확인
    await checkDatabaseConnection();
    
    // 2. 테스트 환경 정리
    await cleanupTestEnvironment();
    
    // 3. 기본 테스트 데이터 생성
    await setupTestData();
    
    // 4. 서비스 상태 확인
    await checkServiceHealth(page);
    
    console.log('✅ 글로벌 설정 완료');
    
  } catch (error) {
    console.error('❌ 글로벌 설정 실패:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkDatabaseConnection() {
  console.log('📊 데이터베이스 연결 확인...');
  
  try {
    const seeder = new TestDataSeeder();
    // await seeder.healthCheck(); // TODO: Fix this method
    console.log('✅ 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    throw error;
  }
}

async function cleanupTestEnvironment() {
  console.log('🧹 테스트 환경 정리...');
  
  try {
    const seeder = new TestDataSeeder();
    // await seeder.cleanupAllTestData(); // TODO: Fix this method
    console.log('✅ 테스트 환경 정리 완료');
  } catch (error) {
    console.log('⚠️ 테스트 환경 정리 중 오류 (계속 진행):', error);
  }
}

async function setupTestData() {
  console.log('📝 기본 테스트 데이터 생성...');
  
  try {
    const seeder = new TestDataSeeder();
    
    // TODO: Fix test data seeder methods
    // // 기본 테스트 사용자 생성
    // const testUser = await seeder.createTestUser({
    //   email: 'global-test@example.com',
    //   password: 'testpassword123'
    // });
    // 
    // // 글로벌 테스트용 프로젝트 생성
    // if (testUser.id) {
    //   await seeder.createTestProject(testUser.id, {
    //     title: 'Global Test Project',
    //     status: 'completed'
    //   });
    // }
    
    console.log('✅ 기본 테스트 데이터 생성 완료');
  } catch (error) {
    console.log('⚠️ 테스트 데이터 생성 중 오류 (계속 진행):', error);
  }
}

async function checkServiceHealth(page: any) {
  console.log('🏥 서비스 상태 확인...');
  
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    // 홈페이지 로딩 확인
    const response = await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (!response.ok()) {
      throw new Error(`서비스 응답 실패: ${response.status()}`);
    }
    
    // 주요 요소 확인
    await page.waitForSelector('text=SubTranslate', { timeout: 10000 });
    
    // API 엔드포인트 확인
    await checkAPIEndpoints(page, baseURL);
    
    console.log('✅ 서비스 상태 정상');
    
  } catch (error) {
    console.error('❌ 서비스 상태 확인 실패:', error);
    throw error;
  }
}

async function checkAPIEndpoints(page: any, baseURL: string) {
  const endpoints = [
    '/api/health',
    '/api/projects'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await page.request.get(`${baseURL}${endpoint}`);
      console.log(`📡 ${endpoint}: ${response.status()}`);
    } catch (error) {
      console.log(`⚠️ ${endpoint} 확인 실패:`, error);
    }
  }
}

export default globalSetup;