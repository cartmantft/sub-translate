'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
  time?: number; // Optional time in seconds to seek to
}

export default function VideoThumbnail({ videoUrl, alt, className = '', time }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible && !thumbnailUrl && !hasError) {
          setIsVisible(true);
          setIsLoading(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [videoUrl, isVisible, thumbnailUrl, hasError]);

  const generateThumbnail = useCallback((video: HTMLVideoElement) => {
    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      setThumbnailUrl(dataURL);
      setIsLoading(false);
      
      // Clean up timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  // Video loading logic
  useEffect(() => {
    if (!isVisible) return;
    
    const video = videoRef.current;
    if (!video) return;

    // Reset states
    setThumbnailUrl('');
    setHasError(false);

    // Set timeout for loading (8 seconds)
    timeoutRef.current = setTimeout(() => {
      setHasError(true);
      setIsLoading(false);
    }, 8000);

    const handleLoadedData = () => {
      // Use provided time or default to 5% of duration (max 0.5s)
      const seekTime = time !== undefined 
        ? Math.min(time, video.duration) 
        : Math.min(video.duration * 0.05, 0.5);
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      generateThumbnail(video);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      if (video) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, videoUrl, time, generateThumbnail]);

  if (hasError) {
    return (
      <div ref={containerRef} className={`bg-red-100 border border-red-300 flex flex-col items-center justify-center p-2 ${className}`}>
        <svg className="w-6 h-6 text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-xs text-red-600 text-center">로드 실패</span>
        <span className="text-xs text-gray-500 text-center mt-1">URL: {videoUrl}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isVisible && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          preload="metadata"
          className="hidden"
        />
      )}
      
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : isLoading ? (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
