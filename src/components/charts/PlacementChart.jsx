import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { buildPlacementBreakdown } from '../../services/insightEngine'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

const LABEL_MAP = {
  'Top of Search (on Amazon)': 'Top of Search',
  'Detail Page on-Amazon':     'Product Pages',
  'Other on-Amazon':           'Rest of Search',
  'Off Amazon':                'Off Amazon',
}

function shorten(name) {
  return LABEL_MAP[name] || name.split('(')[0].trim()
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'Spend' ? formatCurrency(p.value) : p.name === 'CVR' ? `${p.value}%` : `$${p.value}`}
        </p>
      ))}
    </div>
  )
}

export default function PlacementChart({ placementData }) {
  const raw = buildPlacementBreakdown(placementData)
  const data = raw.map(d => ({
    placement: shorten(d.placement),
    Spend: Math.round(d.spend * 100) / 100,
    CPC:   d.cpc != null ? Math.round(d.cpc * 100) / 100 : 0,
    CVR:   d.cvr != null ? Math.round(d.cvr * 10000) / 100 : 0, // as %
    ACOS:  d.acos != null ? Math.round(d.acos * 1000) / 10 : 0,
    orders: d.orders,
    raw: d,
  }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">Placement Performance</h3>
      <p className="text-gray-500 text-xs mb-4">Spend, CPC, and conversion rate by ad placement</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="placement" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis yAxisId="left"  tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Bar yAxisId="left"  dataKey="Spend" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40} />
          <Bar yAxisId="left"  dataKey="CPC"   fill="#8b5cf6" radius={[4,4,0,0]} maxBarSize={40} />
          <Bar yAxisId="right" dataKey="CVR"   fill="#22c55e" radius={[4,4,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
