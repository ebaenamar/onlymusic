/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.scdn.co', 'platform-lookaside.fbsbx.com', 'mosaic.scdn.co'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  }
}

module.exports = nextConfig
