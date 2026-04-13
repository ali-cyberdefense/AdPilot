import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1 break-words max-w-[220px]">{label}</p>
      <p className="text-red-400">Wasted Spend: {formatCurrency(d.wasted)}</p>
      <p className="text-gray-300">Zero-order Terms: {d.count}</p>
      <p className="text-gray-300">Total Clicks: {d.clicks}</p>
    </div>
  )
}

export default function WastedSpendChart({ strData }) {
  const byCampaign = strData
    .filter(r => (r.orders || 0) === 0 && (r.spend || 0) > 0)
    .reduce((acc, r) => {
      const key = r.campaign_name || 'Unknown'
      if (!acc[key]) acc[key] = { wasted: 0, count: 0, clicks: 0 }
      acc[key].wasted += r.spend || 0
      acc[key].count  += 1
      acc[key].clicks += r.clicks || 0
      return acc
    }, {})

  const data = Object.entries(byCampaign)
    .map(([campaign, stats]) => ({
      campaign,
      label: campaign.length > 28 ? campaign.slice(0, 26) + '…' : campaign,
      ...stats,
    }))
    .sort((a, b) => b.wasted - a.wasted)
    .slice(0, 10)

  if (!data.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm">Wasted Spend by Campaign</h3>
        <p className="text-gray-500 text-xs mb-4">Campaigns with zero-order spend</p>
        <p className="text-gray-600 text-sm text-center py-8">No wasted spend detected</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">Wasted Spend by Campaign (Top 10)</h3>
      <p className="text-gray-500 text-xs mb-4">Ad spend on zero-order terms per campaign</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={v => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="wasted" fill="#ef4444" radius={[0,4,4,0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
