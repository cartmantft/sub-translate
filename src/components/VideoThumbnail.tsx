'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
}

export default function VideoThumbnail({ videoUrl, alt, className = '' }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateThumbnail = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setThumbnailUrl(url);
          setIsLoading(false);
        }
      }, 'image/jpeg', 0.8);
    };

    const handleLoadedData = () => {
      const video = videoRef.current;
      if (video) {
        // Seek to 1 second to get a better thumbnail (avoid black frames)
        video.currentTime = Math.min(1, video.duration * 0.1);
      }
    };

    const handleSeeked = () => {
      generateThumbnail();
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };
    }
  }, [videoUrl]);

  // Cleanup thumbnail URL when component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">Video unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
      />
      
      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading state */}
      {isLoading && (
        <div className="bg-gray-200 flex items-center justify-center w-full h-full animate-pulse">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Thumbnail image */}
      {thumbnailUrl && !isLoading && (
        <div className="relative w-full h-full">
          <img
            src={thumbnailUrl}
            alt={alt}
            className="w-full h-full object-cover rounded-md"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
