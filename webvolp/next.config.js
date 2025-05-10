/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_KAMAILIO_DOMAIN: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || '',
    NEXT_PUBLIC_KAMAILIO_PORT: process.env.NEXT_PUBLIC_KAMAILIO_PORT || '',
    NEXT_PUBLIC_KAMAILIO_WS: process.env.NEXT_PUBLIC_KAMAILIO_WS || '',
  },
};

module.exports = nextConfig;