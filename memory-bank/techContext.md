# 기술 컨텍스트

## Frontend

- **Framework:** Next.js 15.3.3 (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI 또는 유사한 라이브러리를 접근성 있고 스타일이 지정되지 않은 구성 요소에 사용할 수 있습니다.
- **Media Processing:** HTML5 Canvas API + Video Element (썸네일 생성) ✅ **완성됨**
  - **이전:** FFmpeg.wasm (빌드 호환성 문제로 완전 제거됨)
  - **현재:** 브라우저 네이티브 Canvas API (서버리스 환경 완전 호환)

## Backend / Database

- **Platform:** Supabase
  - **Database:** Supabase Postgres
  - **Auth:** Supabase Auth
  - **Storage:** Supabase Storage (사용자가 업로드한 비디오용)
- **Serverless Functions:** Vercel에서 호스팅되는 Next.js API Routes는 외부 AI 서비스와의 통신을 처리하는 데 사용됩니다.

## AI 서비스

- **Transcription:** OpenAI Whisper API
- **Translation:** Google Gemini API (또는 다른 강력한 LLM)

## 미디어 처리

- **비디오 썸네일 생성:** HTML5 Canvas API + Video Element ✅ **프로덕션 완성**
  - **구현 위치:** `src/lib/canvas-thumbnail.ts` (ffmpeg-client.ts에서 정리됨)
  - **지원 기능:** 
    - 480x360 최대 해상도 (동적 크기 조절)
    - 종횡비 유지 (숏폼 비디오 자동 감지 및 letterboxing)
    - JPEG 90% 품질로 최적화 압축
    - 1초 지점 또는 비디오 길이 10% 지점에서 최적 프레임 추출
    - imageSmoothingQuality: 'high' 설정으로 고품질 렌더링
  - **출력 형태:** Base64 데이터 URL (FileUploader.tsx 완전 통합)
  - **장점:** 서버리스 환경 완전 호환, 빌드 의존성 제거, 브라우저 네이티브 성능

## 배포

- **Platform:** Vercel (서버리스 환경 완전 호환) ✅
- **CI/CD:** Vercel과 GitHub의 통합이 자동 배포에 사용됩니다.
- **빌드 호환성:** Next.js 15/Turbopack 환경에서 안정적 빌드 보장
- **WebAssembly 의존성:** 완전 제거로 모든 서버리스 플랫폼 지원

## 패키지 관리자

- **Manager:** npm
- **개발 의존성:** FFmpeg.wasm 관련 패키지 완전 제거
- **브라우저 호환성:** 모든 모던 브라우저에서 HTML5 Canvas 네이티브 지원

## 테스트 프레임워크

- **E2E Testing:** Playwright
  - **아키텍처:** Page Object Model 패턴
  - **브라우저 지원:** Chromium, Firefox, WebKit (Safari)
  - **모바일 테스트:** Mobile Chrome, Mobile Safari
  - **리포트:** HTML 리포트 (tests/playwright-report/)
  - **픽스처:** TypeScript 기반 테스트 픽스처 시스템
