import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

function acosColor(acos, target) {
  if (acos == null || target == null) return 'text-gray-300'
  if (acos <= target * 0.85) return 'text-green-400'
  if (acos <= target)        return 'text-amber-400'
  return 'text-red-400'
}

export default function TopSearchTerms({ strData, targetAcos }) {
  const top = [...strData]
    .filter(r => (r.spend || 0) > 0)
    .sort((a, b) => (b.spend || 0) - (a.spend || 0))
    .slice(0, 20)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm">Top 20 Search Terms by Spend</h3>
      <p className="text-gray-500 text-xs mb-4">Highest-cost terms — your biggest budget drivers</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium pb-2 pr-3">Search Term</th>
              <th className="text-right text-gray-500 font-medium pb-2 px-2">Spend</th>
              <th className="text-right text-gray-500 font-medium pb-2 px-2">Sales</th>
              <th className="text-right text-gray-500 font-medium pb-2 px-2">Orders</th>
              <th className="text-right text-gray-500 font-medium pb-2 px-2">ACOS</th>
              <th className="text-right text-gray-500 font-medium pb-2 pl-2">Tactic</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-2 pr-3 text-gray-200 max-w-[200px] truncate" title={r.search_term}>
                  {r.search_term || '—'}
                </td>
                <td className="py-2 px-2 text-right text-gray-300 font-mono">{formatCurrency(r.spend)}</td>
                <td className="py-2 px-2 text-right text-gray-300 font-mono">{formatCurrency(r.sales)}</td>
                <td className="py-2 px-2 text-right text-gray-300 font-mono">{r.orders ?? 0}</td>
                <td className={`py-2 px-2 text-right font-mono ${acosColor(r.acos, targetAcos)}`}>
                  {r.acos != null ? formatPercentDirect(r.acos * 100) : '—'}
                </td>
                <td className="py-2 pl-2 text-right text-gray-500">{r.tactic_label || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
