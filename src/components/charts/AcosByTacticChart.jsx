import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from 'recharts'
import { buildTacticBreakdown } from '../../services/insightEngine'
import { formatPercentDirect, formatCurrency } from '../../utils/formatters'

function acosColor(acos, target) {
  if (acos == null || target == null) return '#6366f1'
  if (acos <= target * 0.85) return '#22c55e'
  if (acos <= target)        return '#f59e0b'
  return '#ef4444'
}

const CustomTooltip = ({ active, payload, label, targetAcos }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      <p style={{ color: acosColor(d.acosVal, targetAcos) }}>
        ACOS: {d.acos != null ? `${d.acos}%` : '—'}
      </p>
      <p className="text-gray-300">Spend: {formatCurrency(d.spend)}</p>
      <p className="text-gray-300">Sales: {formatCurrency(d.sales)}</p>
      <p className="text-gray-300">Orders: {d.orders}</p>
    </div>
  )
}

export default function AcosByTacticChart({ strData, targetAcos }) {
  const raw = buildTacticBreakdown(strData).filter(d => d.acos != null && d.spend > 0)
  const data = raw.map(d => ({
    ...d,
    acosVal: d.acos,
    acos: d.acos != null ? Math.round(d.acos * 1000) / 10 : null, // as % with 1dp
  }))

  const targetPct = targetAcos != null ? Math.round(targetAcos * 1000) / 10 : null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">ACOS by Tactic</h3>
      <p className="text-gray-500 text-xs mb-4">Each bar vs your target — green is good, red needs attention</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis
            type="number"
            dataKey="acos"
            tickFormatter={v => `${v}%`}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            domain={[0, 'dataMax + 5']}
          />
          <YAxis
            type="category"
            dataKey="tactic"
            width={110}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip targetAcos={targetAcos} />} />
          {targetPct != null && (
            <ReferenceLine
              x={targetPct}
              stroke="#6366f1"
              strokeDasharray="4 2"
              label={{ value: `Target ${targetPct}%`, fill: '#818cf8', fontSize: 10, position: 'top' }}
            />
          )}
          <Bar dataKey="acos" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((d, i) => (
              <Cell key={i} fill={acosColor(d.acosVal, targetAcos)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
