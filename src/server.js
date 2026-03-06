require("dotenv").config();
const express = require("express");
const config = require("./config.js");
const plansRouter = require("./routes/plans.js");

const app = express();

// Middleware - a function that runs between the request and the response
// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/plans", plansRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
