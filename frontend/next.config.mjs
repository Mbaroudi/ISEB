/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8069',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.iseb-accounting.fr',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'ISEB',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  async rewrites() {
    return [
      {
        source: '/api/odoo/:path*',
        destination: `${process.env.ODOO_URL || 'http://localhost:8069'}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
