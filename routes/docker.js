// routes/docker.js

const express = require('express');
const router = express.Router();

// Render the index.ejs view
router.get('/', (req, res) => {
    const config = require('yamljs').load('./hosts.yaml');
    res.render('index', { queryInterval: config.query_interval });
});

module.exports = router;
