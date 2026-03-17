const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      'porto/internal': false,
      'porto': false,
    }
    return config
  },
}
