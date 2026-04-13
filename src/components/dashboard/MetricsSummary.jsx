import { formatCurrency, formatPercent, formatPercentDirect, formatNumber, formatROAS } from '../../utils/formatters'

function acosColor(acos, target) {
  if (acos == null || target == null) return 'text-white'
  if (acos <= target * 0.85) return 'text-green-400'
  if (acos <= target)        return 'text-amber-400'
  return 'text-red-400'
}

function KpiCard({ label, value, sub, valueClass = 'text-white' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${valueClass}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default function MetricsSummary({ strData, placementData, productData, targetAcos }) {
  const totalSpend    = strData.reduce((s, r) => s + (r.spend   || 0), 0)
  const totalSales    = strData.reduce((s, r) => s + (r.sales   || 0), 0)
  const totalOrders   = strData.reduce((s, r) => s + (r.orders  || 0), 0)
  const totalClicks   = strData.reduce((s, r) => s + (r.clicks  || 0), 0)
  const totalImpr     = strData.reduce((s, r) => s + (r.impressions || 0), 0)

  const overallAcos   = totalSales   > 0 ? totalSpend  / totalSales   : null
  const overallRoas   = totalSpend   > 0 ? totalSales  / totalSpend   : null
  const overallCtr    = totalImpr    > 0 ? totalClicks / totalImpr    : null
  const overallCvr    = totalClicks  > 0 ? totalOrders / totalClicks  : null
  const avgCpc        = totalClicks  > 0 ? totalSpend  / totalClicks  : null

  const wastedSpend   = strData
    .filter(r => (r.orders || 0) === 0 && (r.spend || 0) > 0)
    .reduce((s, r) => s + r.spend, 0)
  const wastedPct     = totalSpend > 0 ? wastedSpend / totalSpend : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <KpiCard label="Total Spend"    value={formatCurrency(totalSpend)} />
      <KpiCard label="Total Sales"    value={formatCurrency(totalSales)} />
      <KpiCard
        label="Overall ACOS"
        value={overallAcos != null ? formatPercentDirect(overallAcos * 100) : '—'}
        sub={targetAcos ? `Target: ${formatPercentDirect(targetAcos * 100)}` : null}
        valueClass={acosColor(overallAcos, targetAcos)}
      />
      <KpiCard label="ROAS"           value={formatROAS(overallRoas)} />
      <KpiCard label="Total Orders"   value={formatNumber(totalOrders)} />
      <KpiCard label="Total Clicks"   value={formatNumber(totalClicks)} />
      <KpiCard label="Avg CTR"        value={overallCtr != null ? formatPercentDirect(overallCtr * 100, 2) : '—'} />
      <KpiCard label="Avg CVR"        value={overallCvr != null ? formatPercentDirect(overallCvr * 100, 1) : '—'} />
      <KpiCard label="Avg CPC"        value={formatCurrency(avgCpc)} />
      <KpiCard
        label="Wasted Spend"
        value={formatCurrency(wastedSpend)}
        sub={wastedPct != null ? `${formatPercentDirect(wastedPct * 100)} of spend` : null}
        valueClass={wastedPct != null && wastedPct > 0.15 ? 'text-red-400' : 'text-amber-400'}
      />
    </div>
  )
}
