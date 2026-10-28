const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("node:path");

const linkRoutes = require("./routes/links");

const app = express();

app.use(express.json());

// Load Swagger documentation
const swaggerDocument = YAML.load(
  path.join(__dirname, "../docs/openapi.yaml")
);

// Swagger must come before the redirect route
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/", linkRoutes);

module.exports = app;