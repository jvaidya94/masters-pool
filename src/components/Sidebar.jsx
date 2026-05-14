import { formatScore, parseScore } from '../lib/espn.js'
import { DEFAULT_PURSE } from '../lib/scoring.js'

// PGA Championship payout fractions (based on 2025 structure)
const PAYOUT_LABELS = [
  { pos: '1st',  frac: 0.1800 },
  { pos: '2nd',  frac: 0.1080 },
  { pos: '3rd',  frac: 0.0680 },
  { pos: '4th',  frac: 0.0480 },
  { pos: 'T5',   frac: 0.0385 },
  { pos: '7th',  frac: 0.0335 },
  { pos: 'T8',   frac: 0.0290 },
  { pos: 'T12',  frac: 0.0220 },
  { pos: 'T15',  frac: 0.0180 },
  { pos: 'T20',  frac: 0.0130 },
  { pos: 'T25',  frac: 0.0095 },
  { pos: 'T30',  frac: 0.0073 },
  { pos: 'T40',  frac: 0.0052 },
  { pos: 'T50',  frac: 0.0038 },
  { pos: 'T60',  frac: 0.0030 },
  { pos: '70th', frac: 0.0026 },
]

export default function Sidebar({ competitors, event, pool, entries = [] }) {
  const purse     = event?.purse ?? DEFAULT_PURSE
  const madeCount = competitors.filter((c) => !c.isCut && !c.isWD).length
  const round     = event?.round ?? '—'
  const isLive    = event && !event.completed

  // Top 10 active players for display
  const leaders = competitors
    .filter((c) => !c.isCut && !c.isWD && c.position)
    .sort((a, b) => {
      const pa = parseInt((a.position ?? '').replace(/\D/g, ''), 10) || 999
      const pb = parseInt((b.position ?? '').replace(/\D/g, ''), 10) || 999
      return pa - pb
    })
    .slice(0, 10)

  return (
    <aside className="flex flex-col gap-5">

      {/* Pool summary */}
      <Widget title="Summary" badge={pool.name}>
        <div className="grid grid-cols-2 gap-2">
          <Stat val={pool.entries?.length ?? '—'} lbl="Entries" />
          <Stat val={event?.round ? `R${event.round}` : (event?.completed ? 'Final' : '—')} lbl="Round" />
          <Stat val={fmtMoney(purse, true)} lbl="Purse" />
          <Stat val={madeCount || '—'} lbl="Made Cut" />
        </div>
      </Widget>

      {/* Best & Worst score cards — sorted by aggregate stroke play total */}
      {entries.length > 0 && (() => {
        const byScore = [...entries].sort((a, b) => a.totalScore - b.totalScore)
        const best  = byScore[0]
        const worst = byScore[byScore.length - 1]
        const fmt = (n) => n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`
        return (
          <div className="grid grid-cols-2 gap-3">
            <PrizeCard
              label="🏆 Best Score"
              name={best?.name}
              value={fmt(best?.totalScore ?? 0)}
              sublabel="total to par"
              highlight="var(--gold)"
            />
            <PrizeCard
              label="🥄 Worst Score"
              name={worst?.name}
              value={fmt(worst?.totalScore ?? 0)}
              sublabel="total to par"
              highlight="var(--cut)"
            />
          </div>
        )
      })()}

      {/* Tournament leaderboard */}
      <Widget title="Tournament Leaders" badge={isLive ? 'Live' : event?.completed ? 'Final' : '—'}>
        <div className="text-[10px] font-semibold tracking-widest uppercase grid grid-cols-[1.4rem_1fr_2.5rem_2.5rem] gap-2 pb-1.5" style={{ color: '#7A7A7A' }}>
          <span />
          <span>Player</span>
          <span className="text-center">Thru</span>
          <span className="text-right">Score</span>
        </div>
        {leaders.length === 0 && (
          <p className="text-xs py-2" style={{ color: '#7A7A7A' }}>No data yet.</p>
        )}
        {leaders.map((c) => {
          const n = parseScore(c.score)
          const color = n < 0 ? 'var(--green)' : n > 0 ? 'var(--cut)' : '#4A4A4A'
          return (
            <div
              key={c.id ?? c.name}
              className="grid grid-cols-[1.4rem_1fr_2.5rem_2.5rem] gap-2 items-center py-1.5 text-xs"
              style={{ borderBottom: '1px solid var(--cream-dark)' }}
            >
              <span className="font-bold text-[11px]" style={{ color: '#4A4A4A' }}>{c.position}</span>
              <span className="font-medium" style={{ color: '#1A1A1A' }}>{c.name}</span>
              <span className="text-center text-[11px]" style={{ color: '#7A7A7A' }}>{c.thru || '—'}</span>
              <span className="text-right font-semibold" style={{ color }}>{formatScore(n)}</span>
            </div>
          )
        })}
      </Widget>

      {/* Payout table */}
      <Widget title="Payouts" badge={fmtMoney(purse, true) + ' purse'}>
        {PAYOUT_LABELS.map(({ pos, frac }) => (
          <div
            key={pos}
            className="flex justify-between items-center py-1.5 text-xs"
            style={{ borderBottom: '1px solid var(--cream-dark)' }}
          >
            <span style={{ color: '#4A4A4A' }}>{pos}</span>
            <span className="font-semibold" style={{ color: 'var(--green)' }}>
              {fmtMoney(Math.round(frac * purse))}
            </span>
          </div>
        ))}
      </Widget>

    </aside>
  )
}

function Widget({ title, badge, children }) {
  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ background: 'white', border: '1px solid var(--cream-dark)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--green)' }}
      >
        <h3 className="font-display text-sm font-semibold tracking-wide" style={{ color: 'var(--gold)' }}>
          {title}
        </h3>
        {badge && (
          <span className="text-[10px] tracking-widest uppercase" style={{ color: '#9BAFD4' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function Stat({ val, lbl }) {
  return (
    <div className="rounded-sm px-3 py-2.5" style={{ background: 'var(--cream)' }}>
      <div className="font-display text-xl font-bold" style={{ color: 'var(--green)' }}>
        {val}
      </div>
      <div className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: '#7A7A7A' }}>
        {lbl}
      </div>
    </div>
  )
}

function PrizeCard({ label, name, value, sublabel, highlight }) {
  return (
    <div
      className="rounded-sm p-3 flex flex-col gap-1"
      style={{ background: 'white', border: `1px solid var(--cream-dark)`, borderTop: `3px solid ${highlight}` }}
    >
      <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#7A7A7A' }}>
        {label}
      </div>
      <div className="font-display text-lg font-bold leading-tight" style={{ color: highlight }}>
        {value ?? '—'}
      </div>
      <div className="text-[10px]" style={{ color: '#7A7A7A' }}>{sublabel}</div>
      <div className="text-xs font-semibold mt-0.5 truncate" style={{ color: '#1A1A1A' }}>
        {name ?? '—'}
      </div>
    </div>
  )
}

function fmtMoney(n, compact = false) {
  if (!n) return '—'
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  return '$' + Math.round(n).toLocaleString()
}
