# 기술 컨텍스트

## Frontend

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI 또는 유사한 라이브러리를 접근성 있고 스타일이 지정되지 않은 구성 요소에 사용할 수 있습니다.

## Backend / Database

- **Platform:** Supabase
  - **Database:** Supabase Postgres
  - **Auth:** Supabase Auth
  - **Storage:** Supabase Storage (사용자가 업로드한 비디오용)
- **Serverless Functions:** Vercel에서 호스팅되는 Next.js API Routes는 외부 AI 서비스와의 통신을 처리하는 데 사용됩니다.

## AI 서비스

- **Transcription:** OpenAI Whisper API
- **Translation:** Google Gemini API (또는 다른 강력한 LLM)

## 배포

- **Platform:** Vercel
- **CI/CD:** Vercel과 GitHub의 통합이 자동 배포에 사용됩니다.

## 패키지 관리자

- **Manager:** npm
