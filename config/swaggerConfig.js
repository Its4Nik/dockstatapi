const options = {
  definition: {
    failOnErrors: true,
    openapi: "3.0.0",
    info: {
      title: "DockStatAPI",
      version: "2",
      description: "An API used to query muliple docker hosts",
    },
    components: {
      securitySchemes: {
        passwordAuth: {
          type: "apiKey",
          in: "header",
          name: "x-password",
          description: "Password required for authentication",
        },
      },
    },
    security: [
      {
        passwordAuth: [],
      },
    ],
  },
  apis: ["./routes/*/*.js"],
};

module.exports = options;
