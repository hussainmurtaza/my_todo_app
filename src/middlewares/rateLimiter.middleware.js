const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redis = require("../../config/redis");

const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args), // for ioredis
  }),

  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

module.exports = rateLimiter;
