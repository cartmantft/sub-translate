import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 배포에 불필요한 파일들 제외
  outputFileTracingExcludes: {
    '*': [
      'src/app/api/test/**/*',
      'tests/**/*',
      'memory-bank/**/*',
      'archived-issues/**/*'
    ]
  },
  // CSP 및 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // TODO: Consider removing 'unsafe-inline' for style-src in production by using hashes or nonces
            // Currently needed for Tailwind CSS and Next.js inline styles
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; frame-src 'self';"
              : "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; frame-src 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Remove protocol prefix from Supabase URL to get hostname for Next.js image optimization
        // Next.js image optimization requires just the hostname without protocol
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'your-supabase-project.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { dev, webpack }) => {
    // 일반적인 Next.js 서버리스 환경 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
