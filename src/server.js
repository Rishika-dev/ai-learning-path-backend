// ─── Load Environment Variables ──────────────────────────────────────────────
// dotenv reads the .env file in the project root and injects each KEY=VALUE
// pair into process.env. This MUST run before any code that reads env vars
// (like config.js), otherwise those values will be undefined.
require("dotenv").config();

// ─── Import Dependencies ────────────────────────────────────────────────────
// express is a minimal web framework for Node.js. Calling require("express")
// gives us a factory function -- calling it creates an application instance.
const express = require("express");

// Our centralized config module -- all env vars and defaults in one place.
const config = require("./config.js");

// The plans router handles all /plans/* endpoints. We keep route logic in
// separate files so server.js stays small and focused on app-level setup.
const plansRouter = require("./routes/plans.js");

// ─── Create the Express Application ─────────────────────────────────────────
// This object is the heart of our server. We attach middleware and routes to it.
const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
// Middleware = functions that run on every request BEFORE your route handler.
// They can read/modify the request, the response, or short-circuit the pipeline.
//
// express.json() is built-in middleware that:
//   1. Checks if the request has Content-Type: application/json
//   2. Reads the raw request body
//   3. Parses it as JSON
//   4. Puts the result in req.body
// Without this, req.body would be undefined for POST/PUT requests.
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
// app.use(path, router) mounts a router at a prefix. Every route defined
// inside plansRouter will be prefixed with "/plans":
//   router.post("/")         -> POST   /plans
//   router.get("/:id")       -> GET    /plans/:id
//   router.post("/:id/generate") -> POST /plans/:id/generate
app.use("/plans", plansRouter);

// A simple health-check endpoint. Useful for monitoring tools, load balancers,
// or just verifying the server is alive. Returns { ok: true }.
// _req prefix convention = "I receive this param but don't use it".
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ─── Start the Server ───────────────────────────────────────────────────────
// app.listen() binds the server to a TCP port and starts accepting connections.
// The callback fires once the server is ready.
app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
