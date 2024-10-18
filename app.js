// app.js
const express = require('express');
const containerRoutes = require('./routes/containerRoutes');
const swaggerDocs = require('./swagger/swaggerDocs');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

// Middleware to log incoming requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/containers', containerRoutes);

// Swagger Docs
swaggerDocs(app);

module.exports = app;
