// ─── Plans Router ───────────────────────────────────────────────────────────
// Defines all REST API endpoints for learning plans.
// Mounted at "/plans" in server.js, so:
//   router.post("/")           -> POST   /plans
//   router.get("/")            -> GET    /plans
//   router.get("/:id")         -> GET    /plans/:id
//   router.delete("/:id")      -> DELETE /plans/:id
//   router.post("/:id/generate") -> POST /plans/:id/generate

// Router is a mini Express app that handles a subset of routes.
// We create one here and export it; server.js mounts it at a prefix.
const { Router } = require("express");
const store = require("../store.js");
const { generateLearningPlan } = require("../ai.js");

const router = Router();

// ─── Constants for Validation ───────────────────────────────────────────────
// Allowed values for the level and durationMonths fields.
// Using arrays makes validation a simple .includes() check.
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DURATIONS = [3, 6, 12];

// ─── Helper Functions ───────────────────────────────────────────────────────

// DRY helper -- sends a 404 JSON response. Used in GET /:id, DELETE /:id,
// and POST /:id/generate so we don't repeat the same response everywhere.
function planNotFound(res) {
  res.status(404).json({ error: "Plan not found" });
}

// Response shaper -- controls exactly which fields the client receives.
// This prevents accidentally leaking internal/sensitive fields.
// The ?? (nullish coalescing) operator returns null if learningPlan is
// undefined OR null, ensuring the field is always present in the response.
function toResponse(plan) {
  return {
    id: plan.id,
    interest: plan.interest,
    level: plan.level,
    weeklyHours: plan.weeklyHours,
    durationMonths: plan.durationMonths,
    learningPlan: plan.learningPlan ?? null,
    createdAt: plan.createdAt,
  };
}

// ─── POST /plans — Create a new plan ────────────────────────────────────────
// Status 201 = "Created". The response includes the new plan with its UUID.
// Validates all 4 required fields before touching the database.
router.post("/", async (req, res) => {
  try {
    // Destructure expected fields from the request body.
    // req.body is populated by express.json() middleware in server.js.
    const { interest, level, weeklyHours, durationMonths } = req.body || {};

    // ── Validation ──
    // Validate early, fail fast. Each check returns a 400 ("Bad Request")
    // with a descriptive error message. No validation library needed for
    // a small API -- in production you'd use Zod, Joi, etc.
    if (!interest || typeof interest !== "string" || !interest.trim()) {
      res.status(400).json({ error: "interest is required" });
      return;
    }
    if (!LEVELS.includes(level)) {
      res.status(400).json({
        error: "level must be Beginner, Intermediate, or Advanced",
      });
      return;
    }
    const hours = Number(weeklyHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      res.status(400).json({ error: "weeklyHours must be 1–168" });
      return;
    }
    if (!DURATIONS.includes(Number(durationMonths))) {
      res.status(400).json({ error: "durationMonths must be 3, 6, or 12" });
      return;
    }

    // All validations passed -- create the plan in the store.
    const plan = await store.create({
      interest: interest.trim(),
      level,
      weeklyHours: hours,
      durationMonths: Number(durationMonths),
    });

    // 201 = "Created". Convention for POST endpoints that create a resource.
    res.status(201).json(toResponse(plan));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /plans — List all plans ────────────────────────────────────────────
// Returns an array of all plans, newest first. Status 200 (default).
router.get("/", async (_req, res) => {
  try {
    const plans = await store.getAll();
    // .map(toResponse) applies the response shaper to every plan in the array.
    res.json(plans.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /plans/:id — Get a single plan ─────────────────────────────────────
// :id is a route parameter -- Express extracts it into req.params.id.
// Returns the plan or 404 if not found.
router.get("/:id", async (req, res) => {
  try {
    const plan = await store.getById(req.params.id);
    if (!plan) {
      planNotFound(res);
      return;
    }
    res.json(toResponse(plan));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /plans/:id — Delete a plan ──────────────────────────────────────
// 204 = "No Content". The deletion succeeded but there's nothing to send back.
// This is the REST convention for successful deletes.
router.delete("/:id", async (req, res) => {
  try {
    const removed = await store.remove(req.params.id);
    if (!removed) {
      planNotFound(res);
      return;
    }
    // .send() with no argument sends an empty body (appropriate for 204).
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /plans/:id/generate — AI-generate the learning plan ───────────────
// This is where the AI magic happens. Steps:
//   1. Fetch the existing plan from the store
//   2. Call generateLearningPlan() which does: search -> prompt -> Gemini
//   3. Save the generated markdown back to the plan
//   4. Return the updated plan
//
// This is a separate endpoint (not part of POST /plans) so the user can:
//   - Create a plan without generating (fast, no API calls)
//   - Re-generate the plan later if they want a different result
router.post("/:id/generate", async (req, res) => {
  try {
    const plan = await store.getById(req.params.id);
    if (!plan) {
      planNotFound(res);
      return;
    }

    // generateLearningPlan handles the full AI pipeline:
    //   fetchLearningLinks() -> buildPrompt() -> Gemini API -> markdown text
    const learningPlan = await generateLearningPlan({
      interest: plan.interest,
      level: plan.level,
      weeklyHours: plan.weeklyHours,
      durationMonths: plan.durationMonths,
    });

    // Save the generated plan text back to the store.
    const updated = await store.update(plan.id, { learningPlan });
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
