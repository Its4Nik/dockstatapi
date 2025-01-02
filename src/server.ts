import express from "express";
import initializeApp from "./init";
import { startMasterNode } from "./controllers/highAvailability";
import writeUserConf from "./config/hostsystem";

const app = express();
const PORT: number = 9876;

writeUserConf();
initializeApp(app);

app.listen(PORT, () => {
  startMasterNode();
});
