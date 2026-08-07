/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stt/types', '@stt/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'radix-ui'],
  },
  poweredByHeader: false,
};

export default nextConfig;
