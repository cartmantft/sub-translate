'use client';

import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

interface ProjectThumbnailProps {
  thumbnailUrl?: string | null;
  title?: string;
}

export default function ProjectThumbnail({ thumbnailUrl, title }: ProjectThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  // Show default icon if no thumbnail URL or if image failed to load
  if (!thumbnailUrl || thumbnailUrl.trim() === '' || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100">
      <img
        src={thumbnailUrl}
        alt={`${title || 'Untitled Project'} thumbnail`}
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => {
          logger.error('Image failed to load', undefined, { component: 'ProjectThumbnail', thumbnailUrl });
          setHasError(true);
        }}
        onLoad={() => {
          logger.debug('Image loaded successfully', { component: 'ProjectThumbnail', thumbnailUrl });
        }}
      />
      {!hasError && (
        <div className="absolute top-2 left-2 bg-green-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded z-10">
          ✓ THUMBNAIL
        </div>
      )}
    </div>
  );
}