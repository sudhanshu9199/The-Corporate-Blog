// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ],
  },
  compress: true, // Enables Brotli/Gzip compression ✅
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, // ✅ Referrer Policy
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }, // ✅ HSTS
          { 
            key: 'Content-Security-Policy', 
            // ✅ Strict CSP (Adjust URLs based on your analytics/fonts)
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com;" 
          }
        ],
      },
    ];
  },
};
export default nextConfig;