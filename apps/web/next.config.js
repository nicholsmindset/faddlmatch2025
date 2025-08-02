/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@faddl/types', '@faddl/ui'],
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dvydbgjoagrzgpqdhqoq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**'
      }
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig