import express, { Request, Response, NextFunction } from "express";
import process from "node:process";
import swaggerDocs from "./utils/swaggerDocs";
import auth from "./routes/auth/routes";
import data from "./routes/data/routes";
import frontend from "./routes/frontendController/routes";
import api from "./routes/getter/routes";
import notificationService from "./routes/notifications/routes";
import conf from "./routes/setter/routes";
import authMiddleware from "./middleware/authMiddleware";
import ha from "./routes/highavailability/routes";
import trustedProxies from "./controllers/proxy";
import { limiter } from "./middleware/rateLimiter";
import { scheduleFetch } from "./controllers/scheduler";
import cors from "cors";
import { blockWhileLocked } from "./middleware/checkLock";
import logger from "./utils/logger";

const initializeApp = (app: express.Application): void => {
  app.use(cors());
  app.use(express.json());
  app.use("/api-docs", (req: Request, res: Response, next: NextFunction) =>
    next(),
  );

  swaggerDocs(app as any);
  trustedProxies(app); // Configures proxies using CSV string
  scheduleFetch();

  app.use("/api", limiter, authMiddleware, blockWhileLocked, api);
  app.use("/conf", limiter, authMiddleware, blockWhileLocked, conf);
  app.use("/auth", limiter, authMiddleware, blockWhileLocked, auth);
  app.use("/data", limiter, authMiddleware, blockWhileLocked, data);
  app.use("/frontend", limiter, authMiddleware, blockWhileLocked, frontend);
  app.use(
    "/notification-service",
    limiter,
    authMiddleware,
    blockWhileLocked,
    notificationService,
  );
  app.use("/ha", limiter, authMiddleware, ha);

  app.get("/", (req: Request, res: Response) => {
    res.redirect("/api-docs");
  });

  process.on("exit", (code: number) => {
    logger.warn(`Server exiting (Code: ${code})`);
  });
};

export default initializeApp;
