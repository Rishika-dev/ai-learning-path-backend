require("dotenv").config();
const env = process.env;

module.exports = {
  port: Number(env.PORT) || 4000,
  geminiApiKey: (env.GEMINI_API_KEY || "").trim(),
  serperApiKey: (env.SERPER_API_KEY || "").trim(),
  dataFile: env.DATA_FILE || "data/plans.json",
};
