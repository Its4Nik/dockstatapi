const options: {
  definition: {
    failOnErrors: boolean;
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
    };
    components: {
      securitySchemes: {
        passwordAuth: {
          type: string;
          in: string;
          name: string;
          description: string;
        };
      };
    };
    security: Array<{
      passwordAuth: unknown[];
    }>;
  };
  apis: string[];
} = {
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
  apis: ["./src/routes/*/*.ts"],
};

export default options;
