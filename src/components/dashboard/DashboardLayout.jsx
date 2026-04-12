import Navbar from '../common/Navbar'
import UploadPage from '../upload/UploadPage'
import { useReportContext } from '../../context/ReportContext'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

export default function DashboardLayout() {
  const { hasData } = useReportContext()
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      {hasData ? <DataView /> : <UploadPage />}
    </div>
  )
}

function DataView() {
  const { strData, placementData, productData, targetAcos, insights } = useReportContext()

  const totalSpend  = strData.reduce((s, r) => s + (r.spend  || 0), 0)
  const totalSales  = strData.reduce((s, r) => s + (r.sales  || 0), 0)
  const totalOrders = strData.reduce((s, r) => s + (r.orders || 0), 0)
  const totalClicks = strData.reduce((s, r) => s + (r.clicks || 0), 0)
  const overallAcos = totalSales > 0 ? totalSpend / totalSales : null
  const overallCvr  = totalClicks > 0 ? totalOrders / totalClicks : null

  const critical    = insights.filter(i => i.severity === 'critical')
  const warnings    = insights.filter(i => i.severity === 'warning')
  const opps        = insights.filter(i => i.severity === 'opportunity')

  return (
    <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Spend"   value={formatCurrency(totalSpend)} />
        <KpiCard label="Total Sales"   value={formatCurrency(totalSales)} />
        <KpiCard label="Total Orders"  value={totalOrders.toLocaleString()} />
        <KpiCard
          label="Overall ACOS"
          value={overallAcos != null ? formatPercentDirect(overallAcos * 100) : '—'}
          highlight={overallAcos != null && targetAcos != null
            ? overallAcos <= targetAcos ? 'green' : 'red' : null}
        />
        <KpiCard label="Total Clicks"  value={totalClicks.toLocaleString()} />
        <KpiCard label="Avg CVR"       value={overallCvr != null ? formatPercentDirect(overallCvr * 100) : '—'} />
        <KpiCard label="Search Terms"  value={strData.length.toLocaleString()} />
        <KpiCard label="Insights"      value={insights.length} />
      </div>

      {/* Insight summary counts */}
      {insights.length > 0 && (
        <div className="flex gap-3 mb-5">
          {critical.length > 0 && <Badge count={critical.length} label="Critical" color="red" />}
          {warnings.length > 0 && <Badge count={warnings.length} label="Warning"  color="amber" />}
          {opps.length    > 0 && <Badge count={opps.length}    label="Opportunities" color="green" />}
        </div>
      )}

      {/* Insight cards */}
      {insights.length > 0 ? (
        <div className="space-y-3 mb-8">
          <h2 className="text-white font-semibold mb-3">
            Generated Insights
            <span className="text-gray-500 font-normal text-sm ml-2">— full cards UI in Checkpoint 6</span>
          </h2>
          {insights.map((insight, i) => (
            <InsightRow key={i} insight={insight} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8 text-center text-gray-500 text-sm">
          No insights generated. Check that your data has sufficient spend and orders.
        </div>
      )}

      {/* Data counts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm font-medium mb-3">Parsed Data</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <RowCount label="Search Terms"   count={strData.length} />
          <RowCount label="Placement Rows" count={placementData.length} />
          <RowCount label="Product Rows"   count={productData.length} />
        </div>
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InsightRow({ insight }) {
  const styles = {
    critical:    { border: 'border-l-red-500',   bg: 'bg-red-950/20',   label: 'Critical',     text: 'text-red-400' },
    warning:     { border: 'border-l-amber-500', bg: 'bg-amber-950/20', label: 'Warning',      text: 'text-amber-400' },
    opportunity: { border: 'border-l-green-500', bg: 'bg-green-950/20', label: 'Opportunity',  text: 'text-green-400' },
  }
  const s = styles[insight.severity] || styles.warning

  return (
    <div className={`border border-gray-800 border-l-4 ${s.border} ${s.bg} rounded-xl px-5 py-4`}>
      <div className="flex items-start gap-3">
        <span className={`text-xs font-semibold uppercase tracking-wider mt-0.5 shrink-0 ${s.text}`}>
          {s.label}
        </span>
        <div>
          <p className="text-white font-medium text-sm">{insight.title}</p>
          <p className="text-gray-400 text-sm mt-0.5">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

function Badge({ count, label, color }) {
  const colors = {
    red:   'bg-red-950/40 text-red-400 border-red-900',
    amber: 'bg-amber-950/40 text-amber-400 border-amber-900',
    green: 'bg-green-950/40 text-green-400 border-green-900',
  }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${colors[color]}`}>
      {count} {label}
    </span>
  )
}

function KpiCard({ label, value, highlight }) {
  const valueColor = highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${valueColor}`}>{value}</p>
    </div>
  )
}

function RowCount({ label, count }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{count.toLocaleString()}</p>
    </div>
  )
}
