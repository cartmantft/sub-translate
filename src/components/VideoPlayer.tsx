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
}

export interface VideoPlayerRef {
  jumpToTime: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, subtitles = [], onTimeUpdate, onVideoMetadata }, ref) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
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

  // Expose jumpToTime function using useImperativeHandle
  useImperativeHandle(ref, () => ({
    jumpToTime
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

  if (!src) {
    return <div>No video source provided.</div>;
  }

  return (
    <div className="relative w-full h-full flex justify-center bg-black overflow-hidden rounded-l-2xl">
      {/* Video element with rounded corners */}
      <video 
        ref={videoRef}
        controls 
        className="w-full h-full object-contain rounded-l-2xl"
        style={{ aspectRatio: 'auto', borderTopLeftRadius: '1rem', borderBottomLeftRadius: '1rem' }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Subtitle Controls */}
      {subtitles.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              showSubtitles 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={showSubtitles ? "자막 숨기기" : "자막 보이기"}
          >
            {showSubtitles ? "자막 ON" : "자막 OFF"}
          </button>
        </div>
      )}

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

      {/* Enhanced Subtitle Progress Indicator */}
      {subtitles.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 bg-opacity-75 shadow-sm">
          <div 
            className="h-full bg-blue-500 shadow-sm transition-all duration-100"
            style={{
              width: `${(currentTime / (subtitles[subtitles.length - 1]?.endTime || 1)) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
