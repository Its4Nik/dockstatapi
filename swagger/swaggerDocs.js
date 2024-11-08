import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerConfig from "../config/swaggerConfig.js";

const swaggerDocs = (app) => {
  const specs = swaggerJsdoc(swaggerConfig);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};

export default swaggerDocs;
