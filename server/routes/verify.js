const express = require("express");
const router = express.Router();
const verifications = require("../utils/verificationStore");

/**
 * @swagger
 * tags:
 *   name: Verify
 *   description: Discord verification endpoints
 */

/**
 * @swagger
 * /verify:
 *   post:
 *     summary: Verify Discord code
 *     tags: [Verify]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discordUsername:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verified successfully
 */
router.post("/", (req, res) => {
    const { discordUsername, code } = req.body;
    const record = verifications[discordUsername];

    if (!record) return res.status(400).send("No verification request found");
    if (record.expiresAt < Date.now()) return res.status(400).send("Code expired");
    if (record.code.toUpperCase() !== code.toUpperCase())
        return res.status(400).send("Invalid code");

    // Verified successfully
    delete verifications[discordUsername];

    res.send("✅ Discord account verified!");
});

module.exports = router;
