import { useState } from 'react'
import { formatCurrency, formatPercentDirect } from '../../utils/formatters'

// ─── Config per severity ──────────────────────────────────────────────────────

const SEV = {
  critical: {
    border:  'border-l-red-500',
    bg:      'bg-red-950/20',
    badge:   'bg-red-950/60 text-red-400 border-red-800',
    label:   'Critical',
    icon:    '⚠',
    iconClr: 'text-red-400',
  },
  warning: {
    border:  'border-l-amber-500',
    bg:      'bg-amber-950/20',
    badge:   'bg-amber-950/60 text-amber-400 border-amber-800',
    label:   'Warning',
    icon:    '◉',
    iconClr: 'text-amber-400',
  },
  opportunity: {
    border:  'border-l-green-500',
    bg:      'bg-green-950/20',
    badge:   'bg-green-950/60 text-green-400 border-green-800',
    label:   'Opportunity',
    icon:    '↑',
    iconClr: 'text-green-400',
  },
}

// ─── Detail renderers per insight type ───────────────────────────────────────

function DetailPanel({ insight }) {
  const d = insight.data || {}

  switch (insight.insight_type) {

    case 'tactic_spend_imbalance':
      return (
        <DetailGrid>
          <Stat label="Tactic"      value={d.tactic} />
          <Stat label="ACOS"        value={formatPercentDirect((d.acos || 0) * 100)} />
          <Stat label="Target ACOS" value={formatPercentDirect((d.targetAcos || 0) * 100)} />
          <Stat label="Points Over" value={`+${d.pointsOver}pts`} />
          <Stat label="Spend"       value={formatCurrency(d.spend)} />
          <Stat label="Spend Share" value={formatPercentDirect((d.spendShare || 0) * 100)} />
          {d.allOver?.length > 1 && (
            <DetailFull label="All over-target tactics">
              {d.allOver.map((t, i) => (
                <Row key={i} cols={[t.tactic, formatCurrency(t.spend), formatPercentDirect((t.acos || 0) * 100)]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'tactic_scaling_opportunity':
      return (
        <DetailGrid>
          <Stat label="Tactic"      value={d.tactic} />
          <Stat label="Current ACOS" value={formatPercentDirect((d.acos || 0) * 100)} />
          <Stat label="Target ACOS" value={formatPercentDirect((d.targetAcos || 0) * 100)} />
          <Stat label="Headroom"    value={`${d.headroom}pts`} />
          <Stat label="Spend"       value={formatCurrency(d.spend)} />
          <Stat label="Sales"       value={formatCurrency(d.sales)} />
          {d.allOpps?.length > 1 && (
            <DetailFull label="All scaling opportunities">
              {d.allOpps.map((t, i) => (
                <Row key={i} cols={[t.tactic, `${t.headroom}pts headroom`, formatPercentDirect((t.acos || 0) * 100)]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'harvesting_candidates':
      return (
        <DetailGrid>
          <Stat label="Candidate Terms" value={d.count} />
          <Stat label="Total Orders"    value={d.totalOrders} />
          {d.top?.length > 0 && (
            <DetailFull label="Top harvesting candidates">
              <TableHeader cols={['Search Term', 'Orders', 'ACOS', 'Spend', 'Tactic']} />
              {d.top.map((r, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[180px] block" title={r.search_term}>{r.search_term}</span>,
                  r.orders,
                  r.acos != null ? formatPercentDirect(r.acos * 100) : '—',
                  formatCurrency(r.spend),
                  r.tactic,
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'negation_candidates':
      return (
        <DetailGrid>
          <Stat label="Terms to Negate" value={d.count} />
          <Stat label="Total Wasted"    value={formatCurrency(d.totalWasted)} />
          <Stat label="Threshold"       value={`${formatCurrency(d.threshold)} per term`} />
          {d.top?.length > 0 && (
            <DetailFull label="Top negation candidates (by spend)">
              <TableHeader cols={['Search Term', 'Spend', 'Clicks', 'Campaign']} />
              {d.top.map((r, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[180px] block" title={r.search_term}>{r.search_term}</span>,
                  formatCurrency(r.spend),
                  r.clicks,
                  <span className="truncate max-w-[160px] block text-gray-500" title={r.campaign}>{r.campaign}</span>,
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'placement_performance_split':
      return (
        <DetailGrid>
          <Stat label="TOS CVR"       value={d.tos?.cvr  != null ? formatPercentDirect(d.tos.cvr  * 100, 1) : '—'} />
          <Stat label="TOS ACOS"      value={d.tos?.acos != null ? formatPercentDirect(d.tos.acos * 100) : '—'} />
          <Stat label="TOS Spend"     value={formatCurrency(d.tos?.spend)} />
          <Stat label="TOS CPC"       value={formatCurrency(d.tos?.cpc)} />
          <Stat label="PP CVR"        value={d.pp?.cvr  != null ? formatPercentDirect(d.pp.cvr   * 100, 1) : '—'} />
          <Stat label="PP ACOS"       value={d.pp?.acos != null ? formatPercentDirect(d.pp.acos  * 100) : '—'} />
          <Stat label="PP Spend"      value={formatCurrency(d.pp?.spend)} />
          <Stat label="PP CPC"        value={formatCurrency(d.pp?.cpc)} />
        </DetailGrid>
      )

    case 'wasted_spend':
      return (
        <DetailGrid>
          <Stat label="Zero-order Terms" value={d.count} />
          <Stat label="Total Wasted"     value={formatCurrency(d.totalWasted)} />
          <Stat label="% of Spend"       value={formatPercentDirect((d.wastedPct || 0) * 100)} />
          {d.top5?.length > 0 && (
            <DetailFull label="Top 5 wasted terms">
              <TableHeader cols={['Search Term', 'Spend', 'Clicks']} />
              {d.top5.map((r, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[220px] block" title={r.search_term}>{r.search_term}</span>,
                  formatCurrency(r.spend),
                  r.clicks,
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'top_performers':
      return (
        <DetailGrid>
          <Stat label="Order Share"  value={formatPercentDirect((d.orderShare || 0) * 100)} />
          <Stat label="Avg ACOS"     value={d.avgAcos != null ? formatPercentDirect(d.avgAcos * 100) : '—'} />
          {d.performers?.length > 0 && (
            <DetailFull label="Top 5 performing terms">
              <TableHeader cols={['Search Term', 'Orders', 'ACOS', 'Spend', 'CVR']} />
              {d.performers.map((r, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[180px] block" title={r.search_term}>{r.search_term}</span>,
                  r.orders,
                  r.acos != null ? formatPercentDirect(r.acos * 100) : '—',
                  formatCurrency(r.spend),
                  r.cvr != null ? formatPercentDirect(r.cvr * 100, 1) : '—',
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'asin_dependency':
      return (
        <DetailGrid>
          <Stat label="ASIN"       value={d.asin} />
          <Stat label="SKU"        value={d.sku || '—'} />
          <Stat label="Spend"      value={formatCurrency(d.spend)} />
          <Stat label="Spend Share" value={formatPercentDirect((d.spendShare || 0) * 100)} />
          <Stat label="ACOS"       value={d.acos != null ? formatPercentDirect(d.acos * 100) : '—'} />
          {d.top5?.length > 1 && (
            <DetailFull label="Top 5 ASINs by spend">
              <TableHeader cols={['ASIN', 'Spend', 'ACOS', 'Share']} />
              {d.top5.map((r, i) => (
                <Row key={i} cols={[
                  r.asin,
                  formatCurrency(r.spend),
                  r.acos != null ? formatPercentDirect(r.acos * 100) : '—',
                  formatPercentDirect((r.spendShare || 0) * 100),
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'low_ctr_campaigns':
      return (
        <DetailGrid>
          <Stat label="Campaigns"        value={d.count} />
          <Stat label="Total Impressions" value={(d.totalImpressions || 0).toLocaleString()} />
          {d.top?.length > 0 && (
            <DetailFull label="Lowest CTR campaigns">
              <TableHeader cols={['Campaign', 'Impressions', 'Clicks', 'CTR']} />
              {d.top.map((r, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[180px] block" title={r.campaign}>{r.campaign}</span>,
                  (r.impressions || 0).toLocaleString(),
                  r.clicks,
                  r.ctr != null ? formatPercentDirect(r.ctr * 100, 3) : '—',
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    case 'bidding_strategy_mismatch':
      return (
        <DetailGrid>
          <Stat label="Campaigns" value={d.count} />
          {d.campaigns?.length > 0 && (
            <DetailFull label="Affected campaigns">
              <TableHeader cols={['Campaign', 'PP Spend']} />
              {d.campaigns.map((c, i) => (
                <Row key={i} cols={[
                  <span className="truncate max-w-[260px] block" title={c.campaign}>{c.campaign}</span>,
                  formatCurrency(c.ppSpend),
                ]} />
              ))}
            </DetailFull>
          )}
        </DetailGrid>
      )

    default:
      return (
        <p className="text-gray-500 text-xs mt-2 pl-1">No detail available for this insight type.</p>
      )
  }
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function DetailGrid({ children }) {
  return <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">{children}</div>
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-200 text-xs font-mono font-medium">{value ?? '—'}</p>
    </div>
  )
}

function DetailFull({ label, children }) {
  return (
    <div className="col-span-2 sm:col-span-3 mt-2">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <div className="border border-gray-700 rounded-lg overflow-hidden text-xs">{children}</div>
    </div>
  )
}

function TableHeader({ cols }) {
  return (
    <div className={`grid grid-cols-${cols.length} gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700`}>
      {cols.map((c, i) => (
        <span key={i} className="text-gray-500 font-medium">{c}</span>
      ))}
    </div>
  )
}

function Row({ cols }) {
  return (
    <div className={`grid grid-cols-${cols.length} gap-2 px-3 py-1.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/40`}>
      {cols.map((c, i) => (
        <span key={i} className="text-gray-300">{c}</span>
      ))}
    </div>
  )
}

// ─── Single insight card ──────────────────────────────────────────────────────

function InsightCard({ insight, index }) {
  const [open, setOpen] = useState(false)
  const s = SEV[insight.severity] || SEV.warning

  return (
    <div
      className={`border border-gray-800 border-l-4 ${s.border} ${s.bg} rounded-xl px-5 py-4 cursor-pointer select-none transition-all`}
      onClick={() => setOpen(o => !o)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`text-base font-bold mt-0.5 shrink-0 ${s.iconClr}`}>{s.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${s.badge}`}>
                {s.label}
              </span>
              <span className="text-gray-600 text-xs">{typeLabel(insight.insight_type)}</span>
            </div>
            <p className="text-white font-semibold text-sm leading-snug">{insight.title}</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{insight.description}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <span className={`text-gray-600 text-lg shrink-0 transition-transform duration-150 mt-0.5 ${open ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div
          className="mt-3 pt-3 border-t border-gray-700/50"
          onClick={e => e.stopPropagation()}
        >
          <DetailPanel insight={insight} />
        </div>
      )}
    </div>
  )
}

function typeLabel(type) {
  const labels = {
    tactic_spend_imbalance:    'Tactic Imbalance',
    tactic_scaling_opportunity:'Scaling Opportunity',
    harvesting_candidates:     'Keyword Harvesting',
    negation_candidates:       'Negation',
    placement_performance_split:'Placement Split',
    wasted_spend:              'Wasted Spend',
    top_performers:            'Top Performers',
    asin_dependency:           'ASIN Dependency',
    low_ctr_campaigns:         'Low CTR',
    bidding_strategy_mismatch: 'Bidding Strategy',
  }
  return labels[type] || type
}

// ─── Exported component ───────────────────────────────────────────────────────

export default function InsightCards({ insights }) {
  if (!insights?.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-sm">No insights generated.</p>
        <p className="text-gray-600 text-xs mt-1">Upload reports with sufficient spend and orders.</p>
      </div>
    )
  }

  const critical    = insights.filter(i => i.severity === 'critical')
  const warnings    = insights.filter(i => i.severity === 'warning')
  const opps        = insights.filter(i => i.severity === 'opportunity')
  const ordered     = [...critical, ...warnings, ...opps]

  return (
    <section>
      {/* Section header + badge summary */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-white font-semibold text-sm">
          Insights
          <span className="text-gray-600 font-normal ml-2">({insights.length} total)</span>
        </h2>
        <div className="flex gap-2">
          {critical.length > 0 && <SumBadge count={critical.length} label="Critical"      color="red" />}
          {warnings.length  > 0 && <SumBadge count={warnings.length}  label="Warning"       color="amber" />}
          {opps.length      > 0 && <SumBadge count={opps.length}      label="Opportunities" color="green" />}
        </div>
      </div>

      {/* Cards — critical first, then warnings, then opportunities */}
      <div className="space-y-2">
        {ordered.map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>
    </section>
  )
}

function SumBadge({ count, label, color }) {
  const cls = {
    red:   'bg-red-950/40 text-red-400 border-red-900',
    amber: 'bg-amber-950/40 text-amber-400 border-amber-900',
    green: 'bg-green-950/40 text-green-400 border-green-900',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cls[color]}`}>
      {count} {label}
    </span>
  )
}
