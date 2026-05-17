import { findCompetitor, parseScore, parsePosition } from './espn.js'

// PGA Tour per-position payout fractions for positions 1–70 (2024 PGA Championship
// at Valhalla, purse $18.5M). These are PER POSITION — ties are handled at runtime
// by projectEarnings() which averages adjacent slots covered by the tie group.
// Total sums to ~1.000 (full purse distributed across paying positions).
const PAYOUT_FRACTIONS = [
  // 1–10
  0.180000, 0.108000, 0.068000, 0.048000, 0.040000,
  0.036250, 0.033750, 0.031250, 0.029250, 0.027250,
  // 11–20
  0.025375, 0.023625, 0.022250, 0.020750, 0.019250,
  0.017875, 0.016625, 0.015500, 0.014625, 0.013750,
  // 21–30
  0.012875, 0.012000, 0.011125, 0.010250, 0.009375,
  0.008500, 0.008250, 0.007950, 0.007650, 0.007375,
  // 31–40
  0.007125, 0.006875, 0.006625, 0.006375, 0.006125,
  0.005875, 0.005625, 0.005375, 0.005125, 0.004875,
  // 41–50
  0.004625, 0.004375, 0.004125, 0.003875, 0.003625,
  0.003375, 0.003125, 0.002875, 0.002625, 0.002375,
  // 51–60
  0.002125, 0.001875, 0.001625, 0.001375, 0.001125,
  0.000875, 0.000700, 0.000625, 0.000550, 0.000500,
  // 61–70 — small token payouts; sum across this block ~0.0046
  0.000475, 0.000465, 0.000455, 0.000445, 0.000435,
  0.000425, 0.000420, 0.000415, 0.000412, 0.000408,
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
    // Include cut/WD players in the stroke total — their score-to-par at the
    // time they exited still counts against the entry (drives the Worst Score
    // card and the per-entry total displayed on each card).
    const totalScore    = golfers.reduce((s, g) => {
      if (!g.comp) return s
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
