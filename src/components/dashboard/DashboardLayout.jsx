import { useState } from 'react'
import Navbar from '../common/Navbar'
import UploadPage from '../upload/UploadPage'
import { useReportContext } from '../../context/ReportContext'
import MetricsSummary from './MetricsSummary'
import InsightCards from '../insights/InsightCards'
import TacticSpendChart from '../charts/TacticSpendChart'
import AcosByTacticChart from '../charts/AcosByTacticChart'
import PlacementChart from '../charts/PlacementChart'
import SpendTrendChart from '../charts/SpendTrendChart'
import AsinPerformance from '../charts/AsinPerformance'
import WastedSpendChart from '../charts/WastedSpendChart'
import TopSearchTerms from '../charts/TopSearchTerms'
import ChatPanel from '../chat/ChatPanel'

export default function DashboardLayout() {
  const { hasData, loading } = useReportContext()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar chatOpen={chatOpen} onChatToggle={() => setChatOpen(o => !o)} />
      {loading
        ? <LoadingScreen />
        : hasData
          ? <DataView />
          : <UploadPage />
      }
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading previous report...</p>
    </div>
  )
}

function DataView() {
  const { strData, placementData, productData, targetAcos, insights } = useReportContext()

  return (
    <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-8">

      {/* ── KPI Summary ── */}
      <MetricsSummary
        strData={strData}
        placementData={placementData}
        productData={productData}
        targetAcos={targetAcos}
      />

      {/* ── Insight Cards ── */}
      <InsightCards insights={insights} />

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

function RowCount({ label, count }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{count.toLocaleString()}</p>
    </div>
  )
}
