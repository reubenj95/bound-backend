const rateLimitLib = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const Redis = require('ioredis')

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: true, // Enable offline queue for better resilience
  maxRetriesPerRequest: 3, // Add retry attempts
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis error:', err)
})

// Create rate limiter with configurable options
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000), // seconds
      })
    },
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs or admin users
      return req.ip === '127.0.0.1' || req.user?.isAdmin
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:', // Redis key prefix for rate limiter
    }),
  }

  return rateLimitLib({
    ...defaultOptions,
    ...options,
  })
}

// Predefined rate limiters
const rateLimiters = {
  standard: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
  public: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),
  strict: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
  }),
  heavy: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
  }),
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60),
      })
    },
  }),
}

// Utility to check remaining rate limit
const getRateLimit = async (key) => {
  try {
    const remaining = await redisClient.get(`rl:${key}`)
    return remaining ? parseInt(remaining) : null
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return null
  }
}

// Utility to reset rate limit for a key
const resetRateLimit = async (key) => {
  try {
    await redisClient.del(`rl:${key}`)
    return true
  } catch (error) {
    console.error('Error resetting rate limit:', error)
    return false
  }
}

// Export the middleware function directly
module.exports = {
  rateLimit: (options = {}) => {
    if (typeof options === 'string' && rateLimiters[options]) {
      return rateLimiters[options]
    }
    return createRateLimiter(options)
  },
  getRateLimit,
  resetRateLimit,
  redisClient,
}
