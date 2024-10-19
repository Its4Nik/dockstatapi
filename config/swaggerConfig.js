const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Your API Documentation',
            version: '1.0.0',
            description: 'API documentation with authentication',
        },
        components: {
            securitySchemes: {
                passwordAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-password',
                    description: 'Password required for authentication',
                },
            },
        },
        security: [
            {
                passwordAuth: [],
            },
        ],
    },
    apis: ['./routes/*/*.js'], // Point to your route files
};

module.exports = options;
