const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback

export const config = {
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         parseInt(optional('PORT', '4000'), 10),
  LOG_LEVEL:    optional('LOG_LEVEL', 'info'),

  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL:    optional('REDIS_URL', 'redis://localhost:6379'),

  JWT_SECRET:   required('JWT_SECRET'),

  CORS_ORIGINS: optional('CORS_ORIGIN', 'http://localhost:3000')
                  .split(',').map((s) => s.trim()),

  get isProduction() { return this.NODE_ENV === 'production' },
  get isDevelopment() { return this.NODE_ENV === 'development' },
} as const
