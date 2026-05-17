import { useState } from 'react'
import { formatScore, parseScore } from '../lib/espn.js'

const RANK_COLORS = { 1: 'var(--gold)', 2: '#A8A9AD', 3: '#C47A30' }

export default function TeamCard({ entry, rank, rankLabel, defaultExpanded = false }) {
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
        className="grid items-center gap-2 md:gap-4 px-3 md:px-4 py-3 cursor-pointer select-none"
        style={{ gridTemplateColumns: 'var(--card-cols)' }}
        onClick={() => setOpen(!open)}
      >
        {/* Rank */}
        <span
          className="font-display text-lg font-bold text-center"
          style={{ color: rank <= 3 ? 'var(--green)' : 'var(--gold)', fontSize: rankLabel?.startsWith('T') ? '0.85rem' : undefined }}
        >
          {rankLabel ?? rank}
        </span>

        {/* Name */}
        <div>
          <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
            {entry.name}
          </div>
        </div>

        {/* Total score — hidden on mobile */}
        <div className="hidden md:block">
          <ColStat label="Total" value={formatScore(scoreNum)} colorClass={scoreClass} />
        </div>

        {/* Proj. Earnings — hidden on mobile */}
        <div className="hidden md:block">
          <ColStat label="Earnings" value={fmtMoney(entry.totalEarnings)} />
        </div>

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
              gridTemplateColumns: 'var(--golfer-cols)',
              background: 'var(--cream-dark)',
              color: '#7A7A7A',
              gap: '0.5rem',
            }}
          >
            <span className="text-center">Pos</span>
            <span>Golfer</span>
            <span className="text-center">Score</span>
            <span className="text-center hidden md:block">Today</span>
            <span className="text-center">Thru</span>
            <span className="text-center hidden md:block">R1</span>
            <span className="text-center hidden md:block">R2</span>
            <span className="text-center hidden md:block">R3</span>
            <span className="text-center hidden md:block">R4</span>
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
  const thru    = comp?.thru ?? 0
  const todayNum   = comp?.today != null ? parseScore(comp.today) : null

  // Format tee time from ISO string to local time e.g. "1:07 PM"
  const teeTimeLabel = (() => {
    if (!comp?.teeTime) return null
    try {
      return new Date(comp.teeTime).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
      })
    } catch { return null }
  })()
  // Always show the numeric score-to-par when we have a comp (even for cut/WD).
  // CUT / WD status is already conveyed by the POS column.
  const scoreDisplay = notFound
    ? 'N/F'
    : (comp ? formatScore(scoreNum) : '—')

  return (
    <div
      className="grid items-center px-4 py-2 text-xs"
      style={{
        gridTemplateColumns: 'var(--golfer-cols)',
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

      {/* Total score to par */}
      <span className="text-center font-semibold">
        <ScoreDisplay val={scoreDisplay} isCut={isCut} isWD={isWD} notFound={notFound} scoreNum={scoreNum} />
      </span>

      {/* Today's round score */}
      <span className="text-center font-semibold hidden md:block">
        {todayNum != null
          ? <span style={{ color: todayNum < 0 ? 'var(--green)' : todayNum > 0 ? 'var(--cut)' : '#4A4A4A' }}>
              {formatScore(todayNum)}
            </span>
          : <span style={{ color: '#7A7A7A' }}>—</span>
        }
      </span>

      {/* Thru / Tee time */}
      <span className="text-center text-[11px]" style={{ color: '#7A7A7A' }}>
        {thru > 0 ? thru : teeTimeLabel ?? '—'}
      </span>

      {/* R1–R4 */}
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="text-center hidden md:block" style={{ color: '#4A4A4A' }}>
          {rounds[i] != null ? rounds[i] : '—'}
        </span>
      ))}

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
  if (notFound) {
    return <span style={{ color: 'var(--cut)' }}>{val}</span>
  }
  // Cut/WD players still show their numeric score; color it by under/over par.
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
