import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { videoUrl, transcription, subtitles, originalSegments, title } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.from('projects').insert([
      {
        user_id: user.id,
        video_url: videoUrl,
        transcription: transcription,
        subtitles: subtitles,
        title: title,
      },
    ]).select();

    if (error) {
      console.error('Error saving project to DB:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, projectId: data[0].id }, { status: 201 });

  } catch (error) {
    console.error('Error in projects API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
