import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerConfig from "../config/swaggerConfig";
import express from "express";

const swaggerDocs = (app: express.Application) => {
  const specs = swaggerJsdoc(swaggerConfig);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};

export default swaggerDocs;
