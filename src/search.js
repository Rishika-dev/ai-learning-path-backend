// ─── Serper Search Integration ───────────────────────────────────────────────
// Calls the Serper.dev API (a Google Search wrapper) to find real learning
// resources for a given topic and skill level.
//
// This is the "Retrieval" step in our RAG-lite (Retrieval-Augmented Generation)
// pipeline. Instead of letting the AI hallucinate URLs, we fetch real ones
// from Google and feed them into the prompt so the AI can only reference
// verified links.
//
// Key design decision: this module NEVER throws. If the search fails for any
// reason (bad API key, network error, rate limit), it logs the error and
// returns an empty array. The AI generation continues without curated links.
// Non-critical services should fail gracefully, not crash your app.

const axios = require("axios");
const config = require("./config.js");

const SERPER_URL = "https://google.serper.dev/search";

async function fetchLearningLinks(interest, level) {
  // Build a search query biased toward free learning content.
  // Adding "free", "tutorial", "course", "learn" pushes Google toward
  // educational resources rather than commercial products.
  const query = `free ${interest} ${level.toLowerCase()} tutorial course learn`;

  let results = [];
  try {
    const res = await axios.post(
      SERPER_URL,
      { q: query, num: 10 },
      {
        headers: {
          // Serper uses X-Api-Key header for authentication (not Bearer token).
          "X-Api-Key": config.serperApiKey,
          "Content-Type": "application/json",
        },
        // By default, axios throws an error for non-2xx status codes (4xx, 5xx).
        // validateStatus: () => true tells axios to NEVER throw on any status.
        // We handle status codes ourselves in the if-block below.
        // This prevents unhandled promise rejections from crashing the server.
        validateStatus: () => true,
      },
    );

    // Only process successful responses that contain organic search results.
    if (res.status === 200 && res.data?.organic) {
      results = res.data.organic
        .filter((o) => o.link) // skip results without a URL
        .slice(0, 10) // cap at 10 results
        .map((o) => ({ link: o.link, title: o.title || "Resource" }));
    }
  } catch (err) {
    // Network errors (DNS failure, timeout, etc.) are caught here.
    // We log and return [] -- the AI will generate without curated links.
    console.log("[Serper] Error:", err.message);
  }

  // ─── Deduplicate Results ────────────────────────────────────────────────
  // Google sometimes returns the same URL multiple times (e.g. mobile vs
  // desktop versions). We use a Set to track seen URLs (lowercased for
  // case-insensitive comparison) and filter out duplicates.
  // Also filters out non-HTTP links (e.g., javascript: or data: URIs).
  const seen = new Set();
  return results.filter((r) => {
    const url = (r.link || "").toLowerCase();
    if (!url.startsWith("http") || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

module.exports = { fetchLearningLinks };
