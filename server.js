const express = require('express');
const swaggerDocs = require('./swagger/swaggerDocs');
const api = require('./routes/getter/routes');
const conf = require('./routes/setter/routes');
const auth = require('./routes/auth/routes');
const { authMiddleware } = require('./middleware/authMiddleware');
const app = express();

app.use(express.json());

app.use('/api-docs', (req, res, next) => next());

swaggerDocs(app);

// Routes
app.use('/api', authMiddleware, api);
app.use('/conf', authMiddleware, conf);
app.use('/auth', authMiddleware, auth);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log('Swagger docs available at http://localhost:3000/api-docs');
});
