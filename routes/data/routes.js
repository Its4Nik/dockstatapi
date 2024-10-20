const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const logger = require('../../utils/logger');

function formatRows(rows) {
    return rows.reduce((acc, row, index) => {
        acc[index] = JSON.parse(row.info);
        return acc;
    }, {});
}

/**
 * @swagger
 * /data/latest:
 *   get:
 *     summary: Retrieve the latest entry from the database
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A JSON object containing the latest entry's 'info' data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               name: "Container A"
 *               id: "abcd1234"
 *               cpu_usage: 30
 *               mem_usage: 2048
 */
router.get('/latest', (req, res) => {
    db.get('SELECT info FROM data ORDER BY timestamp DESC LIMIT 1', (err, row) => {
        if (err) {
            logger.error('Error fetching latest data:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(JSON.parse(row.info));
    });
});

/**
 * @swagger
 * /data/time/24h:
 *   get:
 *     summary: Retrieve entries from the last 24 hours from the database
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A numbered array of 'info' JSON objects from the last 24 hours.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               0:
 *                 name: "Container A"
 *                 id: "abcd1234"
 *                 cpu_usage: 30
 *                 mem_usage: 2048
 *               1:
 *                 name: "Container B"
 *                 id: "efgh5678"
 *                 cpu_usage: 45
 *                 mem_usage: 3072
 */
router.get('/time/24h', (req, res) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    db.all('SELECT info FROM data WHERE timestamp >= ?', [oneDayAgo], (err, rows) => {
        if (err) {
            logger.error('Error fetching data from last 24 hours:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(formatRows(rows));
    });
});

/**
 * @swagger
 * /data/clear:
 *   delete:
 *     summary: Clear all entries from the database
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A message indicating whether the database was cleared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               message: "Database cleared successfully."
 */
router.delete('/clear', (req, res) => {
    db.run('DELETE FROM data', (err) => {
        if (err) {
            logger.error('Error clearing the database:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ message: 'Database cleared successfully' });
    });
});

module.exports = router;
