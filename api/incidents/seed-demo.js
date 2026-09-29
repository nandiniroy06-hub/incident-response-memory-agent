import { retainIncident } from "../../lib/hindsight.js";

const demo = {
  title: "Payment API returning 503 after deployment",
  service: "Payment API",
  description: "The payment service started returning HTTP 503 errors immediately after the latest deployment. Health checks are failing and payment requests are timing out.",
  rootCause: "The deployment contained an incorrect PAYMENT_DB_URL environment variable.",
  resolution: "Restored the correct PAYMENT_DB_URL configuration and redeployed the payment service.",
  outcome: "Payment API returned to normal operation."
};

export default async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const result = await retainIncident(demo, "synthetic-demo");
    return res.status(200).json({ success: true, synthetic: true, message: "Synthetic demo incident retained in Hindsight.", incident: demo, retention: result });
  } catch (error) {
    return res.status(502).json({ error: error?.message || "Demo seeding failed.", integration: "Hindsight Cloud" });
  }
}
