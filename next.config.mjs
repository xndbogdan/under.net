/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dwc71k9eqn.ufs.sh',
      },
    ],
  },
};

export default nextConfig;
