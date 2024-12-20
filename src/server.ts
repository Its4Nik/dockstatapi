import express from "express";
import logger from "./utils/logger";
import initializeApp from "./init";
import { startMasterNode } from "./controllers/highAvailability";
import writeUserConf from "./config/hostsystem";

const app = express();
const PORT: number = 9876;

writeUserConf();
initializeApp(app);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  startMasterNode();
});
