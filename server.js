// server.js
const express = require('express');
const swaggerDocs = require('./swagger/swaggerDocs');
const statsRoutes = require('./routes/statsRoutes');
const app = express();

// Use Swagger UI
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
swaggerDocs(app);

// Use stats routes
app.use('/api', statsRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log('Swagger docs available at http://localhost:3000/api-docs');
});
