// ─── AI Integration (Google Gemini) ─────────────────────────────────────────
// This module ties together the entire AI pipeline:
//   1. Search for real learning resources (Serper)
//   2. Build a carefully crafted prompt (prompt.js)
//   3. Call Google Gemini to generate a personalized learning plan
//   4. Return the generated markdown text
//
// This is a simplified RAG (Retrieval-Augmented Generation) pattern:
//   - "Retrieval" = fetching real links from Google via Serper
//   - "Augmented" = injecting those links into the prompt
//   - "Generation" = Gemini produces the final output
// Unlike full RAG (which uses vector databases), we use live web search.

const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("./config.js");
const { buildPrompt } = require("./prompt.js");
const { fetchLearningLinks } = require("./search.js");

// ─── System Instruction ─────────────────────────────────────────────────────
// A system instruction is persistent context that shapes the AI's behavior
// across all requests. Think of it as a "job description" for the model.
// It differs from the user prompt:
//   - System instruction: WHO the AI is and HOW it should behave (set once)
//   - User prompt: WHAT to do right now (changes per request)
//
// Our system instruction enforces two key rules:
//   1. Respond in markdown format
//   2. Never invent URLs -- only use links from the provided list
const SYSTEM_INSTRUCTION =
  "You are a helpful learning plan designer. Respond in markdown. You MUST only output links from the allowed list given in the user message. Never invent or guess URLs—every link must be exactly from the list.";

async function generateLearningPlan(plan) {
  // Step 1: Retrieve relevant learning links from Google via Serper.
  // .catch(() => []) ensures that if the search fails, we proceed with
  // an empty array instead of aborting the entire generation.
  const searchLinks = await fetchLearningLinks(plan.interest, plan.level).catch(
    () => [],
  );

  // Step 2: Initialize the Gemini SDK and configure the model.
  // GoogleGenerativeAI is the SDK's entry point -- takes your API key.
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  // getGenerativeModel() configures which model to use and sets the
  // system instruction. The model name "gemini-3-flash-preview" refers
  // to a fast, cost-effective variant of Gemini.
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // Step 3: Build the prompt and call Gemini.
  // generateContent() sends the prompt to Gemini and returns the response.
  // The prompt includes the user's plan details + curated links from search.
  const result = await model.generateContent(buildPrompt(plan, searchLinks));

  // Step 4: Extract the text from the response.
  // Optional chaining (?.) safely accesses nested properties -- if any part
  // is null/undefined, it short-circuits to undefined instead of throwing.
  const text = result.response?.text()?.trim();

  // Defensive check: if Gemini returned nothing, throw so the route handler
  // catches it and returns a 500 to the client.
  if (!text) throw new Error("Gemini returned empty content");

  return text;
}

module.exports = { generateLearningPlan };
