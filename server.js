const express = require('express');
const swaggerDocs = require('./swagger/swaggerDocs');
const api = require('./routes/getter/routes');
const conf = require('./routes/setter/routes');
const auth = require('./routes/auth/routes');
const data = require('./routes/data/routes');
const authMiddleware = require('./middleware/authMiddleware');
const app = express();
const logger = require('./utils/logger');
const { scheduleFetch } = require('./controllers/scheduler')

app.use(express.json());

app.use('/api-docs', (req, res, next) => next());

swaggerDocs(app);
scheduleFetch();

// Routes
app.use('/api', authMiddleware, api);
app.use('/conf', authMiddleware, conf);
app.use('/auth', authMiddleware, auth);
app.use('/data', authMiddleware, data);

app.listen(3000, () => {
    logger.info('Server is running on http://localhost:3000');
    logger.info('Swagger docs available at http://localhost:3000/api-docs');
});