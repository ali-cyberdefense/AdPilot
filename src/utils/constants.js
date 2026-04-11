// AdPilot — Global constants, thresholds, and color config

export const SEVERITY_COLORS = {
  critical: '#ef4444',    // red
  warning: '#f59e0b',     // amber
  opportunity: '#22c55e', // green
}

export const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
]

export const PLACEMENTS = {
  TOP_OF_SEARCH: 'Top of Search (on Amazon)',
  PRODUCT_PAGES: 'Detail Page on-Amazon',
  REST_OF_SEARCH: 'Other on-Amazon',
  OFF_AMAZON: 'Off Amazon',
}

export const THRESHOLDS = {
  LOW_CTR: 0.002,           // 0.2%
  LOW_CTR_MIN_IMPRESSIONS: 1000,
  HARVESTING_MIN_ORDERS: 1,
  ACOS_HEADROOM_OPPORTUNITY: 3,   // points below target = opportunity
  ACOS_OVERSPEND_CRITICAL: 10,    // points above target = critical
  TOS_CVR_MULTIPLIER: 2,          // TOS CVR > 2x Product Pages = suggest modifier increase
  ASIN_CONCENTRATION_RISK: 0.5,   // >50% spend on single ASIN = risk
}
