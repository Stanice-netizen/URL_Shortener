const express = require("express");

const app = express();

// Middleware to read JSON requests
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

module.exports = app;