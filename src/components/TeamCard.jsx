import { useState } from 'react'
import { formatScore, parseScore } from '../lib/espn.js'

const RANK_COLORS = { 1: 'var(--gold)', 2: '#A8A9AD', 3: '#C47A30' }

export default function TeamCard({ entry, rank, defaultExpanded = false }) {
  const [open, setOpen] = useState(defaultExpanded)

  const scoreNum   = entry.totalScore ?? 0
  const scoreClass = scoreNum < 0 ? 'under' : scoreNum > 0 ? 'over' : 'even'
  const borderColor = RANK_COLORS[rank] ?? 'transparent'

  return (
    <div
      className="rounded-sm overflow-hidden transition-shadow"
      style={{
        background:   'white',
        border:       '1px solid var(--cream-dark)',
        borderLeft:   `3px solid ${borderColor}`,
        boxShadow:    open ? '0 4px 20px rgba(6,64,43,0.10)' : undefined,
      }}
    >
      {/* ── Header row ── */}
      <div
        className="grid items-center gap-4 px-4 py-3 cursor-pointer select-none"
        style={{ gridTemplateColumns: '2rem 1fr auto auto auto auto 1rem' }}
        onClick={() => setOpen(!open)}
      >
        {/* Rank */}
        <span
          className="font-display text-lg font-bold text-center"
          style={{ color: rank <= 3 ? 'var(--green)' : 'var(--gold)' }}
        >
          {rank}
        </span>

        {/* Name */}
        <div>
          <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
            {entry.name}
          </div>
        </div>

        {/* Total score */}
        <ColStat label="Total" value={formatScore(scoreNum)} colorClass={scoreClass} />

        {/* Proj. Earnings */}
        <ColStat label="Earnings" value={fmtMoney(entry.totalEarnings)} />

        {/* √ Score */}
        <ColStat
          label="√ Score"
          value={entry.totalSqrt.toFixed(1)}
          style={{ color: 'var(--green-light)', fontWeight: 600 }}
        />

        {/* Chevron */}
        <svg
          className={`chevron-icon w-4 h-4 flex-shrink-0 ${open ? 'open' : ''}`}
          style={{ color: '#7A7A7A' }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* ── Golfer breakdown ── */}
      {open && (
        <div style={{ borderTop: '1px solid var(--cream-dark)', background: '#faf8f3' }}>
          {/* Column headers */}
          <div
            className="grid px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase"
            style={{
              gridTemplateColumns: '1.4rem 1fr 2.6rem 2.6rem 2.6rem 2.6rem 5.5rem 5.5rem',
              background: 'var(--cream-dark)',
              color: '#7A7A7A',
              gap: '0.5rem',
            }}
          >
            <span className="text-center">Pos</span>
            <span>Golfer</span>
            <span className="text-center">R1</span>
            <span className="text-center">R2</span>
            <span className="text-center">R3</span>
            <span className="text-center">R4</span>
            <span className="text-right">Earnings</span>
            <span className="text-right">√ Score</span>
          </div>

          {entry.golfers.map((g) => (
            <GolferRow key={g.name} g={g} />
          ))}
        </div>
      )}
    </div>
  )
}

function GolferRow({ g }) {
  const comp    = g.comp
  const isCut   = comp?.isCut
  const isWD    = comp?.isWD
  const notFound = !g.found

  const dim = isCut || isWD || notFound

  const scoreNum   = comp ? parseScore(comp.score) : 0
  const scoreClass = scoreNum < 0 ? 'under' : scoreNum > 0 ? 'over' : 'even'
  const posLabel   = isCut ? 'CUT' : isWD ? 'WD' : notFound ? 'N/F' : (comp?.position ?? '—')

  const rounds  = comp?.rounds ?? []
  const thru    = comp?.thru ?? ''
  const scoreDisplay = isCut || isWD || notFound
    ? (isCut ? 'CUT' : isWD ? 'WD' : 'N/F')
    : (comp ? formatScore(scoreNum) : '—')

  return (
    <div
      className="grid items-center px-4 py-2 text-xs"
      style={{
        gridTemplateColumns: '1.4rem 1fr 2.6rem 2.6rem 2.6rem 2.6rem 5.5rem 5.5rem',
        borderBottom: '1px solid var(--cream-dark)',
        opacity: dim ? 0.45 : 1,
        gap: '0.5rem',
      }}
    >
      {/* Position */}
      <span className="font-semibold text-center text-[11px]" style={{ color: '#4A4A4A' }}>
        {posLabel}
      </span>

      {/* Golfer name */}
      <span className="font-medium" style={{ color: '#1A1A1A' }}>
        {g.name}
        {comp?.country && (
          <span className="ml-1 text-[10px]" style={{ color: '#7A7A7A' }}>{comp.country}</span>
        )}
      </span>

      {/* R1–R4 */}
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="text-center" style={{ color: '#4A4A4A' }}>
          {rounds[i] != null ? rounds[i] : '—'}
        </span>
      ))}

      {/* Total score */}
      <span
        className="text-right font-semibold"
        style={{ color: isCut || isWD || notFound ? 'var(--cut)' : `var(--${scoreClass === 'under' ? 'green' : scoreClass === 'over' ? 'cut' : 'text-mid'})` }}
      >
        {/* hack: inline the colour directly */}
        <ScoreDisplay val={scoreDisplay} isCut={isCut} isWD={isWD} notFound={notFound} scoreNum={scoreNum} />
      </span>

      {/* Earnings */}
      <span className="text-right" style={{ color: '#4A4A4A' }}>
        {isCut || isWD || notFound ? '$0' : fmtMoney(g.earnings)}
      </span>

      {/* √ Score */}
      <span className="text-right font-semibold" style={{ color: 'var(--green-light)' }}>
        {g.sqrt.toFixed(1)}
      </span>
    </div>
  )
}

function ScoreDisplay({ val, isCut, isWD, notFound, scoreNum }) {
  if (isCut || isWD || notFound) {
    return <span style={{ color: 'var(--cut)' }}>{val}</span>
  }
  const color = scoreNum < 0 ? 'var(--green)' : scoreNum > 0 ? 'var(--cut)' : '#4A4A4A'
  return <span style={{ color }}>{val}</span>
}

function ColStat({ label, value, colorClass, style }) {
  const valueColor =
    colorClass === 'under' ? 'var(--green)'
    : colorClass === 'over'  ? 'var(--cut)'
    : '#1A1A1A'

  return (
    <div className="text-right">
      <div className="text-sm font-semibold" style={{ color: valueColor, ...style }}>
        {value}
      </div>
      <div className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: '#7A7A7A' }}>
        {label}
      </div>
    </div>
  )
}

function fmtMoney(n) {
  if (!n) return '$0'
  return '$' + Math.round(n).toLocaleString()
}
