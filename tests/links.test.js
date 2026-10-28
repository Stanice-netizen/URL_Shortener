
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// Load environment variables before importing the application
require("dotenv").config();

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is missing");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const app = require("../src/app");
const pool = require("../src/db/pool");

let server;
let baseUrl;

before(async () => {
  // Safety check: never use the development database
  const database = await pool.query("SELECT current_database()");

  assert.equal(database.rows[0].current_database, "url_shortener_test");

  await pool.query("TRUNCATE clicks, links RESTART IDENTITY CASCADE");

  server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();

    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  await pool.end();
});

// Helper function for creating links
async function createLink(code, target = "https://example.com") {
  return fetch(`${baseUrl}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target_url: target,
      code
    })
  });
}

// TEST 1
test("creates a short link", async () => {
  const response = await createLink("test-link");

  assert.equal(response.status, 201);

  const data = await response.json();

  assert.equal(data.code, "test-link");
  assert.equal(data.click_count, 0);
});

// TEST 2
test("rejects an invalid URL", async () => {
  const response = await createLink("bad-link", "hello");

  assert.equal(response.status, 400);
});

// TEST 3
test("rejects duplicate codes", async () => {
  const response = await createLink("test-link");

  assert.equal(response.status, 409);
});

// TEST 4
test("redirects correctly", async () => {
  const response = await fetch(`${baseUrl}/test-link`, {
    redirect: "manual"
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.com");
});

// TEST 5
test("returns 404 for unknown links", async () => {
  const response = await fetch(`${baseUrl}/unknown123`, {
    redirect: "manual"
  });

  assert.equal(response.status, 404);
});

// TEST 6
test("returns 410 for expired links", async () => {
  await createLink("old-link");

  await pool.query(
    "UPDATE links SET expires_at = NOW() - INTERVAL '1 minute' WHERE code = $1",
    ["old-link"]
  );

  const response = await fetch(`${baseUrl}/old-link`, {
    redirect: "manual"
  });

  assert.equal(response.status, 410);

  const result = await pool.query(
    "SELECT click_count FROM links WHERE code = $1",
    ["old-link"]
  );

  assert.equal(result.rows[0].click_count, 0);
});

// TEST 7: CONCURRENCY
test("records concurrent clicks without losing updates", async () => {
  await createLink("counter-test");

  const totalClicks = 50;

  const responses = await Promise.all(
    Array.from({ length: totalClicks }, () =>
      fetch(`${baseUrl}/counter-test`, {
        redirect: "manual"
      })
    )
  );

  for (const response of responses) {
    assert.equal(response.status, 302);
  }

  const result = await pool.query(
    "SELECT id, click_count FROM links WHERE code = $1",
    ["counter-test"]
  );

  const link = result.rows[0];

  assert.equal(link.click_count, totalClicks);

  const clicks = await pool.query(
    "SELECT COUNT(*)::integer AS total FROM clicks WHERE link_id = $1",
    [link.id]
  );

  assert.equal(clicks.rows[0].total, totalClicks);
});

// TEST 8: SECURITY
test("rejects SQL injection attempts safely", async () => {
  const maliciousCode = "abc' OR '1'='1";

  const response = await createLink(maliciousCode);

  assert.equal(response.status, 400);

  // Ensure our existing data remains untouched
  const result = await pool.query(
    "SELECT COUNT(*)::integer AS total FROM links WHERE code = $1",
    ["test-link"]
  );

  assert.equal(result.rows[0].total, 1);
});

// TEST 9
test("returns link metadata", async () => {
  const response = await fetch(`${baseUrl}/links/test-link`);

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.code, "test-link");
  assert.equal(data.target_url, "https://example.com");
});

// TEST 10
test("deletes a link and its clicks", async () => {
  const response = await fetch(`${baseUrl}/links/counter-test`, {
    method: "DELETE"
  });

  assert.equal(response.status, 204);

  const result = await pool.query(
    "SELECT COUNT(*)::integer AS total FROM links WHERE code = $1",
    ["counter-test"]
  );

  assert.equal(result.rows[0].total, 0);

  const clicks = await pool.query(
    "SELECT COUNT(*)::integer AS total FROM clicks"
  );

  // Only the earlier test-link redirect should remain
  assert.equal(clicks.rows[0].total, 1);
});
