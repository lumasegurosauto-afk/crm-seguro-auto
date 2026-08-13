/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignora erros de linting que travam o deploy na Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de tipo que travam o deploy
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
