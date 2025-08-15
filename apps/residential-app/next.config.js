/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  typescript: {
    tsconfigPath: './tsconfig.json'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy to API server
      },
    ];
  },
};

module.exports = nextConfig;