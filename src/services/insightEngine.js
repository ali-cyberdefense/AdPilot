// AdPilot — Insight Engine
// 10 hardcoded PPC insight rules. Do NOT change thresholds without asking Ali.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupBy(arr, key) {
  return arr.reduce((acc, row) => {
    const k = String(row[key] ?? 'Unknown')
    if (!acc[k]) acc[k] = []
    acc[k].push(row)
    return acc
  }, {})
}

function sum(arr, field) {
  return arr.reduce((s, r) => s + (Number(r[field]) || 0), 0)
}

const pct  = (n) => n != null ? `${(n * 100).toFixed(1)}%` : '—'
const usd  = (n) => n != null ? `$${Number(n).toFixed(2)}` : '—'

// ─── Aggregation Builders ─────────────────────────────────────────────────────

export function buildTacticBreakdown(strData) {
  const totalSpend = sum(strData, 'spend')
  return Object.entries(groupBy(strData, 'tactic_label'))
    .map(([tactic, rows]) => {
      const spend  = sum(rows, 'spend')
      const sales  = sum(rows, 'sales')
      const orders = sum(rows, 'orders')
      const clicks = sum(rows, 'clicks')
      return {
        tactic,
        spend,
        sales,
        orders,
        clicks,
        acos:       sales  > 0 ? spend / sales   : null,
        roas:       spend  > 0 ? sales / spend    : null,
        cvr:        clicks > 0 ? orders / clicks  : null,
        cpc:        clicks > 0 ? spend / clicks   : null,
        spendShare: totalSpend > 0 ? spend / totalSpend : 0,
      }
    })
    .sort((a, b) => b.spend - a.spend)
}

export function buildPlacementBreakdown(placementData) {
  return Object.entries(groupBy(placementData, 'placement'))
    .map(([placement, rows]) => {
      const spend  = sum(rows, 'spend')
      const sales  = sum(rows, 'sales')
      const clicks = sum(rows, 'clicks')
      const orders = sum(rows, 'orders')
      return {
        placement,
        spend,
        sales,
        clicks,
        orders,
        impressions: sum(rows, 'impressions'),
        cpc:  clicks > 0 ? spend  / clicks : null,
        cvr:  clicks > 0 ? orders / clicks : null,
        acos: sales  > 0 ? spend  / sales  : null,
      }
    })
    .sort((a, b) => b.spend - a.spend)
}

export function buildAsinBreakdown(productData) {
  const totalSpend = sum(productData, 'spend')
  return Object.entries(groupBy(productData, 'advertised_asin'))
    .map(([asin, rows]) => {
      const spend  = sum(rows, 'spend')
      const sales  = sum(rows, 'sales')
      const orders = sum(rows, 'orders')
      return {
        asin,
        sku:        rows[0]?.advertised_sku || '',
        spend,
        sales,
        orders,
        acos:       sales > 0 ? spend / sales : null,
        spendShare: totalSpend > 0 ? spend / totalSpend : 0,
      }
    })
    .sort((a, b) => b.spend - a.spend)
}

function getHarvestingCandidates(strData) {
  const exactTargets = new Set(
    strData
      .filter(r => r.match_type_parsed === 'Exact')
      .map(r => r.targeting?.toLowerCase().trim())
      .filter(Boolean)
  )
  return strData
    .filter(r =>
      (r.tactic_label === 'Auto Discovery' ||
       r.match_type_parsed === 'Broad' ||
       r.match_type_parsed === 'Phrase') &&
      (r.orders || 0) >= 1 &&
      !exactTargets.has(r.search_term?.toLowerCase().trim())
    )
    .sort((a, b) => (b.orders || 0) - (a.orders || 0))
}

// ─── Rule 1 — Tactic Spend Imbalance ─────────────────────────────────────────
// Critical if any tactic ACOS exceeds target by >10 points

function rule1(strData, targetAcos) {
  const tactics = buildTacticBreakdown(strData)
  const over = tactics.filter(t => t.acos !== null && (t.acos - targetAcos) > 0.10)
  if (!over.length) return null

  const worst    = over[0]
  const pts      = Math.round((worst.acos - targetAcos) * 100)
  const spendPct = Math.round(worst.spendShare * 100)

  return {
    insight_type: 'tactic_spend_imbalance',
    severity:     'critical',
    title:        `${worst.tactic} overspending — ${pts}pts above target`,
    description:  `${worst.tactic} is consuming ${spendPct}% of spend at ${pct(worst.acos)} ACOS — ${pts} points above your ${pct(targetAcos)} target. Reduce bids or pause zero-order terms in this tactic.`,
    data: { tactic: worst.tactic, acos: worst.acos, targetAcos, pointsOver: pts, spendShare: worst.spendShare, spend: worst.spend, allOver: over.map(t => ({ tactic: t.tactic, acos: t.acos, spend: t.spend })) },
  }
}

// ─── Rule 2 — Tactic Scaling Opportunity ─────────────────────────────────────
// Opportunity if any tactic ACOS is >3 points below target

function rule2(strData, targetAcos) {
  const tactics = buildTacticBreakdown(strData)
  const opps = tactics.filter(t => t.acos !== null && t.spend > 10 && (targetAcos - t.acos) > 0.03)
  if (!opps.length) return null

  const best      = opps.sort((a, b) => a.acos - b.acos)[0]
  const headroom  = Math.round((targetAcos - best.acos) * 100)

  return {
    insight_type: 'tactic_scaling_opportunity',
    severity:     'opportunity',
    title:        `${best.tactic} has ${headroom}pts of ACOS headroom`,
    description:  `${best.tactic} is running at ${pct(best.acos)} ACOS — ${headroom} points below your ${pct(targetAcos)} target. Scale bids +10–15% to capture more volume without breaching your target.`,
    data: { tactic: best.tactic, acos: best.acos, targetAcos, headroom, spend: best.spend, sales: best.sales, allOpps: opps.map(t => ({ tactic: t.tactic, acos: t.acos, headroom: Math.round((targetAcos - t.acos) * 100) })) },
  }
}

// ─── Rule 3 — Harvesting Candidates ──────────────────────────────────────────

function rule3(strData) {
  const candidates = getHarvestingCandidates(strData)
  if (!candidates.length) return null

  const totalOrders = sum(candidates, 'orders')

  return {
    insight_type: 'harvesting_candidates',
    severity:     'opportunity',
    title:        `${candidates.length} search terms ready to harvest into Exact`,
    description:  `${candidates.length} search terms in Auto/Broad/Phrase have generated ${totalOrders} orders but aren't targeted as Exact match. Graduating these gives you more bid control and efficiency.`,
    data: { count: candidates.length, totalOrders, top: candidates.slice(0, 10).map(r => ({ search_term: r.search_term, orders: r.orders, acos: r.acos, spend: r.spend, tactic: r.tactic_label })) },
  }
}

// ─── Rule 4 — Negation Candidates ────────────────────────────────────────────
// [ALI TO REVIEW] Threshold: $5 spend with 0 orders. Adjust if avg CPC differs.

function rule4(strData) {
  const THRESHOLD = 5 // dollars — update if needed
  const candidates = strData.filter(r => (r.orders || 0) === 0 && (r.spend || 0) >= THRESHOLD)
  if (!candidates.length) return null

  const totalWasted = sum(candidates, 'spend')

  return {
    insight_type: 'negation_candidates',
    severity:     'warning',
    title:        `${candidates.length} terms with ${usd(totalWasted)} spend and 0 orders`,
    description:  `${candidates.length} search terms have spent ${usd(totalWasted)} with zero orders (threshold: ${usd(THRESHOLD)} per term). Adding these as negative keywords stops budget bleed.`,
    data: { count: candidates.length, totalWasted, threshold: THRESHOLD, top: candidates.sort((a, b) => b.spend - a.spend).slice(0, 10).map(r => ({ search_term: r.search_term, spend: r.spend, clicks: r.clicks, campaign: r.campaign_name })) },
  }
}

// ─── Rule 5 — Placement Performance Split ────────────────────────────────────

function rule5(placementData, targetAcos) {
  const breakdown = buildPlacementBreakdown(placementData)
  const tos = breakdown.find(p => /top of search/i.test(p.placement))
  const pp  = breakdown.find(p => /detail page|product page/i.test(p.placement))
  if (!tos || !pp) return null

  const tosCvr = tos.cvr || 0
  const ppCvr  = pp.cvr  || 0

  if (tosCvr > 0 && ppCvr > 0 && tosCvr >= ppCvr * 2) {
    const mult = (tosCvr / ppCvr).toFixed(1)
    return {
      insight_type: 'placement_performance_split',
      severity:     'opportunity',
      title:        `Top of Search converts ${mult}× better than Product Pages`,
      description:  `TOS CVR is ${pct(tosCvr)} vs Product Pages ${pct(ppCvr)}. Your TOS bid modifier may be underweighted — increasing it could capture more high-intent shoppers efficiently.`,
      data: { tos: { cvr: tosCvr, acos: tos.acos, spend: tos.spend, cpc: tos.cpc }, pp: { cvr: ppCvr, acos: pp.acos, spend: pp.spend, cpc: pp.cpc } },
    }
  }

  if (tos.acos && tos.acos > targetAcos * 0.95 && tos.cpc && pp.cpc && tos.cpc > pp.cpc * 2) {
    const cpcMult = (tos.cpc / pp.cpc).toFixed(1)
    return {
      insight_type: 'placement_performance_split',
      severity:     'warning',
      title:        `TOS CPC is ${cpcMult}× higher than Product Pages with ACOS near ceiling`,
      description:  `Top of Search CPC (${usd(tos.cpc)}) is ${cpcMult}× Product Pages (${usd(pp.cpc)}) while TOS ACOS (${pct(tos.acos)}) is near your target. Consider reducing the TOS modifier to recover margin.`,
      data: { tos: { cpc: tos.cpc, acos: tos.acos, spend: tos.spend }, pp: { cpc: pp.cpc, acos: pp.acos } },
    }
  }

  return null
}

// ─── Rule 6 — Wasted Spend Alert ─────────────────────────────────────────────

function rule6(strData) {
  const wasted     = strData.filter(r => (r.orders || 0) === 0 && (r.spend || 0) > 0)
  if (!wasted.length) return null

  const totalWasted = sum(wasted, 'spend')
  const totalSpend  = sum(strData,  'spend')
  const wastedPct   = totalSpend > 0 ? totalWasted / totalSpend : 0

  return {
    insight_type: 'wasted_spend',
    severity:     wastedPct > 0.20 ? 'critical' : 'warning',
    title:        `${usd(totalWasted)} wasted on ${wasted.length} zero-order terms (${Math.round(wastedPct * 100)}% of spend)`,
    description:  `${wasted.length} search terms generated zero orders while consuming ${usd(totalWasted)} — ${Math.round(wastedPct * 100)}% of total spend. This is your negation opportunity pool.`,
    data: { count: wasted.length, totalWasted, wastedPct, top5: wasted.sort((a, b) => b.spend - a.spend).slice(0, 5).map(r => ({ search_term: r.search_term, spend: r.spend, clicks: r.clicks })) },
  }
}

// ─── Rule 7 — Top Performer Spotlight ────────────────────────────────────────

function rule7(strData, targetAcos) {
  const performers = strData
    .filter(r => (r.orders || 0) > 0 && r.acos !== null && r.acos < targetAcos)
    .sort((a, b) => (b.orders || 0) - (a.orders || 0))
    .slice(0, 5)

  if (!performers.length) return null

  const totalOrders = sum(strData,     'orders')
  const perfOrders  = sum(performers,  'orders')
  const perfSpend   = sum(performers,  'spend')
  const perfSales   = sum(performers,  'sales')
  const perfAcos    = perfSales > 0 ? perfSpend / perfSales : null
  const orderShare  = totalOrders > 0 ? perfOrders / totalOrders : 0

  return {
    insight_type: 'top_performers',
    severity:     'opportunity',
    title:        `Top 5 keywords drive ${Math.round(orderShare * 100)}% of orders at ${pct(perfAcos)} ACOS`,
    description:  `Your top 5 converting search terms account for ${perfOrders} orders at ${pct(perfAcos)} ACOS — well below your ${pct(targetAcos)} target. These are your scaling candidates.`,
    data: { performers: performers.map(r => ({ search_term: r.search_term, orders: r.orders, acos: r.acos, spend: r.spend, sales: r.sales, cvr: r.cvr })), orderShare, avgAcos: perfAcos },
  }
}

// ─── Rule 8 — ASIN Dependency Analysis ───────────────────────────────────────

function rule8(productData) {
  const asins = buildAsinBreakdown(productData)
  if (!asins.length) return null

  const top = asins[0]
  if (top.spendShare <= 0.50) return null

  return {
    insight_type: 'asin_dependency',
    severity:     'warning',
    title:        `${top.asin} absorbs ${Math.round(top.spendShare * 100)}% of total ad spend`,
    description:  `ASIN ${top.asin} (SKU: ${top.sku}) accounts for ${Math.round(top.spendShare * 100)}% of spend. A suppression or listing issue on this ASIN would severely impact your advertising performance.`,
    data: { asin: top.asin, sku: top.sku, spend: top.spend, spendShare: top.spendShare, acos: top.acos, top5: asins.slice(0, 5) },
  }
}

// ─── Rule 9 — Low CTR Campaigns ──────────────────────────────────────────────

function rule9(strData) {
  const lowCtr = Object.entries(groupBy(strData, 'campaign_name'))
    .map(([campaign, rows]) => {
      const impressions = sum(rows, 'impressions')
      const clicks      = sum(rows, 'clicks')
      const ctr         = impressions > 0 ? clicks / impressions : null
      return { campaign, impressions, clicks, ctr }
    })
    .filter(c => c.impressions >= 1000 && c.ctr !== null && c.ctr < 0.002)
    .sort((a, b) => b.impressions - a.impressions)

  if (!lowCtr.length) return null

  const totalImpressions = sum(lowCtr, 'impressions')

  return {
    insight_type: 'low_ctr_campaigns',
    severity:     'warning',
    title:        `${lowCtr.length} campaigns with CTR below 0.2% (${totalImpressions.toLocaleString()} impressions)`,
    description:  `${lowCtr.length} campaigns have CTR below 0.2% with significant impression volume. Low CTR hurts ad rank — review targeting relevance, listing images, and ad copy.`,
    data: { count: lowCtr.length, totalImpressions, top: lowCtr.slice(0, 5) },
  }
}

// ─── Rule 10 — Bidding Strategy Mismatch ─────────────────────────────────────

function rule10(placementData) {
  const upDown = placementData.filter(r => /up and down/i.test(r.bidding_strategy || ''))
  if (!upDown.length) return null

  const byCampaign = groupBy(upDown, 'campaign_name')
  const mismatches = Object.entries(byCampaign)
    .map(([campaign, rows]) => {
      const pp = rows.find(r => /detail page|product page/i.test(r.placement))
      if (!pp) return null
      const ppCvr     = (pp.clicks || 0) > 0 ? (pp.orders || 0) / pp.clicks : 0
      const ppSpend   = pp.spend || 0
      return { campaign, ppCvr, ppSpend, biddingStrategy: rows[0]?.bidding_strategy }
    })
    .filter(c => c !== null && c.ppCvr === 0 && c.ppSpend > 10)

  if (!mismatches.length) return null

  return {
    insight_type: 'bidding_strategy_mismatch',
    severity:     'warning',
    title:        `${mismatches.length} "dynamic up/down" campaigns with 0% Product Pages CVR`,
    description:  `${mismatches.length} campaigns use Dynamic Bids (up & down) but show 0% conversion on Product Pages. Switching to "down only" prevents Amazon from inflating bids on non-converting placements.`,
    data: { count: mismatches.length, campaigns: mismatches.slice(0, 5).map(m => ({ campaign: m.campaign, ppSpend: m.ppSpend })) },
  }
}

// ─── Main Entry Points ────────────────────────────────────────────────────────

export function generateInsights(strData, placementData, productData, targetAcos) {
  const rules = [
    rule1(strData, targetAcos),
    rule2(strData, targetAcos),
    rule3(strData),
    rule4(strData),
    rule5(placementData, targetAcos),
    rule6(strData),
    rule7(strData, targetAcos),
    rule8(productData),
    rule9(strData),
    rule10(placementData),
  ]
  return rules.filter(Boolean)
}

export function buildStructuredSummary(strData, placementData, productData, insights, targetAcos) {
  const totalSpend   = sum(strData, 'spend')
  const totalSales   = sum(strData, 'sales')
  const totalOrders  = sum(strData, 'orders')
  const totalClicks  = sum(strData, 'clicks')

  return {
    overview: {
      totalSpend,
      totalSales,
      totalOrders,
      totalClicks,
      overallAcos:  totalSales  > 0 ? totalSpend / totalSales   : null,
      overallRoas:  totalSpend  > 0 ? totalSales / totalSpend   : null,
      overallCvr:   totalClicks > 0 ? totalOrders / totalClicks : null,
      targetAcos,
    },
    tactic_breakdown:    buildTacticBreakdown(strData),
    placement_breakdown: buildPlacementBreakdown(placementData),
    asin_performance:    buildAsinBreakdown(productData).slice(0, 10),
    top_search_terms:    [...strData]
      .filter(r => (r.spend || 0) > 0)
      .sort((a, b) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 20)
      .map(r => ({ search_term: r.search_term, spend: r.spend, sales: r.sales, orders: r.orders, acos: r.acos, clicks: r.clicks, cvr: r.cvr, tactic: r.tactic_label })),
    harvesting_candidates: getHarvestingCandidates(strData)
      .slice(0, 20)
      .map(r => ({ search_term: r.search_term, orders: r.orders, acos: r.acos, spend: r.spend })),
    negation_candidates: strData
      .filter(r => (r.orders || 0) === 0 && (r.spend || 0) >= 5)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 20)
      .map(r => ({ search_term: r.search_term, spend: r.spend, clicks: r.clicks })),
    generated_insights: insights,
  }
}
