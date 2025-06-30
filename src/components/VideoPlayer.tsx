'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface VideoPlayerProps {
  src: string;
  subtitles?: SubtitleSegment[];
}

export interface VideoPlayerRef {
  jumpToTime: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, subtitles = [] }, ref) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find current subtitle based on video time
  const getCurrentSubtitle = (): SubtitleSegment | null => {
    return subtitles.find(
      subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    ) || null;
  };

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

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
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  const currentSubtitle = getCurrentSubtitle();

  if (!src) {
    return <div>No video source provided.</div>;
  }

  return (
    <div className="relative w-full flex justify-center bg-black rounded-lg shadow-lg overflow-hidden">
      <video 
        ref={videoRef}
        controls 
        className="max-w-full max-h-[70vh] h-auto object-contain rounded-lg"
        style={{ aspectRatio: 'auto' }}
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

      {/* Subtitle Progress Indicator */}
      {subtitles.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div 
            className="h-full bg-blue-600 transition-all duration-100"
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
