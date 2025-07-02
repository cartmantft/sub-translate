# Issue #8: 프로젝트 편집 및 삭제 기능 구현

**GitHub Issue Link**: https://github.com/cartmantft/sub-translate/issues/8

## 문제 정의

현재 대시보드에서 사용자가 생성한 프로젝트들을 수정하거나 삭제할 수 있는 기능이 없습니다. 사용자가 프로젝트명을 수정하거나 더 이상 필요하지 않은 프로젝트를 삭제할 수 없어 프로젝트 관리가 불편한 상황입니다.

## 목표

사용자가 대시보드에서 기존 프로젝트의 이름을 수정하고, 불필요한 프로젝트를 완전히 삭제할 수 있는 기능을 구현합니다. 삭제 시에는 프로젝트와 관련된 모든 리소스(Supabase Storage의 비디오/썸네일 파일, 데이터베이스 레코드)가 함께 제거되어야 합니다.

## 완료 조건 (Acceptance Criteria)

- [x] 각 프로젝트 카드에 편집(수정) 버튼이 추가된다
- [x] 편집 버튼 클릭 시 프로젝트명을 수정할 수 있는 인라인 편집 모드가 활성화된다
- [x] 프로젝트명 수정 후 저장하면 데이터베이스에 반영되고 UI가 업데이트된다
- [x] 각 프로젝트 카드에 삭제 버튼이 추가된다
- [x] 삭제 버튼 클릭 시 확인 모달이 나타나 실수로 삭제하는 것을 방지한다
- [x] 삭제 확인 시 Supabase Storage에서 관련 비디오/자막 파일이 삭제된다
- [x] 삭제 확인 시 데이터베이스에서 프로젝트 레코드가 삭제된다
- [x] 삭제 완료 후 대시보드 목록이 즉시 업데이트된다

## 현재 상태 분석

### 기존 코드 구조
- **Dashboard**: `/src/app/dashboard/page.tsx` - 프로젝트 카드 표시
- **Project API**: `/src/app/api/projects/route.ts` - 현재 POST 메서드만 구현
- **Database**: `projects` table with fields: `id`, `user_id`, `video_url`, `thumbnail_url`, `transcription`, `subtitles`, `title`, `created_at`
- **Storage**: Supabase Storage에 비디오 파일과 썸네일 저장

### 필요한 새로운 구현
1. **API 엔드포인트**: `/api/projects/[id]` - PUT (수정), DELETE (삭제) 메서드
2. **Storage 정리 로직**: 파일 삭제 시 관련 리소스 정리
3. **UI 컴포넌트**: 편집/삭제 버튼, 인라인 편집 모드, 확인 모달
4. **클라이언트 로직**: API 호출 및 상태 관리

## 구현 계획

### 1단계: API 엔드포인트 구현

#### 1.1 프로젝트 수정 API (`PUT /api/projects/[id]`)
```typescript
// 구현 위치: /src/app/api/projects/[id]/route.ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // 사용자 권한 확인
  // 프로젝트 소유권 검증
  // 프로젝트 이름 업데이트
  // 업데이트된 프로젝트 정보 반환
}
```

#### 1.2 프로젝트 삭제 API (`DELETE /api/projects/[id]`)
```typescript
// 구현 위치: /src/app/api/projects/[id]/route.ts
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // 사용자 권한 확인
  // 프로젝트 소유권 검증
  // Supabase Storage에서 비디오 파일 삭제
  // Supabase Storage에서 썸네일 파일 삭제
  // 데이터베이스에서 프로젝트 레코드 삭제
  // 성공 응답 반환
}
```

### 2단계: Storage 파일 정리 로직

#### 2.1 파일 URL 파싱 및 삭제 함수
```typescript
// 구현 위치: /src/lib/storage-utils.ts
export async function deleteVideoFile(videoUrl: string, supabase: SupabaseClient): Promise<void>
export async function deleteThumbnailFile(thumbnailUrl: string, supabase: SupabaseClient): Promise<void>
```

### 3단계: UI 컴포넌트 구현

#### 3.1 프로젝트 카드 업데이트
- **위치**: `/src/components/ProjectCard.tsx` (새로 생성)
- **기능**: 편집/삭제 버튼, 인라인 편집 모드, 상태 관리
- **상태**: 편집 모드, 로딩 상태, 에러 상태

#### 3.2 삭제 확인 모달
- **위치**: `/src/components/DeleteConfirmModal.tsx` (새로 생성)
- **기능**: 삭제 확인, 프로젝트 정보 표시, 확인/취소 버튼

### 4단계: 대시보드 페이지 업데이트

#### 4.1 클라이언트 컴포넌트 분리
- 현재 대시보드는 서버 컴포넌트로 구현되어 있어 상태 관리가 제한됨
- 프로젝트 목록 부분을 클라이언트 컴포넌트로 분리하여 실시간 업데이트 구현

#### 4.2 상태 관리 및 API 호출
- React Query 또는 SWR을 사용한 데이터 페칭 및 캐시 관리
- 낙관적 업데이트(Optimistic Updates) 구현

### 5단계: 에러 처리 및 사용자 피드백

#### 5.1 에러 처리
- API 호출 실패 시 에러 메시지 표시
- 네트워크 에러 및 권한 오류 처리
- 부분적 실패 시나리오 (예: 파일 삭제는 성공, DB 삭제는 실패) 처리

#### 5.2 로딩 상태 및 피드백
- 편집/삭제 중 로딩 인디케이터
- 성공/실패 토스트 메시지
- 작업 완료 후 UI 즉시 업데이트

## 기술적 구현 세부사항

### Database Schema (기존 유지)
```sql
-- projects 테이블 구조
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  transcription TEXT,
  subtitles JSONB,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage 구조
```
videos/
├── video_files/           # 업로드된 비디오 파일
│   ├── video_123.mp4
│   └── video_456.mp4
└── thumbnails/           # 생성된 썸네일
    ├── thumbnail_123.jpg
    └── thumbnail_456.jpg
```

### API 에러 응답 형식
```typescript
interface ApiError {
  success: false;
  error: string;
  details?: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}
```

## 보안 고려사항

1. **사용자 권한 확인**: 모든 API 엔드포인트에서 사용자 인증 확인
2. **프로젝트 소유권 검증**: 사용자가 자신의 프로젝트만 수정/삭제할 수 있도록 보장
3. **RLS (Row Level Security)**: Supabase RLS 정책 활용
4. **입력 검증**: 프로젝트 이름 길이 제한 및 유효성 검사
5. **Rate Limiting**: API 호출 빈도 제한 (선택사항)

## 테스트 계획

1. **Unit Tests**: API 엔드포인트 및 유틸리티 함수 테스트
2. **Integration Tests**: 데이터베이스 및 Storage 연동 테스트
3. **E2E Tests**: Playwright를 사용한 UI 플로우 테스트
   - 프로젝트 이름 편집 플로우
   - 프로젝트 삭제 플로우
   - 에러 상황 처리

## 예상 이슈 및 해결책

### 이슈 1: 동시성 문제
- **문제**: 동시에 같은 프로젝트를 수정/삭제하는 경우
- **해결책**: 데이터베이스 락킹 또는 버전 관리 시스템 구현

### 이슈 2: 부분적 실패
- **문제**: Storage 파일 삭제는 성공했지만 DB 삭제가 실패하는 경우
- **해결책**: 트랜잭션 처리 및 실패 시 롤백 메커니즘 구현

### 이슈 3: 대용량 파일 삭제
- **문제**: 큰 비디오 파일 삭제 시 타임아웃 발생 가능
- **해결책**: 백그라운드 작업 큐 또는 비동기 삭제 구현

## 배포 계획

1. **개발 환경 테스트**: 로컬 환경에서 모든 기능 테스트
2. **스테이징 배포**: 프로덕션과 동일한 환경에서 테스트
3. **점진적 롤아웃**: 일부 사용자 대상 베타 테스트 (선택사항)
4. **프로덕션 배포**: 모든 테스트 통과 후 전체 배포

## 성공 지표

- [ ] 프로젝트 이름 편집 성공률 95% 이상
- [ ] 프로젝트 삭제 성공률 95% 이상
- [ ] Storage 파일 정리 완료율 100%
- [ ] 사용자 에러 보고 0건
- [ ] 페이지 로딩 시간 증가 없음

## 후속 개선사항 (선택사항)

1. **배치 작업**: 여러 프로젝트 동시 삭제 기능
2. **휴지통 기능**: 삭제된 프로젝트 복구 가능
3. **프로젝트 복제**: 기존 프로젝트 복사 기능
4. **프로젝트 내보내기**: 프로젝트 데이터 백업 기능
5. **프로젝트 공유**: 다른 사용자와 프로젝트 공유 기능

## 완료 상태

- [x] 계획 수립 및 문서화
- [ ] API 엔드포인트 구현
- [ ] Storage 정리 로직 구현
- [ ] UI 컴포넌트 구현
- [ ] 대시보드 업데이트
- [ ] 에러 처리 및 사용자 피드백
- [ ] 테스트 구현
- [ ] 배포 및 검증

## 마일스톤

1. **Week 1**: API 엔드포인트 및 Storage 로직 구현
2. **Week 2**: UI 컴포넌트 및 대시보드 업데이트
3. **Week 3**: 테스트 및 버그 수정
4. **Week 4**: 배포 및 모니터링