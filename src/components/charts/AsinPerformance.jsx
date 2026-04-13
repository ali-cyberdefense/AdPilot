import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { buildAsinBreakdown } from '../../services/insightEngine'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

function acosColor(acos, target) {
  if (acos == null || target == null) return '#6366f1'
  if (acos <= target * 0.85) return '#22c55e'
  if (acos <= target)        return '#f59e0b'
  return '#ef4444'
}

const CustomTooltip = ({ active, payload, label, targetAcos }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-gray-300">Spend: {formatCurrency(d.spend)}</p>
      <p className="text-gray-300">Sales: {formatCurrency(d.sales)}</p>
      <p className="text-gray-300">Orders: {d.orders}</p>
      <p style={{ color: acosColor(d.acosRaw, targetAcos) }}>
        ACOS: {d.acos != null ? `${d.acos}%` : '—'}
      </p>
      <p className="text-gray-400">Share: {formatPercentDirect(d.spendShare * 100)}</p>
    </div>
  )
}

export default function AsinPerformance({ productData, targetAcos }) {
  const raw = buildAsinBreakdown(productData).slice(0, 10)
  const data = raw.map(d => ({
    ...d,
    acosRaw: d.acos,
    acos: d.acos != null ? Math.round(d.acos * 1000) / 10 : null,
    label: d.asin.length > 12 ? d.asin.slice(-10) : d.asin,
  }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">ASIN Performance (Top 10 by Spend)</h3>
      <p className="text-gray-500 text-xs mb-4">Spend and sales per advertised ASIN — spot dependencies</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip targetAcos={targetAcos} />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Bar dataKey="spend" name="Spend" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={36} />
          <Bar dataKey="sales" name="Sales" radius={[4,4,0,0]} maxBarSize={36}>
            {data.map((d, i) => (
              <Cell key={i} fill={acosColor(d.acosRaw, targetAcos)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
