# Technology Context

## Frontend

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI or a similar library will likely be used for accessible, unstyled components.

## Backend / Database

- **Platform:** Supabase
  - **Database:** Supabase Postgres
  - **Auth:** Supabase Auth
  - **Storage:** Supabase Storage (for user-uploaded videos)
- **Serverless Functions:** Next.js API Routes hosted on Vercel will be used to handle communication with external AI services.

## AI Services

- **Transcription:** OpenAI Whisper API
- **Translation:** Google Gemini API (or another powerful LLM)

## Deployment

- **Platform:** Vercel
- **CI/CD:** Vercel's integration with GitHub will be used for automatic deployments.

## Package Manager

- **Manager:** npm
