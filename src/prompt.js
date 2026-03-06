const DURATION_LABEL = { 3: "3-month", 6: "6-month", 12: "1-year" };

function buildPrompt(plan, searchLinks) {
  const durationLabel = DURATION_LABEL[plan.durationMonths] || "3-month";
  let linksSection;
  if (searchLinks && searchLinks.length > 0) {
    linksSection = `Only use these URLs (copy exactly):\n${searchLinks.map((s) => `- [${s.title}](${s.link})`).join("\n")}`;
  } else {
    linksSection = "Suggest free resources where appropriate.";
  }

  return `Write a ${durationLabel} learning plan for someone interested in ${plan.interest}. They're ${plan.level} and have ${plan.weeklyHours} hours per week.

${linksSection}
Use markdown. Week-by-week is fine. Add a small project or two. Free resources only.`;
}

module.exports = { buildPrompt };
