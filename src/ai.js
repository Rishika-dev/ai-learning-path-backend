const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("./config.js");
const { buildPrompt } = require("./prompt.js");
const { fetchLearningLinks } = require("./search.js");

const SYSTEM_INSTRUCTION =
  "You are a helpful learning plan designer. Respond in markdown. You MUST only output links from the allowed list given in the user message. Never invent or guess URLs—every link must be exactly from the list.";

async function generateLearningPlan(plan) {
  const searchLinks = await fetchLearningLinks(plan.interest, plan.level).catch(
    () => [],
  );

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(buildPrompt(plan, searchLinks));
  const text = result.response?.text()?.trim();
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

module.exports = { generateLearningPlan };
