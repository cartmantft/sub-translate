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

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text();

    return NextResponse.json({
      success: true,
      translation,
    }, { status: 200 }); // Explicitly set status to 200 for success
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
