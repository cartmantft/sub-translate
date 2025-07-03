---

**제목 (Title):**
`[DB] Supabase 스키마 변경: Vrew-like 편집기 모델 지원`

#### 문제점 (Problem Statement)
기존 Supabase 데이터베이스 스키마는 AI 번역 서비스에 맞춰져 있어, 비디오 원본 파일의 경로를 저장하지 않고 번역 결과물 관리에 중점을 두고 있습니다. 클라이언트 사이드 편집기로 전환함에 따라, 원본 비디오 정보와 복잡한 편집 상태(블록 배열)를 효율적으로 저장하고 관리할 새로운 스키마가 필요합니다.

#### 목표 (Goal)
Supabase의 `projects` 테이블을 수정하고 `user_assets` 테이블을 신설하여, 새로운 편집기 모델을 지원하는 데이터베이스 구조를 확립합니다. `projects` 테이블은 원본 비디오 정보와 편집 데이터를 직접 관리하고, `user_assets`는 사용자가 업로드하는 재사용 리소스를 관리합니다.

#### 완료 조건 (Acceptance Criteria)
- [ ] `projects` 테이블이 제안된 DDL에 따라 수정된다.
    - [ ] `source_video_path`, `source_video_name`, `source_video_duration` 등 비디오 원본 정보 필드가 추가된다.
    - [ ] 기존의 불필요한 필드(예: AI 번역 관련)가 제거된다.
    - [ ] 편집 데이터를 저장하기 위한 `project_data` (JSONB 타입) 필드가 추가된다.
- [ ] `user_assets` 테이블이 제안된 DDL에 따라 신규 생성된다.
- [ ] 각 테이블에 대한 RLS(Row Level Security) 정책이 올바르게 설정되어, 사용자는 자신의 데이터에만 접근할 수 있다.
- [ ] 변경된 스키마에 대한 마이그레이션 스크립트가 작성되거나 Supabase 대시보드에서 직접 변경이 완료된다.

#### 예상 작업 목록 (Suggested Tasks)
- [ ] Supabase 대시보드의 SQL Editor 또는 로컬 마이그레이션 파일을 사용하여 `projects` 테이블을 `ALTER TABLE`로 수정.
- [ ] `CREATE TABLE` 문을 사용하여 `user_assets` 테이블을 신규 생성.
- [ ] 각 테이블에 대해 `ENABLE ROW LEVEL SECURITY`를 실행하고, `CREATE POLICY`를 사용하여 접근 제어 정책을 적용.
- [ ] 변경된 스키마에 맞춰 `lib/supabase.ts`의 타입 정의(예: `Project` 타입)를 업데이트.
- [ ] 기존에 데이터가 있었다면, 데이터 마이그레이션을 위한 스크립트를 작성 및 실행.

---