'use client';

import React, { useState, useRef, useCallback, ReactNode, useEffect } from 'react';

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  className?: string;
  minLeftWidth?: number;
  minRightWidth?: number;
  defaultLeftWidth?: number;
  maxLeftWidth?: number;
  onLayoutChange?: (leftWidthPercent: number) => void;
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  className = '',
  minLeftWidth = 300,
  minRightWidth = 300,
  defaultLeftWidth = 50, // percentage
  maxLeftWidth = 70, // percentage
  onLayoutChange
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [userHasAdjusted, setUserHasAdjusted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update layout when defaultLeftWidth changes (but only if user hasn't manually adjusted)
  useEffect(() => {
    if (!userHasAdjusted) {
      setLeftWidth(defaultLeftWidth);
    }
  }, [defaultLeftWidth, userHasAdjusted]);

  // 화면 크기 변경 시 최소값 검증 및 조정
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.getBoundingClientRect().width;
      const currentLeftWidthPx = (leftWidth / 100) * containerWidth;
      const currentRightWidthPx = containerWidth - currentLeftWidthPx;

      // 최소값을 위반하는 경우 조정
      if (currentLeftWidthPx < minLeftWidth || currentRightWidthPx < minRightWidth) {
        const maxAllowedLeftWidthPx = containerWidth - minRightWidth;
        const minAllowedLeftWidthPx = minLeftWidth;
        
        let newLeftWidthPx = Math.max(minAllowedLeftWidthPx, Math.min(currentLeftWidthPx, maxAllowedLeftWidthPx));
        let newLeftWidthPercent = (newLeftWidthPx / containerWidth) * 100;
        
        // maxLeftWidth 제한 적용
        newLeftWidthPercent = Math.min(newLeftWidthPercent, maxLeftWidth);
        
        setLeftWidth(newLeftWidthPercent);
        onLayoutChange?.(newLeftWidthPercent);
      }
    };

    // 디바운싱을 위한 타이머
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [leftWidth, minLeftWidth, minRightWidth, maxLeftWidth, onLayoutChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    const mouseX = e.clientX - containerRect.left;
    const newLeftWidthPx = Math.max(minLeftWidth, Math.min(mouseX, containerWidth - minRightWidth));
    let newLeftWidthPercent = (newLeftWidthPx / containerWidth) * 100;
    
    // Apply maxLeftWidth constraint
    newLeftWidthPercent = Math.min(newLeftWidthPercent, maxLeftWidth);
    
    setLeftWidth(newLeftWidthPercent);
    setUserHasAdjusted(true);
    onLayoutChange?.(newLeftWidthPercent);
  }, [isDragging, minLeftWidth, minRightWidth, maxLeftWidth, onLayoutChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={`flex h-full relative ${className}`}>
      {/* Left Panel */}
      <div 
        className="h-full overflow-hidden bg-black"
        style={{ 
          width: `${leftWidth}%`,
          isolation: 'isolate'
        }}
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className={`w-2 bg-gray-200 hover:bg-blue-500 cursor-col-resize border-l border-r border-blue-500 transition-colors duration-200 flex-shrink-0 rounded ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
        style={{ 
          minWidth: '8px',
          maxWidth: '8px'
        }}
      >
        <div className="w-full h-full flex items-center justify-center rounded">
          <div className="w-1 h-8 bg-white rounded-full opacity-75"></div>
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className="h-full overflow-hidden flex-1 bg-white"
        style={{ 
          width: `${100 - leftWidth}%`,
          isolation: 'isolate'
        }}
      >
        {rightPanel}
      </div>

    </div>
  );
}