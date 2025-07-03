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
}

/**
 * 비디오 메타데이터를 기반으로 최적의 레이아웃 설정을 계산합니다.
 * @param videoMetadata 비디오 메타데이터
 * @param containerWidth 컨테이너 전체 너비 (선택사항)
 * @returns 최적화된 레이아웃 설정
 */
export function calculateOptimalLayout(
  videoMetadata: VideoMetadata, 
  containerWidth?: number
): LayoutConfig {
  const { videoType, aspectRatio } = videoMetadata;

  // 기본 설정값
  let config: LayoutConfig = {
    defaultLeftWidth: 50,
    minLeftWidth: 300,
    minRightWidth: 300,
    maxLeftWidth: 70,
    isOptimal: true
  };

  switch (videoType) {
    case 'portrait':
      // 세로 비디오 (9:16, 1:2 등)
      config.defaultLeftWidth = 30;
      config.minLeftWidth = 250;
      config.maxLeftWidth = 45;
      break;
      
    case 'landscape':
      // 가로 비디오 (16:9, 4:3 등)
      if (aspectRatio >= 1.77) {
        // 와이드 비디오 (16:9 이상)
        config.defaultLeftWidth = 65;
        config.minLeftWidth = 400;
        config.maxLeftWidth = 75;
      } else {
        // 표준 가로 비디오 (4:3 등)
        config.defaultLeftWidth = 55;
        config.minLeftWidth = 350;
        config.maxLeftWidth = 70;
      }
      break;
      
    case 'square':
      // 정사각형 비디오 (1:1)
      config.defaultLeftWidth = 45;
      config.minLeftWidth = 300;
      config.maxLeftWidth = 60;
      break;
  }

  // 컨테이너 너비를 고려한 조정
  if (containerWidth) {
    // 작은 화면에서는 최소값 조정
    if (containerWidth < 768) {
      config.minLeftWidth = Math.min(config.minLeftWidth, containerWidth * 0.3);
      config.minRightWidth = Math.min(config.minRightWidth, containerWidth * 0.3);
    }
    
    // 매우 큰 화면에서는 비디오 영역 제한
    if (containerWidth > 1920 && videoType === 'landscape') {
      config.maxLeftWidth = Math.min(config.maxLeftWidth, 60);
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