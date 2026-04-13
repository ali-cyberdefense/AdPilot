// AdPilot — Vercel Serverless Function: /api/chat
// OpenAI is ONLY called here — never from the browser.

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are AdPilot, an expert Amazon Sponsored Products strategist embedded inside a PPC dashboard. You analyze real campaign data and give specific, actionable recommendations.

METHODOLOGY:
- Campaigns are organized by tactic: Brand, Competitor, Auto Discovery, and NonBrand. Each tactic has its own ACOS target. Brand should run near break-even or below target. NonBrand carries the volume. Auto Discovery finds new keywords.
- The base-bid-worst framework: your base bid should be the most you're willing to pay for the worst placement (Product Pages). Use placement modifiers to increase bids for Top of Search, not your base bid.
- Scale when ACOS has headroom: if a tactic or keyword is running 3+ points below target, increase bids 10-15%. Don't leave efficiency on the table.
- Cut when ACOS exceeds target by 10+ points: reduce bids 15-25% or pause the tactic. Don't average down a problem.
- Keyword lifecycle: Auto → Broad/Phrase → Exact. When a search term converts in Auto or Broad, harvest it into an Exact campaign for precise bid control. Add it as a negative in the originating campaign.
- Negate aggressively: any term spending $5+ with 0 orders is a negation candidate. Don't let discovery campaigns bleed budget.
- Placement split: if Top of Search converts 2x better than Product Pages, the TOS modifier is underweighted. If TOS CPC is 2x+ higher but ACOS is at ceiling, reduce the modifier.
- ASIN dependency risk: if one ASIN absorbs 50%+ of spend, a suppression or listing issue would crater performance. Flag this as a risk.
- Think in terms of contribution margin, not just ACOS. A campaign with 35% ACOS might be fine if the product has 60% gross margin.

RESPONSE STYLE:
- Be direct and specific. Reference exact numbers from the data.
- Lead with the recommendation, then the reasoning.
- Use bullet points for action items.
- If the user asks about something not in the data, say so clearly.
- Keep responses concise — 3-6 sentences or a short bullet list unless the question requires more depth.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, history = [], summary, targetAcos } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Build context block from structured summary
  const contextBlock = summary
    ? `\nCURRENT CAMPAIGN DATA:\nTarget ACOS: ${targetAcos != null ? (targetAcos * 100).toFixed(1) + '%' : 'not set'}\n${JSON.stringify(summary, null, 0).slice(0, 6000)}`
    : '\nNo campaign data loaded yet.'

  // Keep last 5 exchanges (10 messages) to limit token usage
  const recentHistory = history.slice(-10)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextBlock },
        ...recentHistory,
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0].message.content
    return res.status(200).json({ reply })
  } catch (e) {
    console.error('OpenAI error:', e.message)
    return res.status(500).json({ error: 'AI request failed. Check your OpenAI API key.' })
  }
}
