# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SubTranslate is a Next.js application for automatic subtitle extraction and translation from video files. It uses OpenAI Whisper for transcription and Google Gemini for translation, with Supabase handling authentication and data storage.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Run production server

### Testing
No test framework is currently configured. Consider adding Jest/Vitest for unit tests or Playwright for E2E tests.

## Environment Setup

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database/Auth**: Supabase (Postgres + Auth + Storage)
- **AI Services**: OpenAI Whisper, Google Gemini Pro
- **Deployment**: Vercel

### Core Data Flow
1. User uploads video → stored in Supabase Storage
2. `/api/transcribe` → calls Whisper API for transcription
3. `/api/translate` → calls Gemini API for translation
4. `/api/projects` → saves project data to Supabase
5. Dashboard displays user's saved projects

### Key Directories
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/` - React components (FileUploader, SubtitleEditor, VideoPlayer)
- `/src/lib/supabase/` - Supabase client configuration (server/client versions)
- `/memory-bank/` - Project documentation and context

### Important Patterns
- All external API calls are made through Next.js API routes (serverless functions)
- Supabase RLS (Row Level Security) policies protect user data
- Authentication middleware protects dashboard routes
- TypeScript with path aliases (@/*) for imports

### Current Implementation Status
- ✅ Core features: upload, transcribe, translate, save projects
- ✅ User authentication and dashboard
- ✅ Basic subtitle editor
- 🚧 UI/UX improvements and error handling in progress
- ⚠️ MainContent component uses dummy data for demonstration

### Development Notes
- Always check RLS policies when working with Supabase tables
- API routes handle all sensitive operations (API keys never exposed to client)
- Use server-side Supabase client for API routes, client-side for React components
- The project follows serverless architecture principles