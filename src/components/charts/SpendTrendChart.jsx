import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { buildTacticBreakdown } from '../../services/insightEngine'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
      {payload.length === 2 && payload[0].value > 0 && (
        <p className="text-gray-400 mt-1">
          ROAS: {(payload[1].value / payload[0].value).toFixed(2)}×
        </p>
      )}
    </div>
  )
}

export default function SpendTrendChart({ strData }) {
  const data = buildTacticBreakdown(strData)
    .filter(d => d.spend > 0)
    .map(d => ({
      tactic: d.tactic.length > 16 ? d.tactic.slice(0, 14) + '…' : d.tactic,
      fullTactic: d.tactic,
      Spend: Math.round(d.spend * 100) / 100,
      Sales: Math.round(d.sales * 100) / 100,
    }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">Spend vs Sales by Tactic</h3>
      <p className="text-gray-500 text-xs mb-4">Side-by-side comparison — taller sales bars = better ROAS</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="tactic" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Bar dataKey="Spend" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={36} />
          <Bar dataKey="Sales" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
