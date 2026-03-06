// ─── Configuration Module ───────────────────────────────────────────────────
// Centralizes all environment variables in one place. Every other file imports
// this module instead of reading process.env directly. Benefits:
//   - Single source of truth for all configurable values
//   - Defaults are defined here, not scattered across the codebase
//   - Easy to see at a glance what the app needs to run

// Safe to call dotenv.config() multiple times -- it won't overwrite existing
// values. We call it here in case config.js is imported before server.js.
require("dotenv").config();
const env = process.env;

module.exports = {
  // Server port. Number() converts the string env var to a number.
  // The || operator provides a fallback: if PORT is unset or 0, use 4000.
  port: Number(env.PORT) || 4000,

  // Google Gemini API key for AI-powered plan generation.
  // .trim() guards against accidental whitespace from copy-pasting.
  geminiApiKey: (env.GEMINI_API_KEY || "").trim(),

  // Serper.dev API key for Google Search results (optional).
  // If missing, the AI generates plans without curated links.
  serperApiKey: (env.SERPER_API_KEY || "").trim(),

  // Path to the JSON file used as our "database".
  // Defaults to data/plans.json in the project root.
  dataFile: env.DATA_FILE || "data/plans.json",
};
