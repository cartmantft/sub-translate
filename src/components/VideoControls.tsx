'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoPlayerRef } from './VideoPlayer';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface VideoControlsProps {
  videoRef: React.RefObject<VideoPlayerRef | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  showSubtitles: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSubtitleToggle: () => void;
  onVolumeChange?: (volume: number) => void;
  onPlaybackRateChange?: (rate: number) => void;
}

export default function VideoControls({
  videoRef,
  isPlaying,
  currentTime,
  duration,
  showSubtitles,
  onPlayPause,
  onSeek,
  onSubtitleToggle,
  onVolumeChange,
  onPlaybackRateChange
}: VideoControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const breakpoint = useBreakpoint();

  // Calculate minimum width needed for all controls
  const calculateMinWidth = useCallback(() => {
    // Approximate widths based on actual elements:
    // Play button: 40px, Time: 90px, Timeline min: 100px, 
    // Subtitle: 32px, Speed: 60px, Volume: 80px
    // Gaps and padding: ~50px
    return 40 + 90 + 100 + 32 + 60 + 80 + 50; // ~452px
  }, []);

  // Expose the minimum width requirement to parent
  useEffect(() => {
    const minWidth = calculateMinWidth();
    // Communicate this to parent component if needed
    if (controlsRef.current) {
      controlsRef.current.style.setProperty('--min-controls-width', `${minWidth}px`);
    }
  }, [calculateMinWidth]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  }, [duration, onSeek]);

  // Handle timeline drag
  const handleTimelineDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = progress * duration;
    
    onSeek(newTime);
  }, [isDragging, duration, onSeek]);

  // Mouse event handlers for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleTimelineDrag);
      document.addEventListener('mouseup', () => setIsDragging(false));
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineDrag);
        document.removeEventListener('mouseup', () => setIsDragging(false));
      };
    }
  }, [isDragging, handleTimelineDrag]);

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    onPlaybackRateChange?.(newRate);
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 모바일에서는 2줄 레이아웃
  if (breakpoint === 'mobile') {
    return (
      <div className="bg-white border-t border-gray-200 p-3 min-h-[100px]">
        {/* 첫 번째 줄: 재생 버튼 + 타임라인 + 시간 */}
        <div className="flex items-center gap-3 mb-3">
          {/* Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            title={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Timeline */}
          <div className="flex-1 mx-2">
            <div
              ref={timelineRef}
              className="relative h-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={handleTimelineClick}
              onMouseDown={() => setIsDragging(true)}
            >
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="absolute top-1/2 w-5 h-5 bg-blue-600 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex-shrink-0 text-xs text-gray-600 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 두 번째 줄: 자막 + 속도 + 볼륨 */}
        <div className="flex items-center justify-center gap-4">
          {/* Subtitle Toggle */}
          <button
            onClick={onSubtitleToggle}
            className={`flex-shrink-0 w-11 h-11 rounded flex items-center justify-center transition-colors ${
              showSubtitles 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={showSubtitles ? "자막 숨기기" : "자막 보이기"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm0 4h4v2H4v-2zm6-4h4v2h-4v-2zm0 4h4v2h-4v-2zm6-4h4v2h-4v-2z"/>
            </svg>
          </button>

          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
            className="flex-shrink-0 text-sm border border-gray-300 rounded px-2 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none min-h-[44px]"
            title="재생 속도"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>

          {/* Volume Control */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              title="볼륨"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 태블릿과 데스크톱에서는 한 줄 레이아웃 (타임라인 포함)
  return (
    <div 
      ref={controlsRef}
      className="bg-white border-t border-gray-200 p-2 sm:p-4 min-h-[60px] overflow-hidden"
      style={{ minWidth: `${calculateMinWidth()}px` }}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Play/Pause Button - 항상 표시 */}
        <button
          onClick={onPlayPause}
          className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          title={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Time Display - 중요도 높음 */}
        <div className="flex-shrink-0 text-xs sm:text-sm text-gray-600 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Timeline - 최대한 공간 활용 */}
        <div className="flex-1 min-w-0 mx-1 sm:mx-2">
          <div
            ref={timelineRef}
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
            onClick={handleTimelineClick}
            onMouseDown={() => setIsDragging(true)}
          >
            {/* Progress bar */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Subtitle Toggle - 중요도 높음 */}
        <button
          onClick={onSubtitleToggle}
          className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-colors ${
            showSubtitles 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={showSubtitles ? "자막 숨기기" : "자막 보이기"}
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm0 4h4v2H4v-2zm6-4h4v2h-4v-2zm0 4h4v2h-4v-2zm6-4h4v2h-4v-2z"/>
          </svg>
        </button>

        {/* Playback Rate - 항상 표시 */}
        <select
          value={playbackRate}
          onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
          className="flex-shrink-0 text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none"
          title="재생 속도"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        {/* Volume Control - 항상 표시 */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            title="볼륨"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}