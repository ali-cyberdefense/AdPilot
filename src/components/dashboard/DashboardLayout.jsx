import Navbar from '../common/Navbar'
import UploadPage from '../upload/UploadPage'
import { useReportContext } from '../../context/ReportContext'
import MetricsSummary from './MetricsSummary'
import TacticSpendChart from '../charts/TacticSpendChart'
import AcosByTacticChart from '../charts/AcosByTacticChart'
import PlacementChart from '../charts/PlacementChart'
import SpendTrendChart from '../charts/SpendTrendChart'
import AsinPerformance from '../charts/AsinPerformance'
import WastedSpendChart from '../charts/WastedSpendChart'
import TopSearchTerms from '../charts/TopSearchTerms'

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

  const critical = insights.filter(i => i.severity === 'critical')
  const warnings  = insights.filter(i => i.severity === 'warning')
  const opps      = insights.filter(i => i.severity === 'opportunity')

  return (
    <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-8">

      {/* ── KPI Summary ── */}
      <MetricsSummary
        strData={strData}
        placementData={placementData}
        productData={productData}
        targetAcos={targetAcos}
      />

      {/* ── Insight badges ── */}
      {insights.length > 0 && (
        <div className="flex gap-3 -mt-4">
          {critical.length > 0 && <Badge count={critical.length} label="Critical"      color="red" />}
          {warnings.length  > 0 && <Badge count={warnings.length}  label="Warning"       color="amber" />}
          {opps.length      > 0 && <Badge count={opps.length}      label="Opportunities" color="green" />}
        </div>
      )}

      {/* ── Insight cards (Checkpoint 6 will replace these with styled cards) ── */}
      {insights.length > 0 && (
        <section>
          <h2 className="text-white font-semibold text-sm mb-3">
            Generated Insights
            <span className="text-gray-500 font-normal ml-2">— full styled cards in Checkpoint 6</span>
          </h2>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightRow key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* ── Row 1: Spend by Tactic (donut) + ACOS by Tactic (horizontal bar) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TacticSpendChart strData={strData} targetAcos={targetAcos} />
        <AcosByTacticChart strData={strData} targetAcos={targetAcos} />
      </div>

      {/* ── Row 2: Spend vs Sales by Tactic + Placement Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SpendTrendChart strData={strData} />
        <PlacementChart placementData={placementData} />
      </div>

      {/* ── Row 3: ASIN Performance + Wasted Spend ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AsinPerformance productData={productData} targetAcos={targetAcos} />
        <WastedSpendChart strData={strData} />
      </div>

      {/* ── Row 4: Top Search Terms (full width) ── */}
      <TopSearchTerms strData={strData} targetAcos={targetAcos} />

      {/* ── Data counts footer ── */}
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
    critical:    { border: 'border-l-red-500',   bg: 'bg-red-950/20',   label: 'Critical',    text: 'text-red-400' },
    warning:     { border: 'border-l-amber-500', bg: 'bg-amber-950/20', label: 'Warning',     text: 'text-amber-400' },
    opportunity: { border: 'border-l-green-500', bg: 'bg-green-950/20', label: 'Opportunity', text: 'text-green-400' },
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

function RowCount({ label, count }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{count.toLocaleString()}</p>
    </div>
  )
}
