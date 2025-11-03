// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
      { protocol: 'https', hostname: '/' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // tambah domain lain jika API kirim CDN berbeda
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
