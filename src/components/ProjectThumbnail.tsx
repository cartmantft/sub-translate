'use client';

import { useState, useEffect } from 'react';
import VideoThumbnail from './VideoThumbnail';

interface ProjectThumbnailProps {
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  title?: string;
}

export default function ProjectThumbnail({ thumbnailUrl, videoUrl, title }: ProjectThumbnailProps) {
  const [showVideoFallback, setShowVideoFallback] = useState(false);

  useEffect(() => {
    console.log('ProjectThumbnail props:', { thumbnailUrl, videoUrl, title });
  }, [thumbnailUrl, videoUrl, title]);

  if (showVideoFallback || !thumbnailUrl || thumbnailUrl.trim() === '') {
    if (videoUrl) {
      return (
        <VideoThumbnail
          videoUrl={videoUrl}
          alt={`${title || 'Untitled Project'} thumbnail`}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
      <img
        src={thumbnailUrl}
        alt={`${title || 'Untitled Project'} thumbnail`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
        onError={() => {
          console.error('Image failed to load:', thumbnailUrl);
          setShowVideoFallback(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', thumbnailUrl);
        }}
      />
      {!showVideoFallback && (
        <div className="absolute top-2 left-2 bg-green-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded z-10">
          ✓ THUMBNAIL
        </div>
      )}
    </div>
  );
}