const express = require("express");
const { randomBytes } = require("node:crypto");

const pool = require("../db/pool");
const { linkSchema, clickQuerySchema } = require("../schemas/linkSchema");
const router = express.Router();

router.post("/links", async (req, res) => {
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

router.get("/links/:code", async (req, res) => {
  const result = linkSchema.shape.code.unwrap().safeParse(req.params.code);

  if (!result.success) {
    return res.status(404).json({ error: "Link not found" });
  }

  try {
    const response = await pool.query(
      `SELECT code, target_url, created_at, expires_at, click_count
       FROM links
       WHERE code = $1`,
      [result.data]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.status(200).json(response.rows[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/links/:code/clicks", async (req, res) => {
  // Validate the short code
  const codeResult = linkSchema.shape.code.unwrap().safeParse(req.params.code);

  if (!codeResult.success) {
    return res.status(404).json({ error: "Link not found" });
  }

  // Validate pagination parameters
  const queryResult = clickQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    return res.status(400).json({
      error: "Invalid pagination parameters",
      details: queryResult.error.issues
    });
  }

  const { after, limit } = queryResult.data;

  try {
    // Find the link
    const linkResult = await pool.query(
      "SELECT id FROM links WHERE code = $1",
      [codeResult.data]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    const linkId = linkResult.rows[0].id;

    // Retrieve clicks using keyset pagination
    const result = await pool.query(
      `SELECT id, clicked_at, referrer, user_agent
       FROM clicks
       WHERE link_id = $1
       AND ($2::integer IS NULL OR id < $2)
       ORDER BY id DESC
       LIMIT $3`,
      [linkId, after ?? null, limit + 1]
    );

    // Check whether another page exists
    const hasMore = result.rows.length > limit;

    const clicks = result.rows.slice(0, limit);

    const nextCursor = hasMore
      ? String(clicks[clicks.length - 1].id)
      : null;

    return res.status(200).json({
      clicks,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});


router.delete("/links/:code", async (req, res) => {
  const result = linkSchema.shape.code.unwrap().safeParse(req.params.code);

  if (!result.success) {
    return res.status(404).json({ error: "Link not found" });
  }

  try {
    const response = await pool.query(
      "DELETE FROM links WHERE code = $1 RETURNING id",
      [result.data]
    );

    if (response.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.status(204).send();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;