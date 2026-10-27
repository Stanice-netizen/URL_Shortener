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


router.get("/:code", async (req, res) => {
  const { code } = req.params;

  // Validate the short code
  const codeResult = linkSchema.shape.code.unwrap().safeParse(code);

  if (!codeResult.success) {
    return res.status(404).json({
      error: "Link not found"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find the link and lock it during the transaction
    const result = await client.query(
      "SELECT * FROM links WHERE code = $1 FOR UPDATE",
      [codeResult.data]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Link not found"
      });
    }

    const link = result.rows[0];

    // Check whether the link has expired
    if (link.expires_at && new Date(link.expires_at) <= new Date()) {
      await client.query("ROLLBACK");

      return res.status(410).json({
        error: "This link has expired"
      });
    }

    // Record the click
    await client.query(
      `INSERT INTO clicks (link_id, referrer, user_agent)
       VALUES ($1, $2, $3)`,
      [
        link.id,
        req.get("referer") || null,
        req.get("user-agent") || null
      ]
    );

    // Atomic increment
    await client.query(
      `UPDATE links
       SET click_count = click_count + 1
       WHERE id = $1`,
      [link.id]
    );

    await client.query("COMMIT");

    return res.redirect(302, link.target_url);

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });

  } finally {
    client.release();
  }
});

module.exports = router;