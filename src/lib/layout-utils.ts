interface VideoMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  videoType: 'portrait' | 'landscape' | 'square';
}

interface LayoutConfig {
  defaultLeftWidth: number; // percentage
  minLeftWidth: number; // pixels
  minRightWidth: number; // pixels
  maxLeftWidth: number; // percentage
  isOptimal: boolean;
  layoutMode: 'horizontal' | 'vertical'; // 추가: 레이아웃 모드
}

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

/**
 * 비디오 메타데이터와 화면 크기를 기반으로 최적의 레이아웃 설정을 계산합니다.
 * @param videoMetadata 비디오 메타데이터
 * @param breakpoint 현재 브레이크포인트
 * @param containerWidth 컨테이너 전체 너비 (선택사항)
 * @returns 최적화된 레이아웃 설정
 */
export function calculateOptimalLayout(
  videoMetadata: VideoMetadata, 
  breakpoint: BreakpointType = 'desktop',
  containerWidth?: number
): LayoutConfig {
  const { videoType, aspectRatio } = videoMetadata;

  // 모바일에서는 수직 스택 레이아웃 사용
  if (breakpoint === 'mobile') {
    return {
      defaultLeftWidth: 100,
      minLeftWidth: 200,
      minRightWidth: 200,
      maxLeftWidth: 100,
      isOptimal: true,
      layoutMode: 'vertical'
    };
  }

  // 화면 크기에 따른 기본 최소값 계산
  const getResponsiveMinValues = (breakpoint: BreakpointType, containerWidth?: number) => {
    if (breakpoint === 'mobile') {
      return { minLeft: 150, minRight: 200 };
    }
    
    const width = containerWidth || 1200;
    if (width < 1024) { // 태블릿
      return { minLeft: 200, minRight: 220 };
    } else if (width < 1440) { // 작은 데스크톱
      return { minLeft: 250, minRight: 250 };
    } else { // 큰 데스크톱
      return { minLeft: 300, minRight: 300 };
    }
  };

  const minValues = getResponsiveMinValues(breakpoint, containerWidth);

  // 모든 비디오 타입에 일관된 기본 설정값
  let config: LayoutConfig = {
    defaultLeftWidth: 50, // 안정적인 50:50 기본 비율
    minLeftWidth: minValues.minLeft,
    minRightWidth: minValues.minRight,
    maxLeftWidth: 65, // 최대 65%로 제한
    isOptimal: true,
    layoutMode: 'horizontal'
  };

  // 모든 화면 크기에서 일관된 50:50 비율 유지 (Vrew 스타일)
  config.defaultLeftWidth = 50;
  config.maxLeftWidth = 65; // 리사이징 허용 범위

  // 최소값 조정 (화면 크기에 따른 기본적인 제약만 적용)
  if (containerWidth) {
    // 작은 화면에서는 최소값 조정
    if (containerWidth < 768) {
      config.minLeftWidth = Math.min(config.minLeftWidth, containerWidth * 0.35);
      config.minRightWidth = Math.min(config.minRightWidth, containerWidth * 0.35);
    }
    
    // 자막 영역 최소 공간 보장 (전체 화면의 35% 이상)
    const minSubtitleAreaPercent = 35;
    if (config.defaultLeftWidth > (100 - minSubtitleAreaPercent)) {
      config.defaultLeftWidth = 100 - minSubtitleAreaPercent;
    }
    if (config.maxLeftWidth > (100 - minSubtitleAreaPercent)) {
      config.maxLeftWidth = 100 - minSubtitleAreaPercent;
    }
  }

  return config;
}

/**
 * 비디오 타입별 권장 사항을 반환합니다.
 * @param videoType 비디오 타입
 * @returns 사용자에게 표시할 권장 메시지
 */
export function getLayoutRecommendation(videoType: VideoMetadata['videoType']): string {
  switch (videoType) {
    case 'portrait':
      return '세로 비디오에 최적화된 레이아웃입니다';
    case 'landscape':
      return '가로 비디오에 최적화된 레이아웃입니다';
    case 'square':
      return '정사각형 비디오에 최적화된 레이아웃입니다';
    default:
      return '비디오에 맞게 레이아웃이 조정되었습니다';
  }
}

/**
 * 현재 화면 크기를 감지합니다.
 * @returns 화면 크기 분류
 */
export function getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * 비디오 타입별 아이콘을 반환합니다.
 * @param videoType 비디오 타입
 * @returns 타입에 맞는 이모지 아이콘
 */
export function getVideoTypeIcon(videoType: VideoMetadata['videoType']): string {
  switch (videoType) {
    case 'portrait':
      return '📱';
    case 'landscape':
      return '🖥️';
    case 'square':
      return '⬜';
    default:
      return '🎥';
  }
}