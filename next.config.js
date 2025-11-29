// Optional bundle analyzer (requires @next/bundle-analyzer). Uncomment install when needed.
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })

const contentSecurityPolicy = [
  "default-src 'self' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.resend.com",
  "frame-src 'self' https://js.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hooks.stripe.com",
].join('; ')

// Runtime env validation is centralized under lib/env.ts to keep build-time config lean.
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression on the server (Vercel also compresses at the edge).
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  // Ignore ESLint warnings during production builds (errors still fail the build)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Optimize responsive image loading for our supported breakpoints.
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    // Keep server actions enabled for existing mutations.
    serverActions: {
      enabled: true,
    },
  },
  async headers() {
    // Apply secure headers to every route for better baseline security.
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    // Normalize frequently accessed admin/account routes.
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/conta/',
        destination: '/conta',
        permanent: true,
      },
    ]
  },
}

const configWithPlugins =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
    : nextConfig

module.exports = configWithPlugins
