'use client';

import { ReactNode } from 'react';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import ResizablePanels from '@/components/ResizablePanels';

interface ResponsiveVideoLayoutProps {
  videoPlayer: ReactNode;
  subtitleEditor: ReactNode;
  layoutConfig: {
    defaultLeftWidth: number;
    minLeftWidth: number;
    minRightWidth: number;
    maxLeftWidth: number;
    layoutMode: 'horizontal' | 'vertical';
  };
  onLayoutChange?: (leftWidthPercent: number) => void;
  className?: string;
}

export default function ResponsiveVideoLayout({
  videoPlayer,
  subtitleEditor,
  layoutConfig,
  onLayoutChange,
  className = ''
}: ResponsiveVideoLayoutProps) {
  const breakpoint = useBreakpoint();

  // 모바일에서는 수직 스택 레이아웃 (전체 화면)
  if (breakpoint === 'mobile' || layoutConfig.layoutMode === 'vertical') {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* 비디오 플레이어 영역 */}
        <div className="flex-shrink-0 bg-black">
          {videoPlayer}
        </div>
        
        {/* 자막 편집기 영역 */}
        <div className="flex-1 min-h-0 bg-white">
          {subtitleEditor}
        </div>
      </div>
    );
  }

  // 태블릿과 데스크톱에서는 가로 분할 레이아웃 (전체 화면)
  return (
    <div className={`h-full ${className}`}>
      <ResizablePanels
        minLeftWidth={layoutConfig.minLeftWidth}
        minRightWidth={layoutConfig.minRightWidth}
        defaultLeftWidth={layoutConfig.defaultLeftWidth}
        maxLeftWidth={layoutConfig.maxLeftWidth}
        onLayoutChange={onLayoutChange}
        className="h-full"
        leftPanel={videoPlayer}
        rightPanel={subtitleEditor}
      />
    </div>
  );
}