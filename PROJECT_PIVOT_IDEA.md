# 프로젝트 방향 전환 제안: AI 자동 번역기에서 Vrew-like 숏폼 비디오 편집기로

1인 개발자의 리소스 한계를 고려하여, 프로젝트의 방향을 서버 중심의 AI 번역 서비스에서 **Vrew.ai의 핵심 UX를 차용한 클라이언트 중심의 숏폼 비디오 편집기**로 전환하는 전략적 아이디어입니다.

## 1. 방향 전환의 핵심 이유

- **비용 문제 해결**: GPU 서버, 대용량 스토리지, 무거운 데이터베이스 등 높은 유지 비용이 발생하는 요소를 근본적으로 제거합니다.
- **리소스 집중**: 통제하기 어려운 백엔드 인프라 및 AI 모델 의존성에서 벗어나, 1인 개발자가 강점을 가질 수 있는 **사용자 경험(UX)과 프론트엔드 기술에 집중**할 수 있습니다.
- **시장 확장성**: 틈새 시장인 자동 번역보다 훨씬 더 넓은 **콘텐츠 크리에이터 및 마케터 시장**을 타겟으로 할 수 있습니다.
- **검증된 UX**: Vrew.ai를 통해 **'텍스트 기반(블록 기반) 영상 편집'**이라는 직관적인 UX가 시장에서 성공적으로 검증되었습니다. AI 없이 이 핵심 경험을 제공하는 데 집중합니다.

## 2. 모델 비교

| 항목 | 기존 모델 (AI 자동 번역) | 제안 모델 (Vrew-like 편집기) |
| :--- | :--- | :--- |
| **핵심 기술** | **서버 사이드** (AI/ML, 대규모 처리) | **클라이언트 사이드** (브라우저 기술, UI/UX) |
| **리소스 부담** | **높음** (GPU 서버, 스토리지, DB 비용) | **낮음** (주요 연산이 사용자 브라우저에서 발생) |
| **주요 과제** | AI 모델 정확도, 처리 속도, 인프라 관리 | 직관적인 UI/UX, 브라우저 호환성, 렌더링 성능 |
| **확장성** | 사용자가 늘면 서버 비용이 정비례하여 증가 | 사용자가 늘어도 서버 비용 증가는 미미 |

## 3. Vrew.ai 핵심 UX 차용 전략: "블록 기반 편집"

Vrew의 혁신은 AI 자동 자막이 아닌, **"텍스트(자막)를 편집하면 타임라인이 따라 변하는"** 직관적인 경험입니다. AI는 단지 '타임스탬프가 찍힌 텍스트 블록'을 자동으로 생성해주는 도구일 뿐입니다.

우리는 AI 대신 **사용자가 직접 '의미 단위의 블록'을 생성**하고, 그 블록을 조작하여 영상을 편집하는 경험을 제공함으로써 서버 비용 없이 Vrew의 핵심 가치를 구현합니다.

**핵심 워크플로우:**
1.  **블록 생성**: 사용자가 영상을 보며 의미 있는 구간의 시작/끝을 지정하여 '편집 블록'을 생성합니다.
2.  **콘텐츠 추가**: 각 블록에 자막, 텍스트, 이미지 등 콘텐츠를 추가하고 스타일을 편집합니다.
3.  **컷 편집 (블록 조작)**: 타임라인에서 블록을 드래그하여 순서를 바꾸거나, 필요 없는 블록을 삭제하는 것만으로 컷 편집이 완료됩니다.
4.  **렌더링**: 최종 확정된 블록의 순서와 내용에 따라 브라우저 내에서 비디오를 렌더링합니다.

## 4. MVP 제안: "블록 기반 클라이언트 사이드 에디터"

**핵심 가치**: "서버 없이, 설치 없이, Vrew처럼 쉽게"

**코어 기능:**
1.  **타임라인 기반 블록 생성기**: 비디오 재생에 맞춰 `[ 구간 시작 ]` / `[ 구간 끝 ]` 버튼으로 시간 기반의 '블록'을 생성하고, 타임라인에 시각적으로 표시합니다.
2.  **블록 단위 콘텐츠 편집기**: 선택된 블록에 텍스트(자막)를 추가하고 스타일(폰트, 색상, 배경)을 지정합니다. 추가적으로 이미지 오버레이 기능을 제공합니다.
3.  **인터랙티브 타임라인**: 타임라인 위의 블록들을 드래그 앤 드롭으로 순서를 변경하거나 삭제하여 직관적인 컷 편집을 지원합니다.
4.  **클라이언트 사이드 렌더링**: `ffmpeg.wasm` 등을 활용하여, 편집된 블록 정보를 바탕으로 최종 비디오를 브라우저 내에서 생성하고 다운로드시킵니다.
5.  **프로젝트 상태 저장**: 비디오 원본이 아닌, **블록들의 배열과 각 블록의 콘텐츠 정보가 담긴 JSON 데이터**를 Supabase에 저장하고 불러옵니다.

## 5. 기술적 전환 전략: 기존 자산 활용 방안

- **`FileUploader.tsx` & `VideoPlayer.tsx`**: 클라이언트 비디오 로딩 및 재생의 기반으로 활용합니다.
- **`SubtitleEditor.tsx` / `UnifiedSubtitleViewer.tsx`**: **피봇의 핵심 자산.** '자막 편집기'에서 **'블록 단위 콘텐츠 편집기'**로 기능을 확장/개편합니다.
- **`Supabase` 백엔드**:
    - **스키마 변경**: `projects` 테이블에서 비디오 URL 등 불필요한 필드를 제거합니다.
    - `project_data` (JSON 타입) 필드를 추가하여, **편집 블록 배열(타임라인, 콘텐츠 정보 포함)**을 저장합니다.

## 6. 제안 실행 계획 (단계별 구체화)

1.  **1단계 (Foundation & PoC)**:
    *   `project/[id]/page.tsx`에 **3단 레이아웃(미디어/리소스, 비디오 미리보기, 타임라인)**을 설계합니다.
    *   비디오를 로드하고, 수동으로 '블록'을 생성하여 타임라인에 표시하는 기능을 구현합니다.
    *   생성된 블록 정보(JSON)를 Supabase에 저장하고 불러오는 PoC를 완료합니다.

2.  **2단계 (Core Editing Features)**:
    *   '블록 단위 콘텐츠 편집기'를 구현하여, 선택된 블록에 텍스트를 추가하고 스타일링하는 기능을 개발합니다.
    *   타임라인에서 블록을 삭제하고, 순서를 변경하는 기능을 구현합니다.

3.  **3단계 (Rendering & Export)**:
    *   `ffmpeg.wasm`을 연동하여, 현재 블록 순서와 내용에 따라 최종 비디오를 렌더링하고 다운로드하는 기능을 구현합니다.

4.  **4단계 (Advanced Features)**:
    *   블록에 이미지/스티커 오버레이 기능 추가.
    *   사용자 소유의 배경음악(BGM)을 추가하는 오디오 트랙 기능.

## 7. 데이터베이스 스키마 설계 (Supabase)

숏폼 비디오의 특성과 개발 편의성을 고려하여, 사용자가 업로드한 원본 비디오를 Supabase Storage에 저장하고 관리하는 스키마를 채택합니다.

### 1. `projects` 테이블 (수정)

프로젝트의 메타데이터와 함께, Supabase Storage에 저장된 원본 비디오의 정보도 직접 관리합니다.

```sql
-- projects 테이블: 프로젝트 메타데이터, 편집 상태, 그리고 Storage에 저장된 원본 비디오 정보를 관리합니다.
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) > 0),

    -- 원본 비디오 정보 (Storage 연동)
    source_video_path text, -- Supabase Storage 내의 비디오 파일 경로 (예: public/user-id/project-id.mp4)
    source_video_name text, -- 사용자가 올린 원본 영상 파일명 (UI 표시용)
    source_video_duration numeric, -- 비디오 총 길이 (초 단위)
    source_video_width integer, -- 비디오 해상도 (너비)
    source_video_height integer, -- 비디오 해상도 (높이)

    -- 편집 데이터
    project_data jsonb, -- 편집의 모든 상태를 저장하는 핵심 JSON 데이터

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 프로젝트만 보고 수정할 수 있습니다.
CREATE POLICY "Users can manage their own projects"
ON public.projects
FOR ALL
USING (auth.uid() = user_id);
```

### 2. `project_data` JSONB 필드 상세 구조

편집기의 모든 상태를 담는 핵심 필드입니다. JSONB 타입을 사용하여 유연성을 극대화합니다.

```json
{
  "version": "1.0",
  "timeline": [
    {
      "blockId": "block-uuid-1",
      "sourceStartTime": 0.0,
      "sourceEndTime": 5.5,
      "elements": [
        {
          "elementId": "element-uuid-1",
          "type": "text",
          "content": "안녕하세요! 첫 번째 장면입니다.",
          "position": { "x": 0.5, "y": 0.8 },
          "style": { "fontSize": 48, "color": "#FFFFFF" }
        }
      ]
    }
  ]
}
```

### 3. `user_assets` 테이블

사용자가 업로드하는 이미지, 로고, 배경음악 등 재사용 가능한 리소스를 관리하는 테이블입니다.

```sql
-- user_assets 테이블: 사용자가 업로드한 이미지, 오디오 등의 재사용 리소스를 관리합니다.
CREATE TABLE public.user_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path text NOT NULL UNIQUE, -- Supabase Storage 내의 파일 경로
    file_name text NOT NULL,
    file_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화 및 정책 설정은 이전과 동일
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assets"
ON public.user_assets
FOR ALL
USING (auth.uid() = user_id);
```