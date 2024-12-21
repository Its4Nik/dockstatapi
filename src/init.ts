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
    console.log(`
    \u001b[1;31mThank you for using\u001b[0m

    \u001b[1;34m######    ######    #### ###  ###   #### #########   ######   #########\u001b[0m
    \u001b[1;34m### ###  ###  ###  ###   ### ###  ###       ###     ###  ###     ###\u001b[0m
    \u001b[1;34m###  ### ###  ### ###    ######   ####      ###    ###    ###    ###\u001b[0m
    \u001b[1;34m###  ### ###  ### ###    ### ###   ####     ###   ############   ###\u001b[0m
    \u001b[1;34m### ###  ###  ###  ###   ### ###     ####   ###   ###      ###   ###\u001b[0m
    \u001b[1;34m######    ######    #### ###  ###  ####     ###   ###      ###   ###     \u001b[0m(\u001b[1;33mAPI - v2.0.0\u001b[0m)

    \u001b[1;36mUseful links before you go:\u001b[0m

    - Documentation:     \u001b[1;32mhttps://outline.itsnik.de/s/dockstat\u001b[0m
    - GitHub (Frontend): \u001b[1;32mhttps://github.com/its4nik/dockstat\u001b[0m
    - GitHub (Backend):  \u001b[1;32mhttps://github.com/its4nik/dockstatapi\u001b[0m
    - API Documentation: \u001b[1;32mhttp://localhost:7000/api-docs\u001b[0m

    \u001b[1;35mSummary:\u001b[0m

    DockStat and DockStatAPI are 2 fully OpenSource projects, DockStatAPI is a simple but extensible API which allows queries via a REST endpoint.

    \u001b[1;31mGoodbye! We hope to see you again soon.\u001b[0m
    `);
  });
};

export default initializeApp;
