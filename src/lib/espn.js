// Name normalisation: lowercase + strip accents + collapse whitespace
// Handles Højgaard→Hojgaard, Åberg→Aberg, etc.
export function normalizeName(name) {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Match a pool golfer name against the ESPN competitors list.
// Priority: 1) exact normalised match  2) last-name-only match (only if unique)
export function findCompetitor(competitors, golferName) {
  const target = normalizeName(golferName)

  const exact = competitors.find((c) => normalizeName(c.name) === target)
  if (exact) return exact

  // Fallback: last name match (guards against "Jon" vs "John", accent typos)
  const lastName = target.split(' ').pop()
  if (lastName.length < 3) return null // too short to be safe
  const byLastName = competitors.filter((c) =>
    normalizeName(c.name).split(' ').pop() === lastName
  )
  return byLastName.length === 1 ? byLastName[0] : null
}

// Parse ESPN score string to number  ("E" → 0, "-11" → -11, "+2" → 2)
export function parseScore(scoreStr) {
  if (!scoreStr || scoreStr === 'E' || scoreStr === 'EVEN') return 0
  const n = parseInt(scoreStr, 10)
  return isNaN(n) ? 0 : n
}

// Format a numeric score for display
export function formatScore(n) {
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : `${n}`
}

// Parse position string to number ("T3" → 3, "1" → 1, "CUT" → null)
export function parsePosition(posStr) {
  if (!posStr) return null
  const n = parseInt(posStr.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? null : n
}
