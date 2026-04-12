// AdPilot — Report Parser
// Handles Search Term Report, Placement Report, Advertised Products Report
// Do NOT change thresholds or detection patterns without consulting Ali.

import * as XLSX from 'xlsx'

// ─── Campaign Name Parser ─────────────────────────────────────────────────────
// Handles all 3 naming styles found in real data:
//   Style 1 dash:  SP-EX-DO-CVR-FULL SIZE-ALL SUGGESTED
//   Style 2 spaced: SP - EX - KW - adjustable bed frame - 29.11.24
//   Style 3 pipe:  SP | Defensive | Renanim | Bundle | Queen | PAT | Exact

export function parseCampaignName(name) {
  const n = String(name || '')

  // 1. Match Type — first match wins
  let matchType = 'Unknown'
  if (/Catch\s*All|\bAUTO\b/i.test(n)) {
    matchType = 'Auto'
  } else if (/\bExact\b|\bEX\b(?!cel)/i.test(n)) {
    matchType = 'Exact'
  } else if (/\bPhrase\b|\bPHR\b|\bPH\b/i.test(n)) {
    matchType = 'Phrase'
  } else if (/\bBroad\b|\bBRD\b/i.test(n)) {
    matchType = 'Broad'
  } else if (/\bPAT\b|\bPT\b|Product\s*Targeting/i.test(n)) {
    matchType = 'Product Targeting'
  }

  // 2. Tactic
  let tactic = 'NonBrand'
  if (/BRAND\s*DEFENSE|Defensive|\bBRM\b|Renanim/i.test(n)) {
    tactic = 'Brand'
  } else if (/\bComp\b|Competitor|\bCT[-\s]|Sven.{0,5}Son/i.test(n)) {
    tactic = 'Competitor'
  } else if (matchType === 'Auto') {
    tactic = 'Auto'
  }

  // 3. Goal
  let goal = 'Performance'
  if (/\bRNK\b|Ranking|\bRank\b/i.test(n)) {
    goal = 'Ranking'
  } else if (/Research|Catch\s*All|discovery/i.test(n)) {
    goal = 'Research'
  }

  // 4. Size — order matters: check compound names before single words
  let size = 'All Sizes'
  if (/TWIN\s*XL|\bTXL\b/i.test(n))        size = 'Twin XL'
  else if (/SPLIT\s*KING/i.test(n))          size = 'Split King'
  else if (/CAL\s*KING/i.test(n))            size = 'Cal King'
  else if (/\bKING\b/i.test(n))              size = 'King'
  else if (/\bQUEEN\b/i.test(n))             size = 'Queen'
  else if (/\bFULL\b/i.test(n))              size = 'Full'

  const tacticLabel = buildTacticLabel(tactic, matchType)
  return { matchType, tactic, goal, size, tacticLabel }
}

function buildTacticLabel(tactic, matchType) {
  if (tactic === 'Auto') return 'Auto Discovery'
  if (tactic === 'Brand') {
    if (matchType === 'Auto') return 'Brand Auto'
    if (matchType === 'Exact') return 'Brand Exact'
    return `Brand ${matchType}`
  }
  if (tactic === 'Competitor') return `Competitor ${matchType === 'Product Targeting' ? 'PT' : matchType}`
  // NonBrand
  if (matchType === 'Exact') return 'NonBrand Exact'
  if (matchType === 'Phrase') return 'NonBrand Phrase'
  if (matchType === 'Broad') return 'NonBrand Broad'
  if (matchType === 'Product Targeting') return 'NonBrand PT'
  return 'NonBrand'
}

// ─── File Reader ──────────────────────────────────────────────────────────────

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        // raw: false → xlsx formats numbers/dates as strings (we handle conversion below)
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
        resolve(rows)
      } catch (err) {
        reject(new Error(`Could not read file "${file.name}": ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error(`Could not read file "${file.name}"`))
    reader.readAsArrayBuffer(file)
  })
}

// ─── Data Type Cleaners ───────────────────────────────────────────────────────

function num(val) {
  if (val == null || val === '' || val === '--' || val === '-') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const s = String(val).trim().replace(/[$,\s]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// Handles both "28.45%" strings (Amazon CSV) and 0.2845 decimals (Amazon XLSX)
function pct(val) {
  if (val == null || val === '' || val === '--' || val === '-') return null
  if (typeof val === 'string') {
    const s = val.trim()
    if (s.endsWith('%')) {
      const n = parseFloat(s)
      return isNaN(n) ? null : n / 100
    }
    const n = parseFloat(s.replace(/[$,]/g, ''))
    return isNaN(n) ? null : n
  }
  if (typeof val === 'number') return isNaN(val) ? null : val
  return null
}

function int(val) {
  const n = num(val)
  return n == null ? null : Math.round(n)
}

// ─── Column Resolver ──────────────────────────────────────────────────────────
// Matches column names case-insensitively, ignoring trailing/leading whitespace.
// Tries each candidate in order — first match wins.

function col(row, ...candidates) {
  for (const name of candidates) {
    const target = name.trim().toLowerCase()
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
    if (key !== undefined) return row[key]
  }
  return null
}

function validateColumns(rows, required, reportName) {
  if (!rows || rows.length === 0) {
    throw new Error(`${reportName}: file appears to be empty`)
  }
  const headers = Object.keys(rows[0]).map(h => h.trim().toLowerCase())
  const missing = required.filter(r => !headers.includes(r.trim().toLowerCase()))
  if (missing.length > 0) {
    throw new Error(
      `${reportName}: missing required columns — ${missing.join(', ')}.\n` +
      `Make sure you uploaded the correct file for this slot.`
    )
  }
}

// ─── Search Term Report ───────────────────────────────────────────────────────

const STR_REQUIRED = ['Campaign Name', 'Customer Search Term', 'Impressions', 'Clicks', 'Spend']

export async function parseSearchTermReport(file) {
  const rows = await readFile(file)
  validateColumns(rows, STR_REQUIRED, 'Search Term Report')

  return rows.map((row) => {
    const campaignName = String(col(row, 'Campaign Name') ?? '')
    const dims = parseCampaignName(campaignName)
    return {
      campaign_name:        campaignName,
      ad_group_name:        String(col(row, 'Ad Group Name') ?? ''),
      targeting:            String(col(row, 'Targeting') ?? ''),
      match_type:           String(col(row, 'Match Type') ?? ''),
      search_term:          String(col(row, 'Customer Search Term') ?? ''),
      impressions:          int(col(row, 'Impressions')),
      clicks:               int(col(row, 'Clicks')),
      ctr:                  pct(col(row, 'Click-Thru Rate (CTR)')),
      cpc:                  num(col(row, 'Cost Per Click (CPC)')),
      spend:                num(col(row, 'Spend')),
      sales:                num(col(row, '7 Day Total Sales ', '7 Day Total Sales')),
      acos:                 pct(col(row, 'Total Advertising Cost of Sales (ACOS) ', 'Total Advertising Cost of Sales (ACOS)')),
      roas:                 num(col(row, 'Total Return on Advertising Spend (ROAS)', 'Total Return on Advertising Spend (ROAS) ')),
      orders:               int(col(row, '7 Day Total Orders (#)')),
      units:                int(col(row, '7 Day Total Units (#)')),
      cvr:                  pct(col(row, '7 Day Conversion Rate')),
      advertised_sku_units: int(col(row, '7 Day Advertised SKU Units (#)')),
      other_sku_units:      int(col(row, '7 Day Other SKU Units (#)')),
      advertised_sku_sales: num(col(row, '7 Day Advertised SKU Sales')),
      other_sku_sales:      num(col(row, '7 Day Other SKU Sales')),
      tactic:               dims.tactic,
      match_type_parsed:    dims.matchType,
      goal:                 dims.goal,
      size:                 dims.size,
      tactic_label:         dims.tacticLabel,
    }
  })
}

// ─── Placement Report ─────────────────────────────────────────────────────────

const PLACEMENT_REQUIRED = ['Campaign Name', 'Placement', 'Impressions', 'Clicks', 'Spend']

export async function parsePlacementReport(file) {
  const rows = await readFile(file)
  validateColumns(rows, PLACEMENT_REQUIRED, 'Placement Report')

  return rows.map((row) => ({
    campaign_name:    String(col(row, 'Campaign Name') ?? ''),
    bidding_strategy: String(col(row, 'Bidding strategy', 'Bidding Strategy') ?? ''),
    placement:        String(col(row, 'Placement') ?? ''),
    impressions:      int(col(row, 'Impressions')),
    clicks:           int(col(row, 'Clicks')),
    cpc:              num(col(row, 'Cost Per Click (CPC)')),
    spend:            num(col(row, 'Spend')),
    sales:            num(col(row, '7 Day Total Sales ', '7 Day Total Sales')),
    acos:             pct(col(row, 'Total Advertising Cost of Sales (ACOS) ', 'Total Advertising Cost of Sales (ACOS)')),
    roas:             num(col(row, 'Total Return on Advertising Spend (ROAS)')),
    orders:           int(col(row, '7 Day Total Orders (#)')),
    units:            int(col(row, '7 Day Total Units (#)')),
  }))
}

// ─── Advertised Products Report ───────────────────────────────────────────────

const PRODUCTS_REQUIRED = ['Campaign Name', 'Advertised SKU', 'Impressions', 'Clicks', 'Spend']

export async function parseAdvertisedProductsReport(file) {
  const rows = await readFile(file)
  validateColumns(rows, PRODUCTS_REQUIRED, 'Advertised Products Report')

  return rows.map((row) => {
    const campaignName = String(col(row, 'Campaign Name') ?? '')
    const dims = parseCampaignName(campaignName)
    return {
      campaign_name:        campaignName,
      ad_group_name:        String(col(row, 'Ad Group Name') ?? ''),
      advertised_sku:       String(col(row, 'Advertised SKU') ?? ''),
      advertised_asin:      String(col(row, 'Advertised ASIN') ?? ''),
      impressions:          int(col(row, 'Impressions')),
      clicks:               int(col(row, 'Clicks')),
      ctr:                  pct(col(row, 'Click-Thru Rate (CTR)')),
      cpc:                  num(col(row, 'Cost Per Click (CPC)')),
      spend:                num(col(row, 'Spend')),
      sales:                num(col(row, '7 Day Total Sales ', '7 Day Total Sales')),
      acos:                 pct(col(row, 'Total Advertising Cost of Sales (ACOS) ', 'Total Advertising Cost of Sales (ACOS)')),
      roas:                 num(col(row, 'Total Return on Advertising Spend (ROAS)')),
      orders:               int(col(row, '7 Day Total Orders (#)')),
      units:                int(col(row, '7 Day Total Units (#)')),
      cvr:                  pct(col(row, '7 Day Conversion Rate')),
      advertised_sku_units: int(col(row, '7 Day Advertised SKU Units (#)')),
      other_sku_units:      int(col(row, '7 Day Other SKU Units (#)')),
      advertised_sku_sales: num(col(row, '7 Day Advertised SKU Sales')),
      other_sku_sales:      num(col(row, '7 Day Other SKU Sales')),
      tactic:               dims.tactic,
      match_type_parsed:    dims.matchType,
      goal:                 dims.goal,
      size:                 dims.size,
      tactic_label:         dims.tacticLabel,
    }
  })
}
