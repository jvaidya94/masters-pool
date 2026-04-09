import { findCompetitor, parseScore, parsePosition } from './espn.js'

// Masters payout fractions for positions 1–50 (based on 2025 structure).
// Tied positions share the slots they span — see projectEarnings().
const PAYOUT_FRACTIONS = [
  0.2000, 0.1080, 0.0680, 0.0480, // 1–4
  0.0380, 0.0380,                  // T5 (2 players)
  0.03357,                         // 7
  0.0280, 0.0280, 0.0280, 0.0280, // T8 (4 players)
  0.0220, 0.0220,                  // T12 (2 players)
  0.0160, 0.0160, 0.0160, 0.0160, 0.0160, 0.0160, 0.0160, // T14 (7 players)
  0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100,          // T21 (6 players)
  0.00755, 0.00755,                // T27 (2 players)
  0.0068,  0.0068,  0.0068,       // T29 (3 players)
  0.00579, 0.00579, 0.00579, 0.00579, // T32 (4 players)
  0.00481, 0.00481, 0.00481, 0.00481, // T36 (4 players)
  0.0042,  0.0042,                 // T40 (2 players)
  0.0036,  0.0036,  0.0036, 0.0036,  // T42 (4 players)
  0.00291, 0.00291, 0.00291,       // T46 (3 players)
  0.0026,  0.00252,                // 49–50
]

export const DEFAULT_PURSE = 21_000_000

// Project earnings for a player at numericPosition in a field of tiedCount.
// Averages the payout slots covered by the tie group.
export function projectEarnings(numericPosition, tiedCount, purse = DEFAULT_PURSE) {
  if (!numericPosition || numericPosition < 1) return 0
  const start = numericPosition - 1
  const end   = Math.min(start + (tiedCount || 1), PAYOUT_FRACTIONS.length)
  const slots = PAYOUT_FRACTIONS.slice(start, end)
  if (!slots.length) return 0
  const avg = slots.reduce((s, f) => s + f, 0) / slots.length
  return Math.round(avg * purse)
}

export function sqrtScore(earnings) {
  return Math.sqrt(Math.max(0, earnings))
}

// Core function: given pool entries + ESPN competitors, return scored+sorted entries
export function computeEntryScores(entries, competitors, purse = DEFAULT_PURSE) {
  // Pre-compute tied counts so we only scan once
  const tiedCounts = buildTiedCounts(competitors)

  const scored = entries.map((entry) => {
    const golfers = entry.golfers.map((name) => {
      const comp = findCompetitor(competitors, name)

      if (!comp) {
        return { name, comp: null, earnings: 0, sqrt: 0, found: false }
      }

      let earnings = comp.earnings ?? 0

      // If no earnings reported yet (mid-tournament), project from position
      if (earnings === 0 && !comp.isCut && !comp.isWD) {
        const pos = parsePosition(comp.position)
        const tied = tiedCounts[comp.position] ?? 1
        earnings = projectEarnings(pos, tied, purse)
      }

      return {
        name,
        comp,
        earnings,
        sqrt: sqrtScore(earnings),
        found: true,
      }
    })

    const totalSqrt     = golfers.reduce((s, g) => s + g.sqrt, 0)
    const totalEarnings = golfers.reduce((s, g) => s + g.earnings, 0)
    const totalScore    = golfers.reduce((s, g) => {
      if (!g.comp || g.comp.isCut || g.comp.isWD) return s
      return s + parseScore(g.comp.score)
    }, 0)

    return { ...entry, golfers, totalSqrt, totalEarnings, totalScore }
  })

  // Sort by √ score descending (primary), then total earnings descending
  return scored.sort(
    (a, b) => b.totalSqrt - a.totalSqrt || b.totalEarnings - a.totalEarnings
  )
}

// Count how many active (non-cut, non-WD) players share each position string
function buildTiedCounts(competitors) {
  const counts = {}
  for (const c of competitors) {
    if (c.isCut || c.isWD || !c.position) continue
    counts[c.position] = (counts[c.position] ?? 0) + 1
  }
  return counts
}
