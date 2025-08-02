/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'X-Islamic-Content-Filter',
    value: 'enabled'
  },
  {
    key: 'X-Family-Safe',
    value: 'true'
  }
]

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  transpilePackages: ['@faddl/types', '@faddl/ui'],
  
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'date-fns'],
    turbo: {
      resolveAlias: {
        canvas: './empty-module.ts',
      }
    }
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
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**'
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'production' ? 'https://faddlmatch.com' : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/functions/:path*',
          destination: 'https://dvydbgjoagrzgpqdhqoq.supabase.co/functions/v1/:path*',
        }
      ],
      fallback: []
    }
  },
  
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true
      }
    ]
  },
  
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for Netlify deployment
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': '@sentry/browser',
      }
    }

    // Bundle optimization for faster builds
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          name: 'framework',
          chunks: 'all',
          test: /(?<!node_modules.*)[\/]node_modules[\/](react|react-dom|scheduler|prop-types|use-subscription)[\/]/,
          priority: 40,
          enforce: true,
        },
        lib: {
          test(module) {
            return module.size() > 160000 && /node_modules/.test(module.identifier())
          },
          name: 'lib',
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
          priority: 20,
        },
        shared: {
          name: 'shared',
          priority: 10,
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
    }
    
    // Performance optimizations
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    return config
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  }
}

// Export with Sentry and Bundle Analyzer if available
if (process.env.SENTRY_DSN && typeof withSentryConfig === 'function') {
  module.exports = withSentryConfig(
    withBundleAnalyzer(nextConfig),
    {
      silent: true,
      org: 'faddl-match',
      project: 'frontend',
    },
    {
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    }
  )
} else {
  module.exports = withBundleAnalyzer(nextConfig)
}