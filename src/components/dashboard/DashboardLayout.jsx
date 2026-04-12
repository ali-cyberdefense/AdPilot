import Navbar from '../common/Navbar'
import UploadPage from '../upload/UploadPage'
import { useReportContext } from '../../context/ReportContext'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

export default function DashboardLayout() {
  const { hasData, strData, placementData, productData, targetAcos } = useReportContext()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      {hasData ? (
        <DataLoadedView
          strData={strData}
          placementData={placementData}
          productData={productData}
          targetAcos={targetAcos}
        />
      ) : (
        <UploadPage />
      )}
    </div>
  )
}

function DataLoadedView({ strData, placementData, productData, targetAcos }) {
  const totalSpend = strData.reduce((s, r) => s + (r.spend || 0), 0)
  const totalSales = strData.reduce((s, r) => s + (r.sales || 0), 0)
  const totalOrders = strData.reduce((s, r) => s + (r.orders || 0), 0)
  const overallAcos = totalSales > 0 ? totalSpend / totalSales : null

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold mb-1">Reports Loaded</h2>
          <p className="text-gray-500 text-sm">
            Data parsed and saved to Supabase. Charts and insights coming in the next checkpoints.
          </p>
        </div>

        {/* KPI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Total Spend" value={formatCurrency(totalSpend)} />
          <KpiCard label="Total Sales" value={formatCurrency(totalSales)} />
          <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} />
          <KpiCard
            label="Overall ACOS"
            value={overallAcos != null ? formatPercentDirect(overallAcos * 100) : '—'}
            highlight={overallAcos != null && targetAcos != null
              ? overallAcos <= targetAcos ? 'green' : 'red'
              : null}
          />
        </div>

        {/* Row counts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Parsed Data</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <RowCount label="Search Terms" count={strData.length} />
            <RowCount label="Placement Rows" count={placementData.length} />
            <RowCount label="Product Rows" count={productData.length} />
          </div>
        </div>

        <p className="text-gray-600 text-xs text-center mt-6">
          Checkpoint 3 complete — Insight Engine and Charts coming next
        </p>
      </div>
    </main>
  )
}

function KpiCard({ label, value, highlight }) {
  const valueColor =
    highlight === 'green' ? 'text-green-400' :
    highlight === 'red' ? 'text-red-400' :
    'text-white'

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
