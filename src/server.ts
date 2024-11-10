import express from "express";
const router = express.Router();
const app = express();

// Utility:
import swaggerDocs from "./swagger/swaggerDocs.js";

import logger from "./utils/logger.js";

// Routes:
import api from "./routes/getter/routes.js";
import conf from "./routes/setter/routes.js";
import auth from "./routes/auth/routes.js";
import data from "./routes/data/routes.js";
import frontend from "./routes/frontendController/routes.js";
import notificationService from "./routes/notifications/routes.js";

// Middleware:
import authMiddleware from "./middleware/authMiddleware.js";

import { limiter } from "./middleware/rateLimiter.js";

// Controllers
import { scheduleFetch } from "./controllers/scheduler.js";

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
