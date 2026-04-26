/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    domains: [
      'riyardwork.com', 
      'images.unsplash.com', 
      'floralawn-and-landscaping.com', 
      'lh3.googleusercontent.com', 
      'avatars.githubusercontent.com',
      'plus.unsplash.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost',
      'via.placeholder.com'
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib': require('path').resolve(__dirname, './lib'),
      '@/libs': require('path').resolve(__dirname, './libs'),
      '@/utils': require('path').resolve(__dirname, './utils'),
      '@/data': require('path').resolve(__dirname, './data'),
      '@/components': require('path').resolve(__dirname, './components'),
      '@/app': require('path').resolve(__dirname, './app'),
      '@/config': require('path').resolve(__dirname, './config'),
      '@': require('path').resolve(__dirname, './')
    };
    
    // Externalize server-only packages to prevent bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'twilio': 'commonjs twilio'
      });
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        }
      }
    }
    return config;
  },
  env: {
    SITE_URL: process.env.SITE_URL || 'https://floralawn-and-landscaping.com',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // SEO: Redirect old -service suffix URLs to clean URLs
      { source: '/:city/lawn-mowing-service', destination: '/:city/lawn-mowing', permanent: true },
      { source: '/:city/lawn-care-service', destination: '/:city/lawn-care', permanent: true },
      { source: '/:city/landscaping-service', destination: '/:city/landscaping', permanent: true },
      { source: '/:city/mulch-installation-service', destination: '/:city/mulch-installation', permanent: true },
      { source: '/:city/leaf-removal-service', destination: '/:city/leaf-removal', permanent: true },
      { source: '/:city/hedge-trimming-service', destination: '/:city/hedge-trimming', permanent: true },
      { source: '/:city/spring-cleanup-service', destination: '/:city/spring-cleanup', permanent: true },
      { source: '/:city/fall-cleanup-service', destination: '/:city/fall-cleanup', permanent: true },
      { source: '/:city/lawn-aeration-service', destination: '/:city/lawn-aeration', permanent: true },
      { source: '/:city/snow-removal-service', destination: '/:city/snow-removal', permanent: true },
    ]
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.emailjs.com https://api.anthropic.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://maps.gstatic.com https://maps.googleapis.com *.googleapis.com *.gstatic.com",
              "connect-src 'self' https://api.anthropic.com https://*.supabase.co https://api.emailjs.com https://maps.googleapis.com",
              "frame-src 'self' https://www.google.com https://maps.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      },
      // API routes security
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          // CORS headers
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.SITE_URL || 'https://floralawn-and-landscaping.com'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  // Experimental features for security
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'twilio']
  }
}

module.exports = nextConfig 