import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Text and target language are required.',
        },
        { status: 400 }
      );
    }

    // Temporary dummy translation for testing
    console.log(`Translating to ${targetLanguage}:`, text);
    
    // Simple mock translation
    const translation = `[Translated to ${targetLanguage}] ${text}`;

    return NextResponse.json({
      success: true,
      translation,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in translate route:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during translation.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
