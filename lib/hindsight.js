const BASE_URL = "https://api.hindsight.vectorize.io";

function cleanBankId(value) {
  return encodeURIComponent(String(value || "").trim());
}

function getCredentials() {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  const bankId = process.env.HINDSIGHT_BANK_ID || "incident-response-demo";
  if (!apiKey || !bankId) {
    throw new Error("Hindsight is not configured. Set HINDSIGHT_API_KEY and HINDSIGHT_BANK_ID in Vercel Environment Variables.");
  }
  return { apiKey, bankId };
}

async function request(path, options = {}) {
  const { apiKey } = getCredentials();
  const response = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const detail = data?.detail || data?.message || data?.error || response.statusText;
    throw new Error("Hindsight API " + response.status + ": " + detail);
  }
  return data;
}

export async function recallIncident(incident) {
  const { bankId } = getCredentials();
  const query = [
    "Find previous production incidents relevant to this incident.",
    "Focus on service, symptoms, deployment/configuration changes, root causes, resolutions, and outcomes.",
    "Current incident:",
    "Title: " + incident.title,
    "Service: " + incident.service,
    "Description: " + incident.description
  ].join("\n");
  return request("/v1/default/banks/" + cleanBankId(bankId) + "/memories/recall", {
    method: "POST",
    body: JSON.stringify({
      query,
      budget: "mid",
      max_tokens: 5000,
      include_chunks: true,
      max_chunk_tokens: 900
    })
  });
}

export async function retainIncident(incident, source = "incident-response-ui") {
  const { bankId } = getCredentials();
  const content = [
    "Production incident experience — SYNTHETIC DEMO DATA when marked as demo.",
    "Incident title: " + incident.title,
    "Service: " + (incident.service || "unspecified"),
    "Symptoms / description: " + incident.description,
    "Root cause: " + incident.rootCause,
    "Resolution: " + incident.resolution,
    "Outcome: " + incident.outcome,
    "Operational lesson: Preserve this experience as historical incident-response knowledge. Use it as context for future recurring incidents, but never assume its root cause is the current root cause.",
    "Source: " + source
  ].join("\n");

  return request("/v1/default/banks/" + cleanBankId(bankId) + "/memories", {
    method: "POST",
    body: JSON.stringify({
      items: [{
        content,
        document_id: "incident-" + Date.now(),
        context: "DevOps incident response",
        metadata: { source, service: incident.service || "", synthetic_demo: source === "synthetic-demo" },
        tags: ["domain:incident-response", "service:" + (incident.service || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-")]
      }],
      async: false
    })
  });
}

export function normalizeRecall(data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const chunks = data?.chunks || {};
  return results.slice(0, 8).map((item, index) => {
    const chunk = chunks[item.id];
    const source = chunk?.text || "";
    return {
      id: item.id || "memory-" + index,
      text: item.text || "",
      type: item.type || "experience",
      context: item.context || "Hindsight memory",
      documentId: item.document_id || null,
      tags: item.tags || [],
      occurredStart: item.occurred_start || null,
      relevance: item.score ?? item.relevance ?? null,
      source
    };
  });
}
