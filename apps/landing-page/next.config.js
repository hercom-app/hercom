/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@proyecto/legal", "@proyecto/brand"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
