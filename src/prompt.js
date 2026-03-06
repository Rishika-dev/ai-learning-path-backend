// ─── Prompt Builder ─────────────────────────────────────────────────────────
// Constructs the user-facing prompt that gets sent to Google Gemini.
//
// Prompt engineering is the art of writing instructions for an AI model
// to get the output you want. Key principles applied here:
//   1. Be specific -- state the exact task (write a learning plan)
//   2. Provide context -- learner's interest, level, available time
//   3. Constrain output -- specify format (markdown), length (week-by-week)
//   4. Set boundaries -- "free resources only", "use only these URLs"

// Maps duration numbers to human-readable labels for the prompt.
// The AI understands "3-month" better than the number 3.
const DURATION_LABEL = { 3: "3-month", 6: "6-month", 12: "1-year" };

function buildPrompt(plan, searchLinks) {
  const durationLabel = DURATION_LABEL[plan.durationMonths] || "3-month";

  // ─── Links Section (RAG-lite) ───────────────────────────────────────────
  // If we got search results from Serper, we inject them into the prompt
  // and tell the AI to ONLY use those URLs. This prevents hallucinated links
  // (a common LLM problem -- models confidently make up URLs that don't exist).
  //
  // If search failed or returned nothing, we fall back to letting the AI
  // suggest resources on its own (less reliable but still useful).
  let linksSection;
  if (searchLinks && searchLinks.length > 0) {
    linksSection = `Only use these URLs (copy exactly):\n${searchLinks.map((s) => `- [${s.title}](${s.link})`).join("\n")}`;
  } else {
    linksSection = "Suggest free resources where appropriate.";
  }

  // ─── Final Prompt ───────────────────────────────────────────────────────
  // Template literal (backtick string) lets us embed variables with ${}.
  // The prompt tells the AI:
  //   - What to write (learning plan)
  //   - Duration and time commitment
  //   - Learner's interest and level
  //   - Which URLs to use (or to suggest its own)
  //   - Output format (markdown, week-by-week)
  //   - Extras (add projects, free resources only)
  return `Write a ${durationLabel} learning plan for someone interested in ${plan.interest}. They're ${plan.level} and have ${plan.weeklyHours} hours per week.

${linksSection}
Use markdown. Week-by-week is fine. Add a small project or two. Free resources only.`;
}

module.exports = { buildPrompt };
