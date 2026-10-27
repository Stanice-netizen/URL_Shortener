const express = require("express");
const linkRoutes = require("./routes/links");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", linkRoutes);

module.exports = app;