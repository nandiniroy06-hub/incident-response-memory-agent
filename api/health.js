export default async function (req, res) {
  res.status(200).json({ status: "healthy", service: "incident-response-memory-agent" });
}
