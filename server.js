const express = require("express");
const app = express();

// Utility:
const swaggerDocs = require("./swagger/swaggerDocs");
const logger = require("./utils/logger");

// Routes:
const api = require("./routes/getter/routes");
const conf = require("./routes/setter/routes");
const auth = require("./routes/auth/routes");
const data = require("./routes/data/routes");
const frontend = require("./routes/frontendController/routes");
const notificationService = require("./routes/notifications/routes");

// Middleware:
const authMiddleware = require("./middleware/authMiddleware");
const { limiter } = require("./middleware/rateLimiter");

// Controllers
const { scheduleFetch } = require("./controllers/scheduler");

const PORT = "7070";

app.use(express.json());

app.use("/api-docs", (req, res, next) => next());

swaggerDocs(app);
scheduleFetch();

// Routes
app.use("/api", limiter, authMiddleware, api);
app.use("/conf", limiter, authMiddleware, conf);
app.use("/auth", limiter, authMiddleware, auth);
app.use("/data", limiter, authMiddleware, data);
app.use("/frontend", limiter, authMiddleware, frontend);
app.use("/notification-service", limiter, authMiddleware, notificationService);

// Default route
router.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
