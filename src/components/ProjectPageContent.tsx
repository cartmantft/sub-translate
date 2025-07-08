'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
// import ResponsiveVideoLayout from '@/components/ResponsiveVideoLayout';
import ResizablePanels from '@/components/ResizablePanels';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import VideoControls from '@/components/VideoControls';
import EnhancedSubtitleEditor from '@/components/EnhancedSubtitleEditor';
import { calculateOptimalLayout, getLayoutRecommendation, getVideoTypeIcon } from '@/lib/layout-utils';
import { useBreakpoint, useScreenWidth } from '@/hooks/useMediaQuery';
import { exportVideoWithSubtitles } from '@/lib/subtitleExport';

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
  const breakpoint = useBreakpoint();
  const screenWidth = useScreenWidth();
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [editedSubtitles, setEditedSubtitles] = useState<SubtitleSegment[]>(parsedSubtitles);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [layoutConfig, setLayoutConfig] = useState({
    defaultLeftWidth: 50, // 모든 비디오 타입에 일관된 50:50 비율
    minLeftWidth: 200,    // 최소 비디오 영역 확보
    minRightWidth: 250,   // 최소 자막 영역 확보
    maxLeftWidth: 65,     // 최대 비디오 영역 제한
    layoutMode: 'horizontal' as 'horizontal' | 'vertical'
  });

  const handleSubtitleClick = useCallback((startTime: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.jumpToTime(startTime);
    }
  }, []);

  const handleVideoTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);

  // Video event listeners
  useEffect(() => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(videoElement.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [project.video_url]);

  const handleSubtitlesChange = useCallback((segments: SubtitleSegment[]) => {
    setEditedSubtitles(segments);
  }, []);

  const handleVideoMetadata = useCallback((metadata: VideoMetadata) => {
    setVideoMetadata(metadata);
    setIsVideoLoading(false);
    // 비디오 타입에 관계없이 항상 50:50 비율 유지 (Vrew 스타일)
    // calculateOptimalLayout 호출하지 않음
  }, []);

  // 화면 크기 변경 시 최소값만 조정 (50:50 비율은 유지)
  useEffect(() => {
    const getResponsiveMinValues = (screenWidth: number) => {
      if (screenWidth < 768) { // 모바일
        return { minLeft: 150, minRight: 200 };
      } else if (screenWidth < 1024) { // 태블릿
        return { minLeft: 200, minRight: 220 };
      } else if (screenWidth < 1440) { // 작은 데스크톱
        return { minLeft: 250, minRight: 250 };
      } else { // 큰 데스크톱
        return { minLeft: 300, minRight: 300 };
      }
    };

    const minValues = getResponsiveMinValues(screenWidth);
    
    setLayoutConfig(prev => ({
      ...prev,
      defaultLeftWidth: 50, // 항상 50:50 유지
      minLeftWidth: Math.max(minValues.minLeft, 452), // 컨트롤러 요소들이 보일 최소 공간 확보
      minRightWidth: minValues.minRight,
      maxLeftWidth: 65,
      layoutMode: breakpoint === 'mobile' ? 'vertical' : 'horizontal'
    }));
  }, [breakpoint, screenWidth]);

  // Video control handlers
  const handlePlayPause = useCallback(() => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement) {
      videoElement.currentTime = time;
      setCurrentVideoTime(time);
    }
    if (videoPlayerRef.current) {
      videoPlayerRef.current.jumpToTime(time);
    }
  }, []);

  const handleSubtitleToggle = useCallback(() => {
    setShowSubtitles(!showSubtitles);
  }, [showSubtitles]);

  const handleVolumeChange = useCallback((volume: number) => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement) {
      videoElement.volume = volume;
    }
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement) {
      videoElement.playbackRate = rate;
    }
  }, []);

  const handleVideoExport = useCallback(async () => {
    try {
      // Get current view mode from subtitle editor
      const subtitleEditor = document.querySelector('[data-subtitle-editor]') as HTMLElement;
      const currentViewMode = subtitleEditor?.dataset.currentViewMode as 'translation' | 'original' | 'both' || 'translation';
      
      await exportVideoWithSubtitles(project.video_url, editedSubtitles, project.title, currentViewMode);
    } catch (error) {
      console.error('Error exporting video:', error);
      alert('비디오 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }, [project.video_url, project.title, editedSubtitles]);

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
    <div className="h-screen bg-white flex flex-col">
      {/* Compact Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">대시보드</span>
            </Link>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-lg font-semibold text-gray-800">
              {project.title || '제목 없는 프로젝트'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Project Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{totalDuration > 0 ? `${formatTime(totalDuration)}` : '00:00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2" />
                </svg>
                <span>{parsedSubtitles.length}개 자막</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">완료</span>
              </div>
            </div>
            
            {/* Video Export Button */}
            <button
              onClick={handleVideoExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Video Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout - Full Screen */}
      <div className="flex-1 min-h-0">
        <ResizablePanels
          minLeftWidth={layoutConfig.minLeftWidth}
          minRightWidth={layoutConfig.minRightWidth}
          defaultLeftWidth={layoutConfig.defaultLeftWidth}
          maxLeftWidth={layoutConfig.maxLeftWidth}
          onLayoutChange={handleLayoutChange}
          className="h-full"
          leftPanel={
            project.video_url ? (
              <div className="h-full grid grid-rows-[1fr_auto] min-h-0">
                {/* Video Player Area */}
                <div className="min-h-0 flex items-center justify-center bg-black overflow-hidden">
                  <VideoPlayer 
                    ref={videoPlayerRef}
                    src={project.video_url} 
                    subtitles={editedSubtitles}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onVideoMetadata={handleVideoMetadata}
                    showSubtitles={showSubtitles}
                    roundedCorners="none"
                  />
                </div>
                
                {/* Video Controls */}
                <div className="flex-shrink-0">
                  <VideoControls
                    videoRef={videoPlayerRef}
                    isPlaying={isPlaying}
                    currentTime={currentVideoTime}
                    duration={videoDuration}
                    showSubtitles={showSubtitles}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    onSubtitleToggle={handleSubtitleToggle}
                    onVolumeChange={handleVolumeChange}
                    onPlaybackRateChange={handlePlaybackRateChange}
                  />
                </div>
              </div>
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
    </div>
  );
}
