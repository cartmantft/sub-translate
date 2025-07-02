'use client';

import { useState } from 'react';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

interface UnifiedSubtitleViewerProps {
  segments: SubtitleSegment[];
  onSegmentClick?: (startTime: number) => void;
  showOriginal?: boolean;
  currentTime?: number;
}

export default function UnifiedSubtitleViewer({ 
  segments, 
  onSegmentClick, 
  showOriginal = true,
  currentTime
}: UnifiedSubtitleViewerProps) {
  const [activeTab, setActiveTab] = useState<'both' | 'original' | 'translated'>('translated');

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
  };

  const getCurrentSubtitleIndex = (): number => {
    if (currentTime === undefined) return -1;
    return segments.findIndex(
      segment => currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  };

  const handleSegmentClick = (startTime: number) => {
    if (onSegmentClick) {
      onSegmentClick(startTime);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M12 8v8m-4-4h8" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">텍스트 콘텐츠</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{segments.length}</div>
          <div className="text-xs text-gray-500">세그먼트</div>
        </div>
      </div>

      {/* View Mode Tabs - Reordered: 번역만 → 원본만 → 원본+번역 */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('translated')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'translated'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            번역만
          </div>
        </button>
        {showOriginal && (
          <button
            onClick={() => setActiveTab('original')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'original'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              원본만
            </div>
          </button>
        )}
        <button
          onClick={() => setActiveTab('both')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'both'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            원본 + 번역
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="relative" style={{ maxHeight: '65vh' }}>
        {segments.length > 0 ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                세그먼트를 클릭하면 비디오가 해당 시간으로 이동합니다
              </p>
            </div>
            <div className="overflow-y-auto pr-2 space-y-2" style={{ maxHeight: '55vh' }}>
              {segments.map((segment, index) => (
                <div 
                  key={segment.id} 
                  className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                    getCurrentSubtitleIndex() === index
                      ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                      : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => handleSegmentClick(segment.startTime)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  {/* Content based on active tab */}
                  {activeTab === 'both' ? (
                    <div className="space-y-3">
                      {showOriginal && segment.originalText && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-purple-600 mb-1">원본</div>
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {segment.originalText}
                          </p>
                        </div>
                      )}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-green-600 mb-1">번역</div>
                        <p className="text-gray-700 leading-relaxed text-sm group-hover:text-gray-800 transition-colors">
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  ) : activeTab === 'original' && showOriginal && segment.originalText ? (
                    <p className="text-gray-700 leading-relaxed text-sm group-hover:text-gray-800 transition-colors">
                      {segment.originalText}
                    </p>
                  ) : activeTab === 'translated' ? (
                    <p className="text-gray-700 leading-relaxed text-sm group-hover:text-gray-800 transition-colors">
                      {segment.text}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">원본 텍스트가 없습니다</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">자막이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
