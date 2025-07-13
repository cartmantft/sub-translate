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
  // Security headers are now handled by Vercel's default security settings
  // and our middleware for CSP nonce implementation
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
