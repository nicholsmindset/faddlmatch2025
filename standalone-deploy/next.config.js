/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@clerk/nextjs'],
  experimental: {
    esmExternals: 'loose'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      }
    ],
  },
  transpilePackages: [],
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/matches',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig