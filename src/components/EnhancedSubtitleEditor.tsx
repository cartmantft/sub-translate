'use client';

import { useState, useRef, useEffect } from 'react';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

interface EnhancedSubtitleEditorProps {
  segments: SubtitleSegment[];
  videoUrl: string;
  projectId: string;
  currentTime?: number;
  onSegmentClick?: (time: number) => void;
  onSegmentsChange?: (segments: SubtitleSegment[]) => void;
  className?: string;
}

type ViewMode = 'translation' | 'original' | 'both';

export default function EnhancedSubtitleEditor({
  segments: initialSegments,
  videoUrl,
  projectId,
  currentTime = 0,
  onSegmentClick,
  onSegmentsChange,
  className = ''
}: EnhancedSubtitleEditorProps) {
  const [segments, setSegments] = useState<SubtitleSegment[]>(initialSegments);
  const [viewMode, setViewMode] = useState<ViewMode>('translation');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { token: csrfToken } = useCsrfToken();

  // Update segments when props change
  useEffect(() => {
    setSegments(initialSegments);
  }, [initialSegments]);

  // Auto-scroll to current segment within container only (but not while editing)
  useEffect(() => {
    if (!containerRef.current || currentTime === undefined || editingId !== null) return;

    const currentSegmentIndex = segments.findIndex(
      segment => currentTime >= segment.startTime && currentTime <= segment.endTime
    );

    if (currentSegmentIndex !== -1) {
      const segmentElements = containerRef.current.querySelectorAll('[data-segment-index]');
      const currentElement = segmentElements[currentSegmentIndex] as HTMLElement;
      
      if (currentElement && containerRef.current) {
        // 컨테이너 내부에서만 스크롤하도록 수정
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = currentElement.getBoundingClientRect();
        
        // 요소가 컨테이너 밖에 있는지 확인
        const isAbove = elementRect.top < containerRect.top;
        const isBelow = elementRect.bottom > containerRect.bottom;
        
        if (isAbove || isBelow) {
          // 컨테이너 내부의 상대적 위치 계산
          const containerScrollTop = container.scrollTop;
          const elementOffsetTop = currentElement.offsetTop;
          const containerHeight = container.clientHeight;
          const elementHeight = currentElement.offsetHeight;
          
          // 요소를 컨테이너 중앙에 위치시키기
          const targetScrollTop = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);
          
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, segments, editingId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleSegmentClick = (startTime: number) => {
    if (onSegmentClick) {
      onSegmentClick(startTime);
    }
  };

  const handleTextChange = (segmentId: string, field: 'text' | 'originalText', value: string) => {
    const updatedSegments = segments.map(segment => {
      if (segment.id === segmentId) {
        return { ...segment, [field]: value };
      }
      return segment;
    });
    
    setSegments(updatedSegments);
    setIsDirty(true);
    
    if (onSegmentsChange) {
      onSegmentsChange(updatedSegments);
    }
  };

  const startEditing = (segmentId: string) => {
    setEditingId(segmentId);
  };

  const stopEditing = () => {
    setEditingId(null);
  };

  const getDisplayText = (segment: SubtitleSegment, mode: ViewMode): { primary?: string; secondary?: string } => {
    switch (mode) {
      case 'translation':
        return { primary: segment.text };
      case 'original':
        return { primary: segment.originalText || segment.text };
      case 'both':
        return { 
          primary: segment.text, 
          secondary: segment.originalText 
        };
    }
  };

  const isCurrentSegment = (segment: SubtitleSegment): boolean => {
    return currentTime !== undefined && 
           currentTime >= segment.startTime && 
           currentTime <= segment.endTime;
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        body: JSON.stringify({ subtitles: segments })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subtitles');
      }
      
      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        console.log('Subtitles saved successfully');
      }
    } catch (error) {
      console.error('Error saving subtitles:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with save button */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">자막 편집기</h2>
        <button
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:cursor-not-allowed ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          } ${isSaving ? 'opacity-50' : ''}`}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>

      {/* Error message */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-sm">{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Segment control */}
      <div className="bg-gray-100 rounded-lg p-1 mb-4 flex-shrink-0">
        <div className="flex space-x-1">
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'translation'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setViewMode('translation')}
          >
            번역
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'original'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setViewMode('original')}
          >
            원본
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'both'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setViewMode('both')}
          >
            모두 보기
          </button>
        </div>
      </div>

      {/* Subtitle list */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-lg"
      >
        <div className="p-4 space-y-3">
          {segments.map((segment, index) => {
            const { primary, secondary } = getDisplayText(segment, viewMode);
            const isCurrent = isCurrentSegment(segment);
            const isEditing = editingId === segment.id;

            return (
              <div
                key={segment.id}
                data-segment-index={index}
                className={`flex gap-3 p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-20 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <button
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors mb-1 font-mono"
                    onClick={() => handleSegmentClick(segment.startTime)}
                  >
                    {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                  </button>

                  {/* Primary text */}
                  {primary && (
                    <div className="mb-2">
                      {isEditing ? (
                        <textarea
                          value={primary}
                          onChange={(e) => {
                            const field = viewMode === 'original' ? 'originalText' : 'text';
                            handleTextChange(segment.id, field, e.target.value);
                          }}
                          onBlur={stopEditing}
                          className="w-full p-2 border border-blue-300 rounded text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-800 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2"
                          onClick={() => startEditing(segment.id)}
                        >
                          {primary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Secondary text (for both mode) */}
                  {secondary && viewMode === 'both' && (
                    <div className="pt-2 border-t border-gray-100">
                      {isEditing ? (
                        <textarea
                          value={secondary}
                          onChange={(e) => handleTextChange(segment.id, 'originalText', e.target.value)}
                          onBlur={stopEditing}
                          className="w-full p-2 border border-blue-300 rounded text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-600 italic cursor-pointer hover:bg-gray-50 rounded p-2 -m-2"
                          onClick={() => startEditing(segment.id)}
                        >
                          {secondary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}