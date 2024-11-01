const express = require("express");
const swaggerDocs = require("./swagger/swaggerDocs");
const api = require("./routes/getter/routes");
const conf = require("./routes/setter/routes");
const auth = require("./routes/auth/routes");
const data = require("./routes/data/routes");
const frontend = require("./routes/frontendController/routes");
const authMiddleware = require("./middleware/authMiddleware");
const app = express();
const logger = require("./utils/logger");
const { scheduleFetch } = require("./controllers/scheduler");
const { limiter } = require("./utils/rateLimiter");

const PORT = "7070";

app.use(express.json());

app.use("/api-docs", (req, res, next) => next());

swaggerDocs(app);
scheduleFetch();

// Routes
app.use("/api", authMiddleware, api);
app.use("/conf", authMiddleware, conf);
app.use("/auth", authMiddleware, auth);
app.use("/data", authMiddleware, data);
app.use("/frontend", authMiddleware, frontend);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
