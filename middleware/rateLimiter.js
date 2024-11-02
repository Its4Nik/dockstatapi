const { rateLimit } = require("express-rate-limit");

export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 300, // Limit each IP to 300 requests per `window` (here, per 5 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
