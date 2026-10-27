const express = require("express");
const { randomBytes } = require("node:crypto");

const pool = require("../db/pool");
const linkSchema = require("../schemas/linkSchema");

const router = express.Router();

router.post("/", async (req, res) => {
  const result = linkSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid input",
      details: result.error.issues
    });
  }

  const { target_url, code, expires_at } = result.data;

  const shortCode = code || randomBytes(6).toString("base64url");

  try {
    const query = `
      INSERT INTO links (code, target_url, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      shortCode,
      target_url,
      expires_at || null
    ];

    const response = await pool.query(query, values);

    return res.status(201).json(response.rows[0]);

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Short code already taken"
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;