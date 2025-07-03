'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import ResizablePanels from '@/components/ResizablePanels';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import EnhancedSubtitleEditor from '@/components/EnhancedSubtitleEditor';
import { calculateOptimalLayout, getLayoutRecommendation, getVideoTypeIcon } from '@/lib/layout-utils';

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
}

interface VideoMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  videoType: 'portrait' | 'landscape' | 'square';
}

interface Project {
  id: string;
  user_id: string;
  video_url: string;
  transcription: string;
  subtitles: SubtitleSegment[];
  original_segments?: { start: number; end: number; text: string }[];
  title: string;
  created_at: string;
}

interface ProjectPageContentProps {
  project: Project;
  parsedSubtitles: SubtitleSegment[];
}

export default function ProjectPageContent({ project, parsedSubtitles }: ProjectPageContentProps) {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [editedSubtitles, setEditedSubtitles] = useState<SubtitleSegment[]>(parsedSubtitles);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [layoutConfig, setLayoutConfig] = useState({
    defaultLeftWidth: 50,
    minLeftWidth: 300,
    minRightWidth: 300,
    maxLeftWidth: 70
  });

  const handleSubtitleClick = useCallback((startTime: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.jumpToTime(startTime);
    }
  }, []);

  const handleVideoTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);

  const handleSubtitlesChange = useCallback((segments: SubtitleSegment[]) => {
    setEditedSubtitles(segments);
  }, []);

  const handleVideoMetadata = useCallback((metadata: VideoMetadata) => {
    setVideoMetadata(metadata);
    setIsVideoLoading(false);
    const optimalConfig = calculateOptimalLayout(metadata);
    setLayoutConfig(optimalConfig);
  }, []);

  const handleLayoutChange = useCallback((leftWidthPercent: number) => {
    // Optional: Save user's layout preference to localStorage
    // localStorage.setItem(`layout-${project.id}`, leftWidthPercent.toString());
  }, [project.id]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
  };

  const totalDuration = parsedSubtitles.length > 0 
    ? Math.ceil(parsedSubtitles[parsedSubtitles.length - 1]?.endTime || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  {project.title || '제목 없는 프로젝트'}
                </h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(project.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{totalDuration > 0 ? `${formatTime(totalDuration)}` : '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2" />
                    </svg>
                    <span>{parsedSubtitles.length}개 자막</span>
                  </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">완료됨</span>
                    </div>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <span>대시보드로 돌아가기</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout with Resizable Panels */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-300px)] min-h-[500px] overflow-hidden">
          <ResizablePanels
            minLeftWidth={layoutConfig.minLeftWidth}
            minRightWidth={layoutConfig.minRightWidth}
            defaultLeftWidth={layoutConfig.defaultLeftWidth}
            maxLeftWidth={layoutConfig.maxLeftWidth}
            onLayoutChange={handleLayoutChange}
            className="h-full"
            leftPanel={
              project.video_url ? (
                <VideoPlayer 
                  ref={videoPlayerRef}
                  src={project.video_url} 
                  subtitles={editedSubtitles}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onVideoMetadata={handleVideoMetadata}
                />
              ) : (
                <div className="bg-gray-100 p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">비디오를 사용할 수 없습니다</p>
                  </div>
                </div>
              )
            }
            rightPanel={
              <div className="h-full p-6 bg-white">
                <EnhancedSubtitleEditor 
                  segments={editedSubtitles}
                  videoUrl={project.video_url}
                  projectId={project.id}
                  currentTime={currentVideoTime}
                  onSegmentClick={handleSubtitleClick}
                  onSegmentsChange={handleSubtitlesChange}
                  className="h-full"
                />
              </div>
            }
          />
        </div>


        {/* Project Statistics */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            프로젝트 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">프로젝트 ID</div>
              <div className="text-sm text-gray-800 font-mono">{project.id.slice(0, 8)}...</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600 font-medium mb-1">처리 상태</div>
              <div className="text-sm text-gray-800">완료됨</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">자막 수</div>
              <div className="text-sm text-gray-800">{parsedSubtitles.length}개 세그먼트</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="text-sm text-indigo-600 font-medium mb-1">비디오 길이</div>
              <div className="text-sm text-gray-800">
                {totalDuration > 0 ? `약 ${Math.ceil(totalDuration)}초` : '알 수 없음'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
