// Serverless function: proxies ESPN PGA leaderboard, caches 60s
// Deployed automatically by Vercel at /api/leaderboard

let cache = null
let cacheTime = 0
const CACHE_TTL = 60_000

// Direct tournament ID endpoint — 2026 Masters
const MASTERS_ID = '401811941'
const ESPN_URL = `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=${MASTERS_ID}`

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; MastersPool/1.0)',
  'Accept': 'application/json',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.json({ ...cache, fromCache: true })
  }

  try {
    const upstream = await fetch(ESPN_URL, { headers: FETCH_HEADERS })
    if (!upstream.ok) throw new Error(`ESPN returned ${upstream.status}`)
    const raw = await upstream.json()

    // ESPN wraps events under sports[0].leagues[0].events OR top-level events
    const events =
      raw.events ??
      raw.sports?.[0]?.leagues?.[0]?.events ??
      []

    // With a specific event ID there should be exactly one event
    const mastersEvent = events[0] ?? null

    if (!mastersEvent) {
      const empty = { event: null, competitors: [], cachedAt: Date.now() }
      cache = empty
      cacheTime = Date.now()
      return res.json(empty)
    }

    const competition = mastersEvent.competitions?.[0] ?? {}
    const currentRound = competition.status?.period ?? 1
    const competitors = (competition.competitors ?? []).map((c) => parseCompetitor(c, currentRound))

    // Debug: expose raw ESPN fields — find a player who has started R2
    const debugComp = (competition.competitors ?? []).find(
      (c) => (c.status?.thru ?? 0) > 0 &&
             !c.status?.type?.name?.includes('CUT') &&
             !c.status?.type?.name?.includes('WD')
    ) ?? (competition.competitors ?? [])[0]
    const debug = debugComp ? {
      name:           debugComp.athlete?.displayName,
      currentRound,
      score_field:    debugComp.score,
      status_dv:      debugComp.status?.displayValue,
      status_thru:    debugComp.status?.thru,
      stat_names:     (debugComp.statistics ?? []).map((s) => `${s.name}=${s.displayValue}`),
      linescore_vals: (debugComp.linescores ?? []).map((l) => `period=${l.period?.number} val=${l.value} dv=${l.displayValue} type=${l.type}`),
    } : null

    const payload = {
      event: {
        name:      mastersEvent.name,
        status:    mastersEvent.status?.type?.name ?? 'STATUS_UNKNOWN',
        completed: mastersEvent.status?.type?.completed ?? false,
        round:     competition.status?.period ?? null,
        purse:     extractPurse(mastersEvent),
      },
      competitors,
      cachedAt: Date.now(),
      debug,
    }

    cache = payload
    cacheTime = Date.now()
    return res.json(payload)
  } catch (err) {
    // On error, serve stale cache if available
    if (cache) return res.json({ ...cache, fromCache: true, stale: true })
    return res.status(502).json({ error: err.message })
  }
}

const AUGUSTA_PAR = 72

function parseCompetitor(c, currentRound = 1) {
  const statsMap = Object.fromEntries(
    (c.statistics ?? []).map((s) => [s.name, s])
  )

  const statusName = c.status?.type?.name ?? ''
  const isCut = statusName.includes('CUT')
  const isWD  = statusName.includes('WD') || statusName.includes('WITHDRAWN')
  const thru  = c.status?.thru ?? 0

  // Round scores — ESPN linescores store stroke totals per round.
  // Filter out placeholder entries (displayValue "-" or value 0 with no display).
  const allLinescores = (c.linescores ?? [])
  const rounds = allLinescores
    .filter((r) => r.value != null && r.value > 0 &&
                   r.displayValue && r.displayValue !== '-' && r.displayValue !== '--')
    .map((r) => Number(r.value))

  // Earnings — stat is named "officialAmount" in ESPN's Masters feed.
  let earnings = 0
  const earnStat = statsMap.officialAmount ?? statsMap.earnings ?? statsMap.moneyWon
  if (earnStat) {
    earnings =
      typeof earnStat.value === 'number' && earnStat.value > 0
        ? earnStat.value
        : parseInt((earnStat.displayValue ?? '').replace(/[^0-9]/g, ''), 10) || 0
  }

  // Total score to par — stat "scoreToPar" in ESPN's Masters feed.
  const rawScore = statsMap.scoreToPar?.displayValue ?? c.score?.displayValue ?? '-'
  const scoreClean = (rawScore === '-' || rawScore === '--') ? 'E' : rawScore
  const parsedTotal = parseInt(scoreClean, 10)
  const scoreRaw = !isNaN(parsedTotal) && Math.abs(parsedTotal) > 99 ? 'E' : scoreClean
  const totalToPar = isNaN(parsedTotal) ? 0 : parsedTotal

  // Today's round score to par — derived by subtracting completed rounds.
  // completedRounds = rounds before today that are fully in the books.
  // Each completed round: to-par = strokes - AUGUSTA_PAR.
  let todayRaw = null
  if (thru > 0) {
    const completedRoundCount = currentRound - 1
    const completedStrokes = rounds.slice(0, completedRoundCount).reduce((s, r) => s + r, 0)
    const completedToPar   = completedStrokes - (completedRoundCount * AUGUSTA_PAR)
    const todayToPar       = totalToPar - completedToPar
    todayRaw = todayToPar === 0 ? 'E' : todayToPar > 0 ? `+${todayToPar}` : `${todayToPar}`
  }

  return {
    id:       c.athlete?.id ?? null,
    name:     c.athlete?.displayName ?? '',
    country:  c.athlete?.flag?.alt ?? '',
    position: c.status?.position?.displayName ?? (isCut ? 'CUT' : isWD ? 'WD' : ''),
    score:    scoreRaw,
    today:    todayRaw,
    rounds,
    thru,
    earnings,
    isCut,
    isWD,
  }
}

function extractPurse(event) {
  // Some ESPN responses include purse in competition details
  const comp = event.competitions?.[0]
  return (
    comp?.purse ??
    comp?.situation?.prize?.amount ??
    null
  )
}
