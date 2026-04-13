import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { buildTacticBreakdown } from '../../services/insightEngine'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6']

function acosColor(acos, target) {
  if (acos == null || target == null) return '#9ca3af'
  if (acos <= target * 0.85) return '#22c55e'
  if (acos <= target)        return '#f59e0b'
  return '#ef4444'
}

const CustomTooltip = ({ active, payload, targetAcos }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1">{d.tactic}</p>
      <p className="text-gray-300">Spend: {formatCurrency(d.spend)}</p>
      <p className="text-gray-300">Share: {formatPercentDirect(d.spendShare * 100)}</p>
      <p style={{ color: acosColor(d.acos, targetAcos) }}>
        ACOS: {d.acos != null ? formatPercentDirect(d.acos * 100) : '—'}
      </p>
    </div>
  )
}

const CustomLegend = ({ payload, data, targetAcos }) => (
  <div className="space-y-1 mt-2">
    {data.map((d, i) => (
      <div key={d.tactic} className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="text-gray-300 truncate">{d.tactic}</span>
        </div>
        <div className="flex gap-3 ml-2 shrink-0">
          <span className="text-gray-400">{formatPercentDirect(d.spendShare * 100)}</span>
          <span style={{ color: acosColor(d.acos, targetAcos) }}>
            {d.acos != null ? formatPercentDirect(d.acos * 100) : '—'}
          </span>
        </div>
      </div>
    ))}
  </div>
)

export default function TacticSpendChart({ strData, targetAcos }) {
  const data = buildTacticBreakdown(strData).filter(d => d.spend > 0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">Spend by Tactic</h3>
      <p className="text-gray-500 text-xs mb-4">How budget is distributed across campaign types</p>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="spend"
            nameKey="tactic"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip targetAcos={targetAcos} />} />
        </PieChart>
      </ResponsiveContainer>

      <CustomLegend data={data} targetAcos={targetAcos} />
    </div>
  )
}
