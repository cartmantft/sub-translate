# 프로젝트 CRUD 통합 테스트 가이드

## 개요

완전히 리팩토링된 프로젝트 CRUD 통합 테스트는 SubTranslate 애플리케이션의 핵심 기능을 포괄적으로 테스트합니다. Page Object Model 패턴을 사용하여 유지보수가 쉽고 견고한 테스트를 구현했습니다.

## 테스트 구조

### 1. 테스트 카테고리

#### 기본 CRUD 테스트
- **생성 (Create)**: 새 프로젝트 생성, 다양한 상태의 프로젝트 생성
- **조회 (Read)**: 프로젝트 목록 조회, 상세 조회, 통계 정보 조회
- **수정 (Update)**: 프로젝트 제목 수정, 유효성 검사, 상태 업데이트
- **삭제 (Delete)**: 프로젝트 삭제 확인/취소, 대량 삭제

#### 고급 테스트 시나리오
- **대량 데이터 처리**: 50개+ 프로젝트 생성/삭제 성능 테스트
- **동시성 테스트**: 동시 생성/수정/읽기 작업
- **에러 처리**: 존재하지 않는 리소스, 권한 오류, 네트워크 오류
- **검색/필터링**: 제목 검색, 상태별 필터링, 정렬

#### 사용성 테스트
- **접근성**: 키보드 네비게이션 테스트
- **반응형 디자인**: 모바일/태블릿/데스크톱 뷰포트 테스트
- **다국어 지원**: 유니코드 제목, 다양한 언어 조합

### 2. Page Object Model 구조

```typescript
// DashboardPage - 대시보드 페이지 추상화
class DashboardPage extends BasePage {
  // 로케이터들
  get projectCards(): Locator
  get searchInput(): Locator
  get sortDropdown(): Locator

  // 액션들
  async editProjectName(oldTitle: string, newTitle: string): Promise<void>
  async deleteProject(title: string): Promise<void>
  async searchProjects(query: string): Promise<void>
}

// TestDataSeeder - 테스트 데이터 관리
class TestDataSeeder {
  async createTestProject(userId: string, data?: Partial<TestProject>): Promise<TestProject>
  async createMultipleTestProjects(userId: string, count: number): Promise<TestProject[]>
  async cleanupUserProjects(userId: string): Promise<void>
}
```

### 3. 테스트 실행 명령어

```bash
# 전체 CRUD 통합 테스트 실행
npx playwright test tests/project-crud-integrated.spec.ts

# 헤드 모드로 실행 (브라우저 창 표시)
npx playwright test tests/project-crud-integrated.spec.ts --headed

# UI 모드로 실행
npx playwright test tests/project-crud-integrated.spec.ts --ui

# 특정 테스트 그룹만 실행
npx playwright test tests/project-crud-integrated.spec.ts -g "프로젝트 생성"
npx playwright test tests/project-crud-integrated.spec.ts -g "대량 데이터 처리"

# 디버그 모드 실행
npx playwright test tests/project-crud-integrated.spec.ts --debug
```

## 테스트 시나리오 상세

### 1. 기본 CRUD 테스트

#### 생성 (Create)
- ✅ 새 프로젝트 생성 전체 플로우
- ✅ 다양한 상태(processing, completed, failed)의 프로젝트 생성

#### 조회 (Read) 
- ✅ 프로젝트 목록 조회 및 페이지네이션
- ✅ 프로젝트 상세 페이지 조회
- ✅ 통계 정보 조회 (총 개수, 상태별 개수)

#### 수정 (Update)
- ✅ 프로젝트 제목 수정 성공 케이스
- ✅ 유효성 검사 (빈 제목, 너무 긴 제목)
- ✅ 여러 프로젝트 동시 수정
- ✅ 프로젝트 상태 업데이트

#### 삭제 (Delete)
- ✅ 프로젝트 삭제 확인 플로우
- ✅ 프로젝트 삭제 취소 플로우
- ✅ 모든 프로젝트 삭제

### 2. 성능 및 확장성 테스트

#### 대량 데이터 처리
```typescript
test('대량 프로젝트 생성 및 표시 성능', async ({ testUser }) => {
  // 50개 프로젝트 생성
  // 페이지 로딩 시간 측정
  // 성능 임계값 확인 (10초 이내)
});
```

#### 동시성 테스트
```typescript
test('동시 프로젝트 생성', async ({ testUser }) => {
  const promises = Array.from({ length: 5 }, (_, i) =>
    seeder.createTestProject(testUser.id!, {
      title: `Concurrent Project ${i + 1}`
    })
  );
  const projects = await Promise.all(promises);
  // 모든 프로젝트가 고유한 ID를 가지는지 확인
});
```

### 3. 에러 처리 테스트

#### API 에러 처리
- ✅ 존재하지 않는 프로젝트 수정/삭제 시도 (404 에러)
- ✅ 권한 없는 접근 시도 (401 에러)
- ✅ 네트워크 오류 시뮬레이션

#### 사용자 입력 검증
- ✅ 빈 제목 입력 시 에러 메시지 표시
- ✅ 너무 긴 제목 입력 시 제한 적용

### 4. 검색 및 필터링 테스트

#### 검색 기능
```typescript
test('프로젝트 제목으로 검색', async ({ testUser }) => {
  // 'Alpha' 키워드로 검색
  // 매칭되는 프로젝트만 표시되는지 확인
});
```

#### 필터링 및 정렬
- ✅ 상태별 필터링 (completed, processing, failed)
- ✅ 이름순/날짜순 정렬

### 5. 접근성 및 사용성 테스트

#### 키보드 네비게이션
```typescript
test('키보드 네비게이션', async ({ authenticatedPage, testUser }) => {
  // Tab 키로 프로젝트 카드 포커스
  await authenticatedPage.keyboard.press('Tab');
  // Enter 키로 프로젝트 열기
  await authenticatedPage.keyboard.press('Enter');
});
```

#### 반응형 디자인
- ✅ 모바일 뷰포트 (375x667) 테스트
- ✅ 태블릿 뷰포트 (768x1024) 테스트
- ✅ 데스크톱 뷰포트 (1200x800) 테스트

### 6. 다국어 지원 테스트

#### 유니코드 지원
```typescript
test('긴 유니코드 제목 처리', async ({ authenticatedPage, testUser }) => {
  const unicodeTitle = '🎬 한글과 English와 日本語가 섞인 매우 긴 프로젝트 제목입니다 🚀✨';
  // 유니코드 제목 생성 및 편집 테스트
});
```

## 테스트 환경 설정

### 환경 변수
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 테스트 데이터 관리
- 각 테스트 전후에 자동으로 테스트 데이터 정리
- TestDataSeeder를 통한 일관된 테스트 데이터 생성
- 테스트 간 데이터 격리 보장

### Page Object Model 장점
1. **유지보수성**: UI 변경 시 Page Object만 수정하면 됨
2. **재사용성**: 동일한 페이지 액션을 여러 테스트에서 재사용
3. **가독성**: 테스트 코드가 비즈니스 로직에 집중
4. **견고성**: 다양한 selector 전략으로 UI 변경에 대응

## 테스트 실행 및 디버깅

### CI/CD 파이프라인에서 실행
```yaml
- name: Run CRUD Integration Tests
  run: npx playwright test tests/project-crud-integrated.spec.ts --reporter=html
```

### 로컬 개발 환경에서 디버깅
1. `--headed` 플래그로 브라우저 창 표시
2. `--debug` 플래그로 단계별 실행
3. `--ui` 플래그로 Playwright UI 모드 사용

### 테스트 결과 분석
- HTML 리포트로 테스트 결과 확인
- 스크린샷과 비디오 기록으로 실패 원인 분석
- 성능 측정 로그로 병목 지점 파악

## 향후 개선 계획

1. **시각적 회귀 테스트**: 스크린샷 비교 테스트 추가
2. **API 모킹**: 외부 의존성 제거를 위한 API 모킹
3. **테스트 데이터 팩토리**: 더 다양한 테스트 시나리오를 위한 데이터 팩토리 확장
4. **병렬 실행 최적화**: 테스트 실행 시간 단축을 위한 병렬화 개선