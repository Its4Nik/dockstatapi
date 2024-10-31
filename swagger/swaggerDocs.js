const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerConfig = require("../config/swaggerConfig");

const swaggerDocs = (app) => {
  const specs = swaggerJsdoc(swaggerConfig);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = swaggerDocs;
