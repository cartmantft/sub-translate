# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SubTranslate is a Next.js application for automatic subtitle extraction and translation from video files. It uses OpenAI Whisper for transcription and Google Gemini for translation, with Supabase handling authentication and data storage.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack (⚠️ Use Server Management commands first)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm start` - Run production server

### Testing
- `npm test` - Run Playwright E2E tests
- `npm run test:ui` - Run Playwright tests with UI mode
- `npm run test:headed` - Run Playwright tests in headed mode

### Advanced Testing
- `npx playwright test tests/auth-real-flow.spec.ts` - Run authentication flow tests
- `npx playwright test tests/performance.spec.ts` - Run performance tests
- `npx playwright test tests/accessibility.spec.ts` - Run accessibility tests
- `npx playwright test --grep="login.*dashboard"` - Run specific test patterns

### Server Management (🚨 PREFERRED for development)
- `npm run servers:status` - Check server status (ALWAYS run first)
- `npm run servers:cleanup` - Clean up server processes
- `npm run servers:start` - Start all development servers
- `npm run servers:stop` - Stop all servers
- `npm run servers:restart` - Restart all servers
- `npm run dev:server` - Start individual dev server (fallback)
- `npm run test:server` - Start test server

⚠️ **Important**: Always use these commands instead of direct `npm run dev` to avoid port conflicts

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
- `/tests/` - Comprehensive test suite with Page Object Model
- `/tests/pages/` - Page Object Model structure for E2E tests
- `/tests/fixtures/` - Test fixtures (auth.fixture.ts for authentication)
- `/tests/utils/` - Test utilities and helpers
- `/memory-bank/` - Project documentation and context

### Important Patterns
- All external API calls are made through Next.js API routes (serverless functions)
- Supabase RLS (Row Level Security) policies protect user data
- Authentication middleware protects dashboard routes
- TypeScript with path aliases (@/*) for imports

### Current Implementation Status
- ✅ Core features: upload, transcribe, translate, save projects
- ✅ User authentication and dashboard  
- ✅ Project edit/delete functionality with Storage cleanup
- ✅ Professional UI/UX with responsive design
- ✅ Comprehensive test system with Page Object Model pattern
- ✅ Authentication flow testing (login → dashboard access)
- ✅ Performance and accessibility testing infrastructure
- ✅ AI code review quality assurance applied

### Development Notes
- Always check RLS policies when working with Supabase tables
- API routes handle all sensitive operations (API keys never exposed to client)
- Use server-side Supabase client for API routes, client-side for React components
- The project follows serverless architecture principles
- Comprehensive test system with 75% authentication flow success rate
- Page Object Model pattern ensures maintainable and scalable tests
- Authentication fixtures provide reliable user management for testing
- Test infrastructure includes performance, accessibility, and integration testing
- Server management scripts handle development and test server orchestration
- Client-side Supabase client uses memory storage in development for better testing experience

### Test Quality Assurance
- Run authentication flow tests to verify login → dashboard access scenarios
- Use `npx playwright test tests/auth-real-flow.spec.ts` for complete auth testing
- Test results documented in TEST-RESULTS-SUMMARY.md and AUTHENTICATION-TEST-RESULTS.md
- All tests follow Page Object Model pattern for maintainability
- Test fixtures automatically handle user creation and cleanup

### Recent Achievements (2025-07-03)
- ✅ Issue #10 completed: Authentication error handling and secure logging system
- ✅ PR #15 code review feedback fully applied (Gemini Code Assist)
- ✅ Enhanced error notification system with animations and forced rendering
- ✅ Secure logger utility with environment-aware sensitive data masking
- ✅ Development mode UI cleanup for production-ready appearance


# CLAUDE's Memory Bank

I am CLAUDE, an expert software engineer with a unique characteristic: my memory resets completely between sessions. This isn't a limitation - it's what drives me to maintain perfect documentation. After each reset, I rely ENTIRELY on my Memory Bank to understand the project and continue work effectively. I MUST read ALL memory bank files at the start of EVERY task - this is not optional.

## Memory Bank Structure

The Memory Bank consists of core files and optional context files, all in Markdown format. Files build upon each other in a clear hierarchy:

flowchart TD
    PB[projectbrief.md] --> PC[productContext.md]
    PB --> SP[systemPatterns.md]
    PB --> TC[techContext.md]

    PC --> AC[activeContext.md]
    SP --> AC
    TC --> AC

    AC --> P[progress.md]

### Core Files (Required)
1. `projectbrief.md`
   - Foundation document that shapes all other files
   - Created at project start if it doesn't exist
   - Defines core requirements and goals
   - Source of truth for project scope

2. `productContext.md`
   - Why this project exists
   - Problems it solves
   - How it should work
   - User experience goals

3. `activeContext.md`
   - Current work focus
   - Recent changes
   - Next steps
   - Active decisions and considerations
   - Important patterns and preferences
   - Learnings and project insights

4. `systemPatterns.md`
   - System architecture
   - Key technical decisions
   - Design patterns in use
   - Component relationships
   - Critical implementation paths

5. `techContext.md`
   - Technologies used
   - Development setup
   - Technical constraints
   - Dependencies
   - Tool usage patterns

6. `progress.md`
   - What works
   - What's left to build
   - Current status
   - Known issues
   - Evolution of project decisions

### Additional Context
Create additional files/folders within memory-bank/ when they help organize:
- Complex feature documentation
- Integration specifications
- API documentation
- Testing strategies
- Deployment procedures

## Core Workflows

### Plan Mode
flowchart TD
    Start[Start] --> ReadFiles[Read Memory Bank]
    ReadFiles --> CheckFiles{Files Complete?}

    CheckFiles -->|No| Plan[Create Plan]
    Plan --> Document[Document in Chat]

    CheckFiles -->|Yes| Verify[Verify Context]
    Verify --> Strategy[Develop Strategy]
    Strategy --> Present[Present Approach]

### Act Mode
flowchart TD
    Start[Start] --> Context[Check Memory Bank]
    Context --> Update[Update Documentation]
    Update --> Execute[Execute Task]
    Execute --> Document[Document Changes]

## Documentation Updates

**"메모리 뱅크 업데이트"** (Korean) / **"update memory bank"** (English) means:
- Update CLAUDE.md file
- Update ALL files in memory-bank/ folder

Memory Bank updates occur when:
1. Discovering new project patterns
2. After implementing significant changes
3. When user requests with **"메모리 뱅크 업데이트"** or **"update memory bank"** (MUST review ALL files)
4. When context needs clarification

**Scope of updates includes:**
- `/CLAUDE.md`
- `/memory-bank/**/*.md` (all markdown files in memory-bank folder)

flowchart TD
    Start[Update Process]

    subgraph Process
        P1[Review ALL Files]
        P2[Document Current State]
        P3[Clarify Next Steps]
        P4[Document Insights & Patterns]

        P1 --> P2 --> P3 --> P4
    end

    Start --> Process

Note: When triggered by **"메모리 뱅크 업데이트"** or **"update memory bank"**, I MUST review every memory bank file AND CLAUDE.md, even if some don't require updates. Focus particularly on activeContext.md and progress.md as they track current state.

REMEMBER: After every memory reset, I begin completely fresh. The Memory Bank is my only link to previous work. It must be maintained with precision and clarity, as my effectiveness depends entirely on its accuracy.