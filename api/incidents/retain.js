import { retainIncident } from "../../lib/hindsight.js";

export default async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const body = req.body || {};
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const service = String(body.service || "").trim();
  const rootCause = String(body.rootCause || "").trim();
  const resolution = String(body.resolution || "").trim();
  const outcome = String(body.outcome || "").trim();

  if (!title || !description || !rootCause || !resolution || !outcome) {
    return res.status(400).json({ error: "Title, description, root cause, resolution, and outcome are required." });
  }

  try {
    const result = await retainIncident({ title, description, service, rootCause, resolution, outcome }, "incident-response-ui");
    return res.status(200).json({ success: true, message: "Incident experience retained in Hindsight.", memorySource: "Hindsight Cloud", retention: result });
  } catch (error) {
    return res.status(502).json({ error: error?.message || "Incident retention failed.", integration: "Hindsight Cloud" });
  }
}
