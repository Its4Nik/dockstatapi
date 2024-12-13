import express, { Request, Response, NextFunction } from "express";
import swaggerDocs from "./swagger/swaggerDocs";
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

const initializeApp = (app: express.Application): void => {
  app.use(cors());
  app.use(express.json());
  app.use("/api-docs", (req: Request, res: Response, next: NextFunction) =>
    next(),
  );

  swaggerDocs(app as any);
  trustedProxies(app); // Configures proxies using CSV string
  scheduleFetch();

  app.use("/api", limiter, authMiddleware, api);
  app.use("/conf", limiter, authMiddleware, conf);
  app.use("/auth", limiter, authMiddleware, auth);
  app.use("/data", limiter, authMiddleware, data);
  app.use("/frontend", limiter, authMiddleware, frontend);
  app.use(
    "/notification-service",
    limiter,
    authMiddleware,
    notificationService,
  );
  app.use("/ha", limiter, authMiddleware, ha);

  app.get("/", (req: Request, res: Response) => {
    res.redirect("/api-docs");
  });
};

export default initializeApp;
