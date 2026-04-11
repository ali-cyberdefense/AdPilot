// AdPilot — PPC Formulas (hardcoded Layer 1)
// Do NOT modify thresholds without consulting Ali.

export const acos = (spend, sales) =>
  sales > 0 ? spend / sales : null

export const roas = (spend, sales) =>
  spend > 0 ? sales / spend : null

export const rpc = (sales, clicks) =>
  clicks > 0 ? sales / clicks : null

export const cpa = (spend, orders) =>
  orders > 0 ? spend / orders : null

export const cvr = (orders, clicks) =>
  clicks > 0 ? orders / clicks : null

export const suggestedBid = (revenuePerClick, targetAcos) =>
  revenuePerClick * targetAcos

export const organicRatio = (totalSales, adSales) =>
  adSales > 0 ? (totalSales - adSales) / adSales : null

export const wastedSpend = (rows) =>
  rows
    .filter((r) => r.orders === 0)
    .reduce((sum, r) => sum + r.spend, 0)
