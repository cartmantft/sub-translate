# SubTranslate 고도화 테스트 가이드

## 개요

이 가이드는 SubTranslate 프로젝트의 고도화된 테스트 시스템에 대한 포괄적인 설명을 제공합니다. 로그인 이후 기능들을 포함한 모든 시나리오를 테스트할 수 있는 프레임워크가 구축되어 있습니다.

## 테스트 아키텍처

### 핵심 구성 요소

1. **인증 시스템 (Auth System)**
   - `tests/fixtures/auth.fixture.ts` - 테스트 사용자 관리
   - 자동 사용자 생성/삭제
   - 세션 관리

2. **데이터 시드 시스템**
   - `tests/utils/test-data.ts` - 격리된 테스트 데이터 환경
   - 프로젝트 생성/관리
   - 테스트 완료 후 자동 정리

3. **API 모킹 시스템**
   - `tests/utils/api-mocks.ts` - 외부 API 시뮬레이션
   - OpenAI/Google API 응답 모킹
   - 에러 시나리오 시뮬레이션

4. **Page Object Model**
   - `tests/pages/` - 재사용 가능한 페이지 객체
   - 유지보수성 향상

## 테스트 카테고리

### 1. 인증 테스트 (`authenticated-dashboard.spec.ts`)

**목적:** 인증된 사용자의 대시보드 접근 및 기본 기능 테스트

**주요 시나리오:**
- 대시보드 접근 권한 확인
- 빈 상태 vs 프로젝트 있는 상태
- 프로젝트 상태별 표시
- 반응형 디자인

**사용법:**
```bash
npm test -- authenticated-dashboard.spec.ts
```

### 2. CRUD 통합 테스트 (`project-crud-integrated.spec.ts`)

**목적:** 프로젝트 생성, 편집, 삭제 전체 플로우 테스트

**주요 시나리오:**
- 프로젝트 편집 (제목 변경, 유효성 검사)
- 프로젝트 삭제 (확인 대화상자, 취소)
- 실시간 UI 업데이트
- 다중 프로젝트 관리

**특징:**
- 실제 데이터베이스 상태 검증
- UI와 백엔드 동기화 확인

### 3. End-to-End 워크플로우 (`e2e-workflow.spec.ts`)

**목적:** 로그인부터 프로젝트 완료까지 전체 사용자 여정 테스트

**주요 시나리오:**
- 완전한 워크플로우 (업로드→전사→번역→저장)
- 에러 처리 (전사 실패, 번역 실패)
- 네트워크 불안정 환경
- 다국어 처리
- 사용자 피드백

### 4. 파일 업로드 테스트 (`file-upload-processing.spec.ts`)

**목적:** 다양한 파일 형식 및 크기 처리 테스트

**주요 시나리오:**
- 지원/미지원 파일 형식 검증
- 대용량 파일 제한
- 업로드 진행률 표시
- 드래그 앤 드롭
- 배치 업로드

### 5. 접근성 테스트 (`accessibility.spec.ts`)

**목적:** WCAG 가이드라인 준수 및 사용성 테스트

**주요 시나리오:**
- 키보드 네비게이션
- ARIA 레이블 및 속성
- 스크린 리더 호환성
- 색상 대비 검사
- 모달 접근성

### 6. 성능 테스트 (`performance.spec.ts`)

**목적:** 애플리케이션 성능 및 최적화 검증

**주요 시나리오:**
- Core Web Vitals (LCP, CLS)
- 대량 데이터 렌더링
- 메모리 사용량 모니터링
- 동시 사용자 시뮬레이션
- 리소스 로딩 최적화

## 환경 설정

### 필수 환경 변수

`.env.local` 파일에 다음 변수들을 설정해야 합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API 키 (모킹되므로 실제 키 불필요)
OPENAI_API_KEY=test_key
GOOGLE_API_KEY=test_key
```

### 데이터베이스 설정

테스트는 실제 Supabase 데이터베이스를 사용하므로:

1. 테스트 전용 Supabase 프로젝트 권장
2. Row Level Security (RLS) 정책 설정
3. 테스트 완료 후 데이터 자동 정리

## 테스트 실행

### 기본 실행

```bash
# 모든 테스트 실행 (headless)
npm test

# 특정 테스트 파일 실행
npm test -- authenticated-dashboard.spec.ts

# UI 모드로 실행 (브라우저에서 시각적으로 확인)
npm run test:ui

# 헤드 모드로 실행 (브라우저 창이 열리면서 실행)
npm run test:headed
```

### 🎯 **시각적 테스트 실행 (사용자가 직접 보고 싶을 때)**

#### 1. **UI 모드 - 대화형 테스트 실행**
```bash
# 전체 테스트를 UI에서 실행
npm run test:ui

# 특정 테스트만 UI에서 실행
npm test -- --ui authenticated-dashboard.spec.ts
```
- 브라우저에서 테스트 결과를 실시간으로 확인
- 각 테스트 단계별로 스크린샷 제공
- 실패한 테스트의 상세 정보 확인 가능
- 테스트를 선택적으로 실행/재실행 가능

#### 2. **Headed 모드 - 브라우저 창에서 실행**
```bash
# 브라우저 창이 열리면서 테스트 실행
npm run test:headed

# 특정 브라우저로 실행
npm test -- --headed --project=chromium

# 느린 속도로 실행 (동작을 자세히 관찰)
npm test -- --headed --slow-mo=1000
```

#### 3. **디버그 모드 - 단계별 실행**
```bash
# 디버그 모드로 실행 (각 단계에서 일시정지)
npm run test:debug

# 특정 테스트만 디버그
npm test -- --debug e2e-workflow.spec.ts
```

#### 4. **데모용 실행 - 슬로우 모션**
```bash
# 슬로우 모션으로 실행 (데모용)
npm test -- --headed --slow-mo=2000 e2e-workflow.spec.ts

# 특정 브라우저에서 슬로우 모션
npm test -- --headed --slow-mo=1500 --project=chromium navigation.spec.ts
```

### 병렬 실행

```bash
# 브라우저별 병렬 실행
npm test -- --project=chromium,firefox

# 워커 수 지정
npm test -- --workers=4

# 단일 워커로 실행 (시각적 확인용)
npm test -- --workers=1 --headed
```

### 특정 테스트만 실행

```bash
# 태그별 실행
npm test -- --grep="인증"

# 특정 describe 블록
npm test -- --grep="프로젝트 CRUD"

# 한 개 테스트만 실행 (시각적 확인용)
npm test -- --headed "인증된 사용자가 대시보드에 접근할 수 있음"
```

### 📹 **녹화 및 스크린샷**

```bash
# 비디오 녹화하면서 실행
npm test -- --video=on

# 실패시에만 비디오 저장
npm test -- --video=retain-on-failure

# 스크린샷 캡처
npm test -- --screenshot=only-on-failure

# 모든 단계 스크린샷
npm test -- --screenshot=on
```

### 🎬 **데모용 간단한 테스트 실행**

빠르게 테스트를 확인하고 싶을 때 사용할 수 있는 간단한 데모 테스트들:

```bash
# 📺 기본 데모 테스트 (브라우저 창에서 실행)
npm run test:demo

# 🐌 슬로우 모션 데모 (동작을 자세히 관찰)
npm run test:demo:slow

# 🖥️ UI 모드로 데모 테스트
npm run test:demo:ui

# 🚀 모든 테스트를 시각적으로 실행
npm run test:show
```

#### 데모 테스트 내용:
1. **홈페이지 기본 동작 확인** - 메인 요소들 표시 여부
2. **로그인 페이지 이동** - 네비게이션 테스트
3. **홈으로 돌아가기** - 뒤로 가기 기능
4. **대시보드 접근 제한** - 인증 보호 확인
5. **반응형 디자인** - 모바일 뷰 테스트
6. **키보드 네비게이션** - 접근성 기본 테스트
7. **🎬 전체 사용자 여정** - 슬로우 모션 데모

#### 추천 실행 방법:

**처음 사용자 (테스트 결과만 확인):**
```bash
npm run test:demo:ui
```

**개발자 (동작 과정 관찰):**
```bash
npm run test:demo:slow
```

**빠른 확인 (기본 테스트):**
```bash
npm run test:demo
```

## 테스트 작성 가이드

### 1. 인증이 필요한 테스트

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('인증된 사용자 테스트', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage는 이미 로그인된 상태
  // testUser에는 테스트 사용자 정보 포함
  
  await expect(authenticatedPage).toHaveURL('/dashboard');
});
```

### 2. 테스트 데이터 사용

```typescript
import { TestDataSeeder } from './utils/test-data';

test.beforeEach(async ({ testUser }) => {
  const seeder = new TestDataSeeder();
  if (testUser.id) {
    // 테스트 프로젝트 생성
    await seeder.createTestProject(testUser.id, {
      title: 'Test Project',
      status: 'completed'
    });
  }
});
```

### 3. API 모킹

```typescript
import { APIRequestMocker } from './utils/api-mocks';

test('API 모킹 테스트', async ({ page }) => {
  const mocker = new APIRequestMocker(page);
  
  // 성공 응답 모킹
  await mocker.mockTranscriptionAPI({
    text: "모킹된 전사 결과"
  });
  
  // 에러 응답 모킹
  await mocker.mockAPIError('/api/transcribe', 500, 'Server Error');
});
```

## 디버깅 및 문제 해결

### 1. 테스트 실패 시

```bash
# 디버그 모드로 실행
npm test -- --debug

# 스크린샷 캡처
npm test -- --screenshot=only-on-failure

# 비디오 녹화
npm test -- --video=retain-on-failure
```

### 2. 일반적인 문제들

**인증 실패:**
- Supabase 환경 변수 확인
- Service Role Key 권한 확인

**테스트 타임아웃:**
- 네트워크 속도 확인
- 타임아웃 값 조정: `{ timeout: 30000 }`

**데이터 정리 실패:**
- `test.afterEach`에서 수동 정리
- Supabase RLS 정책 확인

### 3. 로그 확인

```typescript
// 테스트 내에서 로깅
console.log('Current URL:', page.url());
console.log('User ID:', testUser.id);

// API 요청 로깅
await apiMocker.enableRequestLogging();
```

## CI/CD 통합

### GitHub Actions 설정 예시

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npx playwright install
      
      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## 성능 최적화

### 1. 테스트 속도 향상

- 병렬 실행 활용
- 불필요한 `waitFor` 제거
- 적절한 타임아웃 설정
- 테스트 데이터 재사용

### 2. 리소스 관리

- 테스트 완료 후 정리
- 메모리 누수 방지
- 브라우저 컨텍스트 재사용

## 테스트 커버리지

현재 구현된 테스트 커버리지:

- ✅ 인증 및 권한 관리
- ✅ 프로젝트 CRUD 작업
- ✅ 파일 업로드/처리
- ✅ 전체 워크플로우
- ✅ 접근성 (WCAG 준수)
- ✅ 성능 및 최적화
- ⏳ 데이터베이스 상태 검증 (예정)

## 확장 가능성

이 테스트 프레임워크는 다음과 같이 확장 가능합니다:

1. **새로운 기능 테스트 추가**
2. **다른 브라우저 지원**
3. **모바일 테스트**
4. **시각적 회귀 테스트**
5. **API 테스트 확장**

## 문의 및 지원

테스트 관련 문의사항이나 문제가 있으면:

1. GitHub Issues에 문제 등록
2. 테스트 로그 및 스크린샷 첨부
3. 재현 가능한 최소 예제 제공

---

이 고도화된 테스트 시스템을 통해 SubTranslate의 품질과 안정성을 크게 향상시킬 수 있습니다.