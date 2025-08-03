import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  
  // 启用实验性功能
  experimental: {
    // 启用Turbo以提升开发体验（仅开发环境）
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 启用优化字体加载和静态资源优化
    optimizePackageImports: ['ethers'],

  },

  // 编译器配置
  compiler: {
    // 移除console.log以提升生产环境性能
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 图片优化配置
  images: {
    // 禁用图片优化以提升性能（如果不需要）
    unoptimized: true,
  },

  // 输出配置
  output: 'standalone',

  // 启用压缩
  compress: true,

  // 性能优化
  poweredByHeader: false,

  // 包转译配置
  transpilePackages: ['ethers'],

  // 启用严格模式
  reactStrictMode: true,

  // 构建时忽略ESLint错误
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript配置
  typescript: {
    ignoreBuildErrors: true,
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // 重写规则（如果需要）
  async rewrites() {
    return [];
  },

  // 重定向规则（如果需要）
  async redirects() {
    return [];
  },
};

export default nextConfig;
