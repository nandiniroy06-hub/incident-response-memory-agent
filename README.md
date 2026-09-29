# Incident Response Memory Agent

AI-assisted production incident investigation using persistent Hindsight Cloud memory and Groq.

## Architecture

- Frontend: React
- Backend: Vercel serverless functions
- Persistent memory: Hindsight Cloud
- AI analysis: Groq
- No local incident database
- API keys stay server-side in environment variables

## Environment variables

Set these in Vercel Project Settings → Environment Variables:

- `HINDSIGHT_API_KEY`
- `HINDSIGHT_BANK_ID` (default: `incident-response-demo`)
- `GROQ_API_KEY`
- `GROQ_MODEL` (default: `openai/gpt-oss-20b`)

Never commit real API keys.

## Run locally

```bash
npm install
vercel dev
```

The app is available at the local URL shown by Vercel.

## Deploy

Push this folder to GitHub, import the repository into Vercel, then add the four environment variables.

The production URL will be a Vercel URL such as:

`https://incident-response-memory-agent.vercel.app`

## API

- `GET /api/health`
- `POST /api/incidents/analyze`
- `POST /api/incidents/retain`
- `POST /api/incidents/seed-demo`
