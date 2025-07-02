# 🚀 고도화된 테스트 설정 가이드

## 📋 **현재 상태 확인**

현재 `.env.local` 파일에는 다음이 설정되어 있습니다:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - 설정 완료
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 설정 완료
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **설정 필요**

## 🔑 **Step 1: Supabase Service Role Key 획득**

### 방법 1: Supabase 대시보드에서 직접 얻기

1. **Supabase 프로젝트 접속**
   ```
   https://supabase.com/dashboard/project/zzzdgxlisqlgptymtmsg
   ```

2. **API 설정 페이지로 이동**
   - 왼쪽 사이드바에서 `Settings` 클릭
   - `API` 섹션 클릭

3. **Service Role Key 복사**
   - `Project API keys` 섹션에서
   - `service_role` 키의 값을 복사 (매우 긴 JWT 토큰)
   - ⚠️ **주의**: 이 키는 관리자 권한이므로 절대 공개하지 마세요!

### 방법 2: Supabase CLI 사용 (선택사항)

```bash
# Supabase CLI 설치 (아직 없다면)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 키 확인
supabase projects api-keys --project-ref zzzdgxlisqlgptymtmsg
```

## ⚙️ **Step 2: 환경 변수 설정**

`.env.local` 파일에서 다음 라인을 수정:

```bash
# 현재 (수정 필요)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 수정 후 (실제 키로 교체)
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

## 🧪 **Step 3: 고도화된 테스트 실행**

환경 변수 설정이 완료되면 다음 명령어들로 고도화된 테스트를 실행할 수 있습니다:

### 🔐 **인증된 사용자 대시보드 테스트**
```bash
# 기본 실행
npm test -- authenticated-dashboard.spec.ts --project=chromium

# 브라우저에서 보면서 실행 (추천!)
npm test -- authenticated-dashboard.spec.ts --headed --slow-mo=1000 --project=chromium

# UI 모드로 실행 (가장 보기 좋음)
npm test -- authenticated-dashboard.spec.ts --ui
```

**이 테스트가 하는 일:**
- 실제 테스트 사용자 `test-{timestamp}@example.com` 생성
- 그 사용자로 진짜 로그인
- 인증된 대시보드 접근 및 기능 확인
- 테스트 완료 후 사용자 자동 삭제

### ⚙️ **프로젝트 CRUD 통합 테스트**
```bash
# 프로젝트 생성/편집/삭제 전체 플로우
npm test -- project-crud-integrated.spec.ts --headed --slow-mo=1500

# 특정 테스트만 실행
npm test -- project-crud-integrated.spec.ts --grep="프로젝트 편집" --headed
```

**이 테스트가 하는 일:**
- 실제 데이터베이스에 테스트 프로젝트 생성
- UI에서 프로젝트 편집/삭제 작업
- 데이터베이스 상태 변화 검증
- UI와 백엔드 동기화 확인

### 🎬 **End-to-End 워크플로우 테스트**
```bash
# 전체 사용자 여정 (가장 재미있음!)
npm test -- e2e-workflow.spec.ts --headed --slow-mo=2000

# 슬로우 모션으로 데모처럼 실행
npm test -- e2e-workflow.spec.ts --headed --slow-mo=3000 --grep="전체 워크플로우"
```

**이 테스트가 하는 일:**
- 로그인 → 파일 업로드 → 전사 → 번역 → 저장 전체 과정
- 에러 시나리오 처리 (API 실패, 네트워크 오류 등)
- API 모킹을 통한 안정적 테스트

### 📂 **파일 업로드 테스트**
```bash
# 다양한 파일 형식 및 크기 테스트
npm test -- file-upload-processing.spec.ts --headed

# 대용량 파일 테스트만
npm test -- file-upload-processing.spec.ts --grep="대용량" --headed
```

### ♿ **접근성 테스트**
```bash
# WCAG 가이드라인 준수 확인
npm test -- accessibility.spec.ts --headed

# 키보드 네비게이션만 테스트
npm test -- accessibility.spec.ts --grep="키보드" --headed
```

## 🎯 **추천 실행 순서**

처음 고도화된 테스트를 실행한다면 다음 순서를 추천합니다:

```bash
# 1. 간단한 인증 테스트부터
npm test -- authenticated-dashboard.spec.ts --headed --slow-mo=1500 --grep="인증된 사용자가 대시보드에 접근"

# 2. 프로젝트 편집 테스트
npm test -- project-crud-integrated.spec.ts --headed --slow-mo=2000 --grep="프로젝트 편집"

# 3. 전체 E2E 워크플로우
npm test -- e2e-workflow.spec.ts --headed --slow-mo=2500 --grep="전체 워크플로우"
```

## 🔍 **테스트 실행 중 확인할 수 있는 것들**

### 브라우저에서 볼 수 있는 것:
- 실제 로그인 과정
- 대시보드 로딩
- 프로젝트 생성/편집/삭제
- 실시간 UI 업데이트
- 에러 처리 과정

### 콘솔에서 볼 수 있는 것:
- 테스트 사용자 생성 로그
- API 호출 과정
- 데이터베이스 상태 변화
- 테스트 완료 후 정리 과정

## ⚠️ **주의사항**

1. **Service Role Key 보안**: 절대 Git에 커밋하지 마세요
2. **테스트 데이터**: 자동으로 정리되지만, 혹시 남은 데이터는 수동 삭제
3. **속도 조절**: `--slow-mo` 값을 조정해서 관찰하기 좋은 속도로 설정
4. **브라우저 선택**: Chrome(`--project=chromium`)이 가장 안정적

## 🆘 **문제 해결**

### "Supabase credentials not found" 오류
```bash
# 환경 변수 확인
echo $SUPABASE_SERVICE_ROLE_KEY

# .env.local 파일 다시 확인
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

### 테스트 사용자 생성 실패
- Supabase 프로젝트의 Auth 설정 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 느린 실행 속도
```bash
# 더 빠르게 실행
npm test -- authenticated-dashboard.spec.ts --headed --workers=1

# 병렬 실행 (빠르지만 관찰하기 어려움)
npm test -- authenticated-dashboard.spec.ts
```

## 🎉 **성공적으로 실행되면**

테스트가 성공적으로 실행되면:
- 실제 운영환경과 동일한 조건에서 테스트 완료
- 모든 인증 플로우 검증
- 데이터베이스 통합성 확인
- UI/UX 품질 보장

**이제 진짜 고도화된 테스트를 경험해보세요! 🚀**