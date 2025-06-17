# System Patterns

## Architecture Overview

The application will follow a modern serverless architecture, leveraging Next.js for the frontend and API routes, and Supabase for backend services.

```mermaid
graph TD
    User[User Browser] -->|1. Uploads Video| FE[Next.js Frontend on Vercel];
    FE -->|2. Stores Video| SB_Storage[Supabase Storage];
    FE -->|3. Triggers Transcription| API_T[API Route: /api/transcribe];
    API_T -->|4. Sends Audio to Whisper| Whisper[Whisper API];
    Whisper -->|5. Returns Transcription| API_T;
    API_T -->|6. Saves Transcription| SB_DB[Supabase DB];

    FE -->|7. Triggers Translation| API_Tr[API Route: /api/translate];
    API_Tr -->|8. Sends Text to LLM| Gemini[Gemini API];
    Gemini -->|9. Returns Translation| API_Tr;
    API_Tr -->|10. Saves Translation| SB_DB;

    User -->|11. Views Subtitles| FE;
    FE -->|12. Fetches Data| SB_DB;

```

## Key Design Patterns

- **Serverless Functions:** All backend logic that communicates with external APIs (Whisper, Gemini) will be encapsulated in Next.js API Routes. This keeps the frontend and backend code in the same repository and simplifies deployment.
- **Backend as a Service (BaaS):** Supabase will handle the database, user authentication, and file storage, allowing us to focus on the core application logic rather than managing infrastructure.
- **Component-Based UI:** The frontend will be built using reusable React components to ensure a consistent and maintainable user interface.
