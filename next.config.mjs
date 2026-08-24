/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**': ['./data/**/*'],
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
};

export default nextConfig;
