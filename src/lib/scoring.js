import { findCompetitor, parseScore, parsePosition } from './espn.js'

// PGA Championship payout fractions for positions 1–70 (based on 2025 structure).
// Tied positions share the slots they span — see projectEarnings().
const PAYOUT_FRACTIONS = [
  0.1800, 0.1080, 0.0680, 0.0480, // 1–4
  0.0385, 0.0385,                  // T5 (2 players)
  0.0335,                          // 7
  0.0290, 0.0290, 0.0290, 0.0290, // T8 (4 players)
  0.0220, 0.0220, 0.0220,          // T12 (3 players)
  0.0180, 0.0180, 0.0180, 0.0180, 0.0180, // T15 (5 players)
  0.0130, 0.0130, 0.0130, 0.0130, 0.0130, // T20 (5 players)
  0.0095, 0.0095, 0.0095, 0.0095, 0.0095, // T25 (5 players)
  0.0073, 0.0073, 0.0073, 0.0073, 0.0073, // T30 (5 players)
  0.0062, 0.0062, 0.0062, 0.0062, 0.0062, // T35 (5 players)
  0.0052, 0.0052, 0.0052, 0.0052, 0.0052, // T40 (5 players)
  0.0044, 0.0044, 0.0044, 0.0044, 0.0044, // T45 (5 players)
  0.0038, 0.0038, 0.0038, 0.0038, 0.0038, // T50 (5 players)
  0.0033, 0.0033, 0.0033, 0.0033, 0.0033, // T55 (5 players)
  0.0030, 0.0030, 0.0030, 0.0030, 0.0030, // T60 (5 players)
  0.0028, 0.0028, 0.0028, 0.0028, 0.0028, // T65 (5 players)
  0.0026,                          // 70
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
