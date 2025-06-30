# 시스템 패턴

## 아키텍처 개요

이 애플리케이션은 최신 서버리스 아키텍처를 따르며, 프런트엔드 및 API 라우트에는 Next.js를, 백엔드 서비스에는 Supabase를 활용합니다.

```mermaid
graph TD
    User[사용자 브라우저] -->|1. 비디오 업로드| FE[Vercel의 Next.js Frontend];
    FE -->|2. 비디오 저장| SB_Storage[Supabase Storage];
    FE -->|3. Transcription 트리거| API_T[API Route: /api/transcribe];
    API_T -->|4. Whisper로 오디오 전송| Whisper[Whisper API];
    Whisper -->|5. Transcription 반환| API_T;
    API_T -->|6. Transcription 저장| SB_DB[Supabase DB];

    FE -->|7. Translation 트리거| API_Tr[API Route: /api/translate];
    API_Tr -->|8. LLM으로 텍스트 전송| Gemini[Gemini API];
    Gemini -->|9. Translation 반환| API_Tr;
    API_Tr -->|10. Translation 저장| SB_DB;

    subgraph Project Saving
        FE -->|11. 프로젝트 데이터 전송| API_P[API Route: /api/projects];
        API_P -->|12. 프로젝트 저장| SB_DB;
    end

    User -->|13. 자막 보기 & 대시보드| FE;
    FE -->|14. 데이터 가져오기| SB_DB;
```

## 주요 디자인 패턴

- **Serverless Functions:** 외부 API(Whisper, Gemini)와 통신하는 모든 백엔드 로직은 Next.js API Routes에 캡슐화됩니다. 이를 통해 프런트엔드와 백엔드 코드를 동일한 리포지토리에서 관리하고 배포를 단순화할 수 있습니다.
- **Backend as a Service (BaaS):** Supabase가 데이터베이스, 사용자 인증, 파일 스토리지를 처리하므로 인프라 관리보다는 핵심 애플리케이션 로직에 집중할 수 있습니다.
- **Component-Based UI:** 프런트엔드는 재사용 가능한 React 구성 요소를 사용하여 구축되어 일관성 있고 유지 관리 가능한 사용자 인터페이스를 보장합니다.

## 🚨 현재 구현 격차 (Implementation Gaps)

### API vs UI 통합 문제
- **구현된 것**: 개별 API Routes (`/api/transcribe`, `/api/translate`, `/api/projects`)
- **구현된 것**: 개별 React 컴포넌트들 (FileUploader, VideoPlayer, SubtitleEditor)
- **❌ 누락**: MainContent에서 실제 API 호출 - 더미 데이터로 시뮬레이션만 됨

### 라우팅 및 네비게이션 격차
- **구현된 것**: 대시보드에 프로젝트 목록 표시
- **❌ 누락**: `/project/[id]` 동적 라우트 - 대시보드 링크가 404 에러

### 데이터 플로우 불완전성
```mermaid
graph TD
    A[파일 업로드] --> B[Supabase Storage] 
    B --> C[MainContent]
    C --> D[❌ 더미 데이터 반환]
    
    style D fill:#ffcccc
    
    E[실제 필요한 플로우] --> F[API Route 호출]
    F --> G[실제 처리 결과]
    
    style E fill:#ccffcc
    style F fill:#ccffcc  
    style G fill:#ccffcc
```

### 핵심 패턴 위반
현재 **MainContent**가 시스템의 핵심 패턴을 위반:
- API Routes는 존재하지만 사용되지 않음
- 프런트엔드-백엔드 분리 원칙이 무너짐 (더미 데이터로 인해)
- Serverless 함수의 이점을 활용하지 못함
