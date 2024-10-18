// config/swaggerConfig.js
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dockstat API',
            version: '1.0.0',
            description: 'API for Docker container stats',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./routes/*.js'],
};

module.exports = options;
