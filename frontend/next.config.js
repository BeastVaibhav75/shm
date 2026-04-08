/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://shm-2a2j.onrender.com',
  },
}

module.exports = nextConfig
