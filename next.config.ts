// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ allow external images (e.g., Cloudinary)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
      { protocol: 'https', hostname: '/' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // tambah domain lain jika API kirim CDN berbeda
    ],
  },

  // ✅ skip TypeScript & ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
