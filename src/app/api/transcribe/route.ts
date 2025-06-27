import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' });
    }

    console.log('Received file:', file.name);

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
    }, { status: 200 }); // Explicitly set status to 200 for success
  } catch (error) {
    console.error('Error in transcribe route:', error);
    // It's good practice to not expose raw error messages to the client
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during transcription.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
