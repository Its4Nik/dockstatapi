import express from "express";
import bcrypt from "bcrypt";
import fs from "fs";
import logger from "../../utils/logger";
const router = express.Router();
const passwordFile = "./src/middleware/password.json";
const passwordBool = "./src/middleware/usePassword.txt";
const saltRounds = 10;

function setTrue() {
  fs.writeFile(passwordBool, "true", "utf8", (err) => {
    if (err) {
      logger.error("Error writing to the file:", err);
      return;
    }
    logger.info(`Enabled authentication`);
  });
}

function setFalse() {
  fs.writeFile(passwordBool, "false", "utf8", (err) => {
    if (err) {
      logger.error("Error writing to the file:", err);
      return;
    }
    logger.info(`Disabled authentication`);
  });
}

/**
 * @swagger
 * /auth/enable:
 *   post:
 *     summary: Enable authentication by setting a password
 *     tags: [Authentication]
 *     parameters:
 *       - name: password
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Authentication enabled.
 *       400:
 *         description: Password is required.
 *       500:
 *         description: Error saving password.
 */
router.post("/enable", (req, res) => {
  fs.readFile(passwordBool, "utf8", (err, data) => {
    const password = req.query.password;
    if (err) {
      logger.error("Error reading the file:", err);
      return;
    }

    const isAuthEnabled = data.trim() === "true";
    if (isAuthEnabled) {
      logger.error(
        "Passowrd Authentication is already enabled, please dactivate it first",
      );
      return res.status(401).json({
        message:
          "Passowrd Authentication is already enabled, please dactivate it first",
      });
    }

    if (!password) {
      logger.error("Pathword is required  ");
      return res.status(400).json({ message: "Password is required" });
    }

    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) {
        logger.error("Error generating salt");
        return res.status(500).json({ message: "Error generating salt" });
      }

      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          logger.error("Error hashing password");
          return res.status(500).json({ message: "Error hashing password" });
        }

        const passwordData = { hash, salt };
        fs.writeFile(passwordFile, JSON.stringify(passwordData), (error) => {
          if (error) {
            logger.error("Error saving password: ", error);
            return res.status(500).json({ message: "Error saving password" });
          }
          setTrue();
          logger.debug("Authentication enabled");
          res.json({ message: "Authentication enabled" });
        });
      });
    });
  });
});

/**
 * @swagger
 * /auth/disable:
 *   post:
 *     summary: Disable authentication by providing the existing password
 *     tags: [Authentication]
 *     parameters:
 *       - name: password
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Authentication disabled.
 *       400:
 *         description: Password is required.
 *       401:
 *         description: Invalid password.
 *       500:
 *         description: Error disabling authentication.
 */
router.post("/disable", (req, res) => {
  const password = req.query.password;
  if (!password) {
    logger.error("Password is required!");
    return res.status(400).json({ message: "Password is required" });
  }

  fs.readFile(passwordFile, "utf8", (err, data) => {
    if (err) {
      logger.error("Error reading password");
      return res.status(500).json({ message: "Error reading password" });
    }

    const storedData = JSON.parse(data);
    bcrypt.compare(password, storedData.hash, (err, result) => {
      if (err) {
        logger.error("Error validating password");
        return res.status(500).json({ message: "Error validating password" });
      }
      if (!result) {
        logger.error("Invalid password");
        return res.status(401).json({ message: "Invalid password" });
      }
      setFalse();
      res.json({ message: "Authentication disabled" });
    });
  });
});

export default router;
