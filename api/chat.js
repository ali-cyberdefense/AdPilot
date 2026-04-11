// AdPilot — Vercel Serverless Function: /api/chat
// OpenAI is called here — never from the browser.
// Checkpoint 7 will implement full logic — stub for now.

export default function handler(req, res) {
  res.status(501).json({ error: 'Chat API not yet implemented' })
}
