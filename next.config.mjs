/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: process.env.NODE_ENV === 'development' ? '/proxy/3000' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
