const fs = require("fs").promises;
const path = require("path");
const { randomUUID } = require("crypto");
const config = require("./config.js");

async function ensureDataDir() {
  const dir = path.dirname(config.dataFile);
  await fs.mkdir(dir, { recursive: true });
}

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

async function writePlans(plans) {
  await ensureDataDir();
  await fs.writeFile(config.dataFile, JSON.stringify(plans, null, 2), "utf8");
}

async function getAll() {
  const plans = await readPlans();
  return plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getById(id) {
  const plans = await readPlans();
  return plans.find((p) => p.id === id) || null;
}

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

async function update(id, updates) {
  const plans = await readPlans();
  const i = plans.findIndex((p) => p.id === id);
  if (i === -1) return null;
  plans[i] = { ...plans[i], ...updates };
  await writePlans(plans);
  return plans[i];
}

async function remove(id) {
  const plans = await readPlans();
  const i = plans.findIndex((p) => p.id === id);
  if (i === -1) return null;
  const removed = plans.splice(i, 1)[0];
  await writePlans(plans);
  return removed;
}

module.exports = { getAll, getById, create, update, remove };
