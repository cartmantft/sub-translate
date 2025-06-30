import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segments, text, targetLanguage } = body;

    // Handle both single text and segments array for backward compatibility
    let segmentsToTranslate;
    if (segments && Array.isArray(segments)) {
      segmentsToTranslate = segments;
    } else if (text) {
      // Convert single text to segments format
      segmentsToTranslate = [{ text, start: 0, end: 0 }];
    } else {
      return NextResponse.json({ error: 'Either segments array or text string is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('Google API key not found');
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    // Initialize Google Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Translate segments using Google Gemini
    const translatedSegments = await Promise.all(
      segmentsToTranslate.map(async (segment: any) => {
        try {
          let prompt;
          if (targetLanguage.toLowerCase() === 'korean') {
            prompt = `다음 텍스트를 한국어로 번역해주세요. 번역된 한국어 텍스트만 반환하고, 영어나 다른 언어는 포함하지 마세요. 설명이나 추가 내용 없이 번역문만 제공해주세요:

"${segment.text}"`;
          } else {
            prompt = `Translate the following text to ${targetLanguage}. Only return the translated text in ${targetLanguage}, no explanations or additional content:

"${segment.text}"`;
          }

          console.log(`Translating segment: "${segment.text.substring(0, 50)}..." (${segment.start}s-${segment.end}s)`);
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const translatedText = response.text().trim();
          
          console.log(`Translation result: "${translatedText.substring(0, 50)}..."`);

          return {
            ...segment,
            translatedText: translatedText
          };
        } catch (error) {
          console.error(`Translation error for segment: ${segment.text}`, error);
          // Fallback to original text if translation fails
          return {
            ...segment,
            translatedText: segment.text
          };
        }
      })
    );

    // Return appropriate format based on input
    if (text && !segments) {
      // Single text translation - return simple format for backward compatibility
      return NextResponse.json({
        success: true,
        translation: translatedSegments[0]?.translatedText || text,
        message: 'Translation completed successfully'
      });
    } else {
      // Segments translation - return full segments array
      return NextResponse.json({ 
        translatedSegments,
        message: 'Translation completed successfully' 
      });
    }

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' }, 
      { status: 500 }
    );
  }
}
