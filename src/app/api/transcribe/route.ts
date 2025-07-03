import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

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

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // For OpenAI API, we can pass the file directly
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    console.log('=== Whisper Transcription Results ===');
    console.log('Total transcription length:', transcription.text?.length || 0);
    console.log('Number of segments:', transcription.segments?.length || 0);
    
    // Log segments after 25 seconds to debug language consistency issue
    if (transcription.segments) {
      const segmentsAfter25s = transcription.segments.filter(segment => segment.start > 25);
      console.log(`Segments after 25 seconds: ${segmentsAfter25s.length}`);
      
      segmentsAfter25s.slice(0, 3).forEach((segment, idx) => {
        console.log(`Late segment ${idx}:`, {
          start: segment.start,
          end: segment.end,
          text: segment.text?.substring(0, 100) || 'No text'
        });
      });
    }

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      segments: transcription.segments || []
    }, { status: 200 }); // Explicitly set status to 200 for success
  } catch (error) {
    logger.error('Error in transcribe route', error, { action: 'transcribe' });
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
