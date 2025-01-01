import { Router, Request, Response } from "express";
import { createAuthenticationHandler } from "../../handlers/auth";

const router = Router();

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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication enabled.
 *       400:
 *         description: Password is required.
 *       500:
 *         description: Error saving password.
 */
router.post("/enable", async (req: Request, res: Response): Promise<void> => {
  const password = req.query.password as string;
  const handler = createAuthenticationHandler(req, res);
  await handler.enable(password);
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
 *         schema:
 *           type: string
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
router.post("/disable", async (req: Request, res: Response): Promise<void> => {
  const password = req.query.password as string;
  const handler = createAuthenticationHandler(req, res);
  await handler.disable(password);
});

export default router;
