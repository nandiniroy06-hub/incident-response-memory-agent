const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  if (!apiKey || !model) {
    throw new Error("Groq is not configured. Set GROQ_API_KEY and GROQ_MODEL in Vercel Environment Variables.");
  }
  return { apiKey, model };
}

export async function analyzeWithGroq(incident, memories) {
  const { apiKey, model } = getGroqConfig();
  const memoryText = memories.length
    ? memories.map((m, i) => [
        "MEMORY " + (i + 1),
        "Fact: " + m.text,
        m.source ? "Original retained incident: " + m.source : "",
        "Type: " + m.type,
        "Context: " + m.context
      ].filter(Boolean).join("\n")).join("\n\n")
    : "No Hindsight memories were recalled.";

  const system = [
    "You are an incident response assistant for software and DevOps engineers.",
    "Use the supplied Hindsight memories as historical context, not as proof of the current root cause.",
    "Clearly distinguish current observations from historical facts.",
    "If historical incidents are present, explain how they change the investigation order.",
    "Never state that a historical root cause is definitely the current root cause.",
    "Return ONLY valid JSON with keys: situationAnalysis (string), investigationAreas (array of strings), nextSteps (array of strings), historicalContext (string)."
  ].join(" ");

  const user = [
    "CURRENT INCIDENT",
    "Title: " + incident.title,
    "Service: " + incident.service,
    "Description: " + incident.description,
    "",
    "RECALLED HINDSIGHT MEMORIES",
    memoryText,
    "",
    "Analyze the incident and recommend a practical investigation sequence."
  ].join("\n");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!response.ok) {
    const detail = data?.error?.message || data?.message || response.statusText;
    throw new Error("Groq API " + response.status + ": " + detail);
  }

  const content = data?.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    return {
      model,
      situationAnalysis: String(parsed.situationAnalysis || ""),
      investigationAreas: Array.isArray(parsed.investigationAreas) ? parsed.investigationAreas.map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
      historicalContext: String(parsed.historicalContext || "")
    };
  } catch {
    return {
      model,
      situationAnalysis: content || "Groq returned no analysis.",
      investigationAreas: [],
      nextSteps: [],
      historicalContext: memories.length ? "Historical Hindsight memories were supplied to the model." : "No historical Hindsight memory was available."
    };
  }
}
