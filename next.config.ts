import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.relay.link',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
