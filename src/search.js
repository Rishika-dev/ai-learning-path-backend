const axios = require("axios");
const config = require("./config.js");

const SERPER_URL = "https://google.serper.dev/search";

async function fetchLearningLinks(interest, level) {
  const query = `free ${interest} ${level.toLowerCase()} tutorial course learn`;
  let results = [];
  try {
    const res = await axios.post(
      SERPER_URL,
      { q: query, num: 10 },
      {
        headers: {
          "X-Api-Key": config.serperApiKey,
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      },
    );
    if (res.status === 200 && res.data?.organic) {
      results = res.data.organic
        .filter((o) => o.link)
        .slice(0, 10)
        .map((o) => ({ link: o.link, title: o.title || "Resource" }));
    }
  } catch (err) {
    console.log("[Serper] Error:", err.message);
  }
  const seen = new Set();
  return results.filter((r) => {
    const url = (r.link || "").toLowerCase();
    if (!url.startsWith("http") || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

module.exports = { fetchLearningLinks };
