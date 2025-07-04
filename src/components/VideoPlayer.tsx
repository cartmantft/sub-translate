'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface VideoMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  videoType: 'portrait' | 'landscape' | 'square';
}

interface VideoPlayerProps {
  src: string;
  subtitles?: SubtitleSegment[];
  onTimeUpdate?: (currentTime: number) => void;
  onVideoMetadata?: (metadata: VideoMetadata) => void;
  roundedCorners?: 'all' | 'left' | 'right' | 'none';
  showSubtitles?: boolean;
}

export interface VideoPlayerRef {
  jumpToTime: (time: number) => void;
  getVideoElement: () => HTMLVideoElement | null;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, subtitles = [], onTimeUpdate, onVideoMetadata, roundedCorners = 'left', showSubtitles = true }, ref) => {
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find current subtitle based on video time
  const getCurrentSubtitle = (): SubtitleSegment | null => {
    return subtitles.find(
      subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    ) || null;
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && onVideoMetadata) {
      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;
      
      let videoType: 'portrait' | 'landscape' | 'square';
      if (aspectRatio > 1.1) {
        videoType = 'landscape';
      } else if (aspectRatio < 0.9) {
        videoType = 'portrait';
      } else {
        videoType = 'square';
      }

      const metadata: VideoMetadata = {
        width,
        height,
        aspectRatio,
        videoType
      };

      onVideoMetadata(metadata);
    }
  }, [onVideoMetadata]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  // Jump to specific time in video - use useCallback to prevent unnecessary re-renders
  const jumpToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Expose functions using useImperativeHandle
  useImperativeHandle(ref, () => ({
    jumpToTime,
    getVideoElement: () => videoRef.current
  }), [jumpToTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata]);

  const currentSubtitle = getCurrentSubtitle();

  // Get rounded corner classes and styles based on prop
  const getRoundedClasses = () => {
    switch (roundedCorners) {
      case 'all':
        return 'rounded-2xl';
      case 'left':
        return 'rounded-l-2xl';
      case 'right':
        return 'rounded-r-2xl';
      case 'none':
        return '';
      default:
        return 'rounded-l-2xl';
    }
  };

  const getClipPath = () => {
    switch (roundedCorners) {
      case 'all':
        return 'inset(0 round 1rem)';
      case 'left':
        return 'inset(0 round 1rem 0 0 1rem)';
      case 'right':
        return 'inset(0 round 0 1rem 1rem 0)';
      case 'none':
        return 'none';
      default:
        return 'inset(0 round 1rem 0 0 1rem)';
    }
  };

  const getBorderRadius = () => {
    switch (roundedCorners) {
      case 'all':
        return '1rem';
      case 'left':
        return '1rem 0 0 1rem';
      case 'right':
        return '0 1rem 1rem 0';
      case 'none':
        return '0';
      default:
        return '1rem 0 0 1rem';
    }
  };

  const roundedClass = getRoundedClasses();
  const clipPath = getClipPath();
  const borderRadius = getBorderRadius();

  if (!src) {
    return <div>No video source provided.</div>;
  }

  return (
    <div 
      className={`relative w-full h-full ${roundedClass} overflow-hidden`} 
      style={{ 
        backgroundColor: 'black',
        isolation: 'isolate'
      }}
    >
      {/* Video container with clip-path for proper rounded corners */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          clipPath: clipPath,
          WebkitClipPath: clipPath,
          willChange: 'transform'
        }}
      >
        <video 
          ref={videoRef}
          className="max-w-full max-h-full object-contain"
          style={{ 
            backgroundColor: 'black',
            borderRadius: borderRadius,
            WebkitBorderRadius: borderRadius,
            willChange: 'transform',
            display: 'block'
          }}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>


      {/* Subtitle Overlay */}
      {showSubtitles && currentSubtitle && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black bg-opacity-75 text-white text-center px-4 py-2 rounded-lg">
            <p className="text-lg font-medium leading-relaxed">
              {currentSubtitle.text}
            </p>
          </div>
        </div>
      )}

    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
