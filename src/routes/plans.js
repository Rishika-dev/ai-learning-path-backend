const { Router } = require("express");
const store = require("../store.js");
const { generateLearningPlan } = require("../ai.js");

const router = Router();
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DURATIONS = [3, 6, 12];

function planNotFound(res) {
  res.status(404).json({ error: "Plan not found" });
}

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

router.post("/", async (req, res) => {
  try {
    const { interest, level, weeklyHours, durationMonths } = req.body || {};
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
    const plan = await store.create({
      interest: interest.trim(),
      level,
      weeklyHours: hours,
      durationMonths: Number(durationMonths),
    });
    res.status(201).json(toResponse(plan));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const plans = await store.getAll();
    res.json(plans.map(toResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

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

router.delete("/:id", async (req, res) => {
  try {
    const removed = await store.remove(req.params.id);
    if (!removed) {
      planNotFound(res);
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/generate", async (req, res) => {
  try {
    const plan = await store.getById(req.params.id);
    if (!plan) {
      planNotFound(res);
      return;
    }
    const learningPlan = await generateLearningPlan({
      interest: plan.interest,
      level: plan.level,
      weeklyHours: plan.weeklyHours,
      durationMonths: plan.durationMonths,
    });
    const updated = await store.update(plan.id, { learningPlan });
    res.json(toResponse(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
