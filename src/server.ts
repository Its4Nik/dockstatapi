import express, { Request, Response, NextFunction } from "express";
import swaggerDocs from "./swagger/swaggerDocs";
import logger from "./utils/logger";
import auth from "./routes/auth/routes";
import data from "./routes/data/routes";
import frontend from "./routes/frontendController/routes";
import api from "./routes/getter/routes";
import notificationService from "./routes/notifications/routes";
import conf from "./routes/setter/routes";
import authMiddleware from "./middleware/authMiddleware";
import { limiter } from "./middleware/rateLimiter";
import { scheduleFetch } from "./controllers/scheduler";

// Initialize express app
const app = express();
const PORT: number = 7070; // Port should be a number

// Middleware to parse JSON requests
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", (req: Request, res: Response, next: NextFunction) =>
  next(),
);
swaggerDocs(app);
scheduleFetch();

// Routes with Middleware
app.use("/api", limiter, authMiddleware, api);
app.use("/conf", limiter, authMiddleware, conf);
app.use("/auth", limiter, authMiddleware, auth);
app.use("/data", limiter, authMiddleware, data);
app.use("/frontend", limiter, authMiddleware, frontend);
app.use("/notification-service", limiter, authMiddleware, notificationService);

// Default route for root ("/")
app.get("/", (req: Request, res: Response) => {
  res.redirect("/api-docs");
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
