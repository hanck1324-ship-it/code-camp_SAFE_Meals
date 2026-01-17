/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint 경고는 빌드 실패로 처리하지 않음 (npm run lint로 별도 확인)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Tailwind CSS 설정
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // WebWorker 지원
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.publicPath = '/_next/';
    }
    return config;
  },
};

module.exports = nextConfig;
