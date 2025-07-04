'use client';

import { useState, useEffect } from 'react';

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointQueries {
  mobile: string;
  tablet: string;
  desktop: string;
}

const defaultQueries: BreakpointQueries = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1199px)', 
  desktop: '(min-width: 1200px)'
};

/**
 * 미디어 쿼리를 감지하는 훅
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 서버사이드 렌더링에서는 false 반환
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * 현재 브레이크포인트를 반환하는 훅
 */
export function useBreakpoint(queries: BreakpointQueries = defaultQueries): BreakpointType {
  const isMobile = useMediaQuery(queries.mobile);
  const isTablet = useMediaQuery(queries.tablet);
  const isDesktop = useMediaQuery(queries.desktop);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  
  // 기본값은 desktop (서버사이드 렌더링 대응)
  return 'desktop';
}

/**
 * 반응형 값을 반환하는 훅
 */
export function useResponsiveValue<T>(values: Record<BreakpointType, T>): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint];
}

/**
 * 화면 너비를 반환하는 훅
 */
export function useScreenWidth(): number {
  const [width, setWidth] = useState(1200); // 기본값

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return width;
}