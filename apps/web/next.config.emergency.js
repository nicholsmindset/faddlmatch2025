/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: '.next',
  experimental: {
    esmExternals: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [],
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://faddlmatch.com',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  // Webpack config to handle missing dependencies gracefully
  webpack: (config, { isServer }) => {
    // Ignore missing optional dependencies
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@faddl/types': 'commonjs @faddl/types',
        '@faddlmatch/api-client': 'commonjs @faddlmatch/api-client',
        '@faddl-match/ai-integration': 'commonjs @faddl-match/ai-integration'
      });
    }
    
    // Fallback for missing modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
}

module.exports = nextConfig