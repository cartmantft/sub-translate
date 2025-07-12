import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
// execSync와 fs는 더 이상 필요하지 않음 (FFmpeg.wasm 사용)
import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';
import { validateUserStatus } from '@/lib/utils/user-validation';

// 서버 사이드 FFmpeg 썸네일 생성 함수는 더 이상 사용하지 않음
// 클라이언트 사이드 FFmpeg.wasm 사용으로 대체됨

export async function POST(request: Request) {
  try {
    const { videoUrl, transcription, subtitles, title, thumbnailBase64 } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Additional security check: validate user status
    const userStatus = await validateUserStatus(user.id);
    if (!userStatus.isValid) {
      logger.error('Security violation: Invalid user attempted API access', {
        action: 'createProject',
        userId: user.id,
        reason: userStatus.reason,
        securityEvent: 'invalid_user_api_access_blocked'
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Account access denied',
        code: 'USER_ACCOUNT_INVALID'
      }, { status: 403 });
    }

    // Handle thumbnail URL
    let thumbnailUrl: string | null = null;
    
    if (thumbnailBase64) {
      // Client provided thumbnail (FFmpeg.wasm generated)
      try {
        // Extract base64 data and convert to buffer
        const base64Data = thumbnailBase64.split(',')[1];
        const thumbnailBuffer = Buffer.from(base64Data, 'base64');
        
        // Create unique filename for thumbnail
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(8).toString('hex');
        const thumbnailFileName = `thumbnail_${timestamp}_${randomId}.jpg`;
        const storageThumbnailName = `thumbnails/${thumbnailFileName}`;
        
        // Upload thumbnail to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(storageThumbnailName, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });
        
        if (uploadError) {
          logger.error('Client thumbnail upload error', uploadError, { 
            action: 'createProject',
            operation: 'uploadClientThumbnail'
          });
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('videos')
            .getPublicUrl(storageThumbnailName);
          
          thumbnailUrl = publicUrlData.publicUrl;
          console.log('클라이언트 썸네일 업로드 성공:', thumbnailUrl);
        }
      } catch (thumbnailError) {
        logger.error('Error processing client thumbnail', thumbnailError, { 
          action: 'createProject',
          operation: 'processClientThumbnail'
        });
      }
    }

    const { data, error } = await supabase.from('projects').insert([
      {
        user_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl, // FFmpeg.wasm 클라이언트 썸네일
        transcription: transcription,
        subtitles: subtitles,
        title: title,
      },
    ]).select();

    if (error) {
      logger.error('Error saving project to DB', error, { 
        action: 'createProject',
        userId: user.id
      });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, projectId: data[0].id }, { status: 201 });

  } catch (error) {
    logger.error('Error in projects API route', error, { 
      action: 'createProject'
    });
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
