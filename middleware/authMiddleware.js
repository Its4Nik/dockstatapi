const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const passwordFile = path.join(__dirname, 'password.json');
const passwordBool = path.join(__dirname, 'usePassword.txt');

function authMiddleware(req, res, next) {

    fs.readFile(passwordBool, 'utf8', (err, data) => {
        if (err) {
            logger.error('Error reading the file:', err);
            return;
        }

        const isAuthEnabled = data.trim() === 'true';

        if (!isAuthEnabled) {
            return next();
        }

        const providedPassword = req.headers['x-password'];
        if (!providedPassword) {
            return res.status(401).json({ message: 'Password required' });
        }

        fs.readFile(passwordFile, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ message: 'Error reading password' });

            const storedData = JSON.parse(data);
            bcrypt.compare(providedPassword, storedData.hash, (err, result) => {
                if (err) return res.status(500).json({ message: 'Error validating password' });
                if (!result) return res.status(401).json({ message: 'Invalid password' });

                next();
            });
        });
    });
}

module.exports = { authMiddleware };