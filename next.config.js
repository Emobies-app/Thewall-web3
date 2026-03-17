/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto/internal': false,
      'porto': false,
    }
    return config
  },
}

module.exports = nextConfig
