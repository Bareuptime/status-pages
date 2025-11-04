import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Optimize for production
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api1.bareuptime.co',
  },

  // Image optimization
  images: {
    unoptimized: true, // Since we're running in Docker
  },

  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
}

export default nextConfig
