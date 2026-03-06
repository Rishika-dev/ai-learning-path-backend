// ─── JSON File Store ────────────────────────────────────────────────────────
// A simple file-based "database" using a JSON file. No external DB needed.
// Perfect for prototypes, workshops, and hackathons.
//
// Trade-offs vs a real database:
//   + Zero setup (no Docker, no connection strings, no migrations)
//   - No concurrent write safety (two writes at the same time could conflict)
//   - No indexing (every query reads the entire file)
//   - Doesn't scale beyond small datasets
//
// The store exposes 5 CRUD operations: create, getAll, getById, update, remove.
// Internal helpers (readPlans, writePlans, ensureDataDir) are NOT exported.

// fs.promises gives us async/await versions of Node's filesystem functions.
// This avoids callback hell and works naturally with try/catch.
const fs = require("fs").promises;

// path module provides utilities for working with file and directory paths
// in a cross-platform way (Windows backslashes vs Unix forward slashes).
const path = require("path");

// crypto.randomUUID() generates a v4 UUID (e.g. "550e8400-e29b-41d4-a716-...")
// Built into Node 18+ so no need for the `uuid` npm package.
const { randomUUID } = require("crypto");

const config = require("./config.js");

// ─── Private Helpers ────────────────────────────────────────────────────────

// Creates the data directory if it doesn't exist. Called before every
// read/write to handle first-run gracefully.
// { recursive: true } means:
//   - Create parent dirs if needed (like `mkdir -p`)
//   - Don't throw if the directory already exists
async function ensureDataDir() {
  const dir = path.dirname(config.dataFile);
  await fs.mkdir(dir, { recursive: true });
}

// Reads and parses the JSON file. Returns an array of plan objects.
// On first run the file won't exist -- we catch ENOENT ("Error NO ENTry",
// i.e. file not found) and return an empty array instead of crashing.
// Any other error (bad permissions, corrupt JSON) is re-thrown.
async function readPlans() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(config.dataFile, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

// Serializes the plans array to JSON and writes it to disk.
// JSON.stringify(plans, null, 2) pretty-prints with 2-space indentation
// so the file is human-readable (handy for debugging).
async function writePlans(plans) {
  await ensureDataDir();
  await fs.writeFile(config.dataFile, JSON.stringify(plans, null, 2), "utf8");
}

// ─── Public CRUD Operations ─────────────────────────────────────────────────

// Returns all plans, sorted newest-first by createdAt timestamp.
// We parse the ISO date strings into Date objects for proper comparison.
async function getAll() {
  const plans = await readPlans();
  return plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Finds a single plan by its UUID. Returns the plan object or null.
// Array.find() returns undefined if not found; we normalize to null.
async function getById(id) {
  const plans = await readPlans();
  return plans.find((p) => p.id === id) || null;
}

// Creates a new plan with a generated UUID and timestamp.
// learningPlan starts as null -- it gets filled in later when the user
// triggers AI generation via POST /plans/:id/generate.
async function create(data) {
  const plans = await readPlans();
  const plan = {
    id: randomUUID(),
    interest: data.interest,
    level: data.level,
    weeklyHours: data.weeklyHours,
    durationMonths: data.durationMonths,
    learningPlan: null,
    createdAt: new Date().toISOString(),
  };
  plans.push(plan);
  await writePlans(plans);
  return plan;
}

// Partial update: spreads the updates object over the existing plan.
// This means you can update just one field without touching the rest.
// Returns the updated plan, or null if the ID doesn't exist.
async function update(id, updates) {
  const plans = await readPlans();
  const i = plans.findIndex((p) => p.id === id);
  if (i === -1) return null;
  plans[i] = { ...plans[i], ...updates };
  await writePlans(plans);
  return plans[i];
}

// Removes a plan by ID. Array.splice(index, 1) removes one element at
// the given index and returns it. Returns the removed plan or null.
async function remove(id) {
  const plans = await readPlans();
  const i = plans.findIndex((p) => p.id === id);
  if (i === -1) return null;
  const removed = plans.splice(i, 1)[0];
  await writePlans(plans);
  return removed;
}

// Only these 5 functions are part of the public API.
// readPlans, writePlans, ensureDataDir stay private to this module.
module.exports = { getAll, getById, create, update, remove };
