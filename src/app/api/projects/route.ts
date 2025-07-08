import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

// Thumbnail generation function - server-side implementation with ffmpeg
async function generateThumbnail(videoUrl: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  try {
    
    console.log('Server-side thumbnail generation for:', videoUrl);
    
    // Create unique filename for thumbnail
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const thumbnailFileName = `thumbnail_${timestamp}_${randomId}.jpg`;
    const tempThumbnailPath = `/tmp/${thumbnailFileName}`;
    const tempVideoPath = `/tmp/video_${timestamp}_${randomId}.mp4`;
    const storageThumbnailName = `thumbnails/${thumbnailFileName}`;
    
    try {
      // Use ffmpeg to extract frame at 1 second (or 5% of video duration)
      console.log('Extracting thumbnail with ffmpeg...');
      
      // Download video file first to avoid CORS/network issues
      console.log('Downloading video file first...');
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }
      
      const videoBuffer = await response.arrayBuffer();
      fs.writeFileSync(tempVideoPath, Buffer.from(videoBuffer));
      
      const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -vf "thumbnail,scale=320:240" -frames:v 1 -update 1 -q:v 2 "${tempThumbnailPath}" -y`;
      execSync(ffmpegCommand, { 
        timeout: 30000, // 30 second timeout
        stdio: 'pipe' 
      });
      
      // Check if thumbnail was created
      if (!fs.existsSync(tempThumbnailPath)) {
        logger.error('Thumbnail file was not created', undefined, { 
          action: 'generateThumbnail',
          videoUrl
        });
        return null;
      }
      
      console.log('Thumbnail extracted successfully, uploading to storage...');
      
      // Read the generated thumbnail file
      const thumbnailBuffer = fs.readFileSync(tempThumbnailPath);
      
      // Upload thumbnail to Supabase Storage (same approach as videos)
      console.log('Uploading thumbnail to Supabase Storage...');
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos') // Use same bucket as videos
        .upload(storageThumbnailName, thumbnailBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });
      
      if (uploadError) {
        logger.error('Storage upload error', uploadError, { 
          action: 'generateThumbnail',
          operation: 'uploadThumbnail',
          bucketName: 'videos'
        });
        // Clean up and return null on upload failure
        try {
          fs.unlinkSync(tempThumbnailPath);
          fs.unlinkSync(tempVideoPath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp files:', cleanupError);
        }
        return null;
      }
      
      // Get public URL (same as videos)
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(storageThumbnailName);
      
      const thumbnailUrl = publicUrlData.publicUrl;
      console.log('Thumbnail uploaded successfully:', thumbnailUrl);
      
      // Clean up temporary files
      try {
        fs.unlinkSync(tempThumbnailPath);
        fs.unlinkSync(tempVideoPath);
      } catch (cleanupError) {
        console.warn('Could not clean up temp files:', cleanupError);
      }
      
      // Return public URL (same as videos)
      return thumbnailUrl;
      
    } catch (ffmpegError) {
      logger.error('FFmpeg error', ffmpegError, { 
        action: 'generateThumbnail',
        operation: 'extractFrame',
        videoUrl
      });
      
      // Clean up temp files if they exist
      try {
        if (fs.existsSync(tempThumbnailPath)) {
          fs.unlinkSync(tempThumbnailPath);
        }
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      } catch (cleanupError) {
        console.warn('Could not clean up temp files after error:', cleanupError);
      }
      
      return null;
    }
    
  } catch (error) {
    logger.error('Error in thumbnail generation', error, { 
      action: 'generateThumbnail',
      videoUrl
    });
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { videoUrl, transcription, subtitles, title } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Generate thumbnail URL
    const thumbnailUrl = await generateThumbnail(videoUrl, supabase);

    const { data, error } = await supabase.from('projects').insert([
      {
        user_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl, // base64 썸네일 활성화
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
