/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@gulfos/shared'],
  experimental: {
    // Tree-shake barrel imports of the heaviest UI dependency
    optimizePackageImports: ['framer-motion'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  },
  async headers() {
    return [
      {
        // Map tiles, icons, fonts and sounds are immutable — cache aggressively
        source: '/:prefix(gta-map|icons|fonts|sounds)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
