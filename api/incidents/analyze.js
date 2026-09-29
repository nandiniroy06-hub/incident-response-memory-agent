import { recallIncident, normalizeRecall } from "../../lib/hindsight.js";
import { analyzeWithGroq } from "../../lib/groq.js";

export default async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const body = req.body || {};
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const service = String(body.service || "").trim();

  if (!title || !description || !service) {
    return res.status(400).json({ error: "Title, service, and incident description are required." });
  }

  try {
    const recalled = await recallIncident({ title, description, service });
    const memories = normalizeRecall(recalled);
    const analysis = await analyzeWithGroq({ title, description, service }, memories);
    return res.status(200).json({
      currentIncident: { title, description, service },
      recalledMemories: memories,
      memoryCount: memories.length,
      aiAnalysis: analysis,
      memorySource: "Hindsight Cloud"
    });
  } catch (error) {
    return res.status(502).json({
      error: error?.message || "Incident analysis integration failed.",
      integration: error?.message?.includes("Hindsight") || error?.message?.includes("HINDSIGHT") ? "Hindsight Cloud" : "Groq"
    });
  }
}
