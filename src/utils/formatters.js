// AdPilot — Display formatters

export const formatCurrency = (n, decimals = 2) =>
  n == null ? '—' : `$${Number(n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

export const formatPercent = (n, decimals = 1) =>
  n == null ? '—' : `${(Number(n) * 100).toFixed(decimals)}%`

export const formatPercentDirect = (n, decimals = 1) =>
  n == null ? '—' : `${Number(n).toFixed(decimals)}%`

export const formatNumber = (n) =>
  n == null ? '—' : Number(n).toLocaleString()

export const formatROAS = (n) =>
  n == null ? '—' : `${Number(n).toFixed(2)}x`
