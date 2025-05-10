/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tambahkan konfigurasi untuk lingkungan produksi
  env: {
    NEXT_PUBLIC_KAMAILIO_DOMAIN: process.env.NEXT_PUBLIC_KAMAILIO_DOMAIN || 'voip-server.example.com',
    NEXT_PUBLIC_KAMAILIO_PORT: process.env.NEXT_PUBLIC_KAMAILIO_PORT || '8088',
    NEXT_PUBLIC_KAMAILIO_WS: process.env.NEXT_PUBLIC_KAMAILIO_WS || 'wss://voip-server.example.com:8088/ws',
  },
};

module.exports = nextConfig;