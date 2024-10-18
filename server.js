const express = require('express');
const swaggerDocs = require('./swagger/swaggerDocs');
const api = require('./routes/getter/routes');
const conf = require('./routes/setter/routes')
const app = express();

// Use Swagger UI
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
swaggerDocs(app);

// Routes
app.use('/api', api);
app.use('/conf', conf)

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log('Swagger docs available at http://localhost:3000/api-docs');
});
