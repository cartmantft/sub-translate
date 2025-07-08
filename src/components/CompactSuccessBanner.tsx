'use client';

import { useState, useEffect } from 'react';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

interface CompactSuccessBannerProps {
  projectId: string;
  projectTitle: string;
  subtitleCount: number;
  videoDuration?: number;
  createdAt?: string;
  onClose?: () => void;
}

export default function CompactSuccessBanner({
  projectId,
  projectTitle,
  subtitleCount,
  videoDuration,
  createdAt,
  onClose
}: CompactSuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleString('ko-KR');
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div 
      className={`
        bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 
        border border-green-200 rounded-xl p-4 shadow-sm
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div className="flex items-center justify-between">
        {/* Success Icon and Message */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-green-800 mb-1">
              🎉 프로젝트 생성 완료!
            </h3>
            <p className="text-sm text-green-700 truncate">
              {projectTitle}
            </p>
          </div>
        </div>

        {/* Project Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-green-700">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(videoDuration)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2" />
            </svg>
            <span>{subtitleCount}개 자막</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2M8 7v1M8 7a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1h1zm2-3h4" />
            </svg>
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Close Button (Optional) */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 text-green-600 hover:text-green-700 transition-colors"
            aria-label="배너 닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile Stats - Show on smaller screens */}
      <div className="sm:hidden mt-3 flex items-center justify-between text-xs text-green-600">
        <div className="flex items-center gap-3">
          <span>⏱️ {formatTime(videoDuration)}</span>
          <span>📝 {subtitleCount}개 자막</span>
        </div>
        <span>{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}