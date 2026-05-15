// Serverless function: proxies ESPN PGA leaderboard, caches 60s
// Deployed automatically by Vercel at /api/leaderboard

let cache = null
let cacheTime = 0
const CACHE_TTL = 60_000

// 2026 PGA Championship
const TOURNAMENT_ID = '401811947'
const ESPN_URL = `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=${TOURNAMENT_ID}`

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

function parseCompetitor(c, currentRound = 1) {
  const statsMap = Object.fromEntries(
    (c.statistics ?? []).map((s) => [s.name, s])
  )

  const statusName = c.status?.type?.name ?? ''
  const isCut = statusName.includes('CUT')
  const isWD  = statusName.includes('WD') || statusName.includes('WITHDRAWN')
  const thru  = c.status?.thru ?? 0

  // Round strokes per period. ESPN includes `period` on each linescore so we
  // can index by round number directly (rounds[0]=R1 strokes, rounds[1]=R2…)
  // and also extract today's to-par from the current round's displayValue.
  const allLinescores = (c.linescores ?? [])
  const rounds = []
  let todayRaw = null
  for (const l of allLinescores) {
    if (!l.period) continue
    if (typeof l.value === 'number' && l.value > 0) {
      rounds[l.period - 1] = Number(l.value)
    }
    // Capture today's round-to-par directly (e.g. "+3", "-2", "E")
    if (l.period === currentRound && l.displayValue && l.displayValue !== '-') {
      todayRaw = l.displayValue
    }
  }
  // Only show "today" for active players in a live round
  if (!(thru > 0 && !isCut && !isWD)) todayRaw = null

  // Earnings — stat is named "officialAmount" in ESPN's feed.
  let earnings = 0
  const earnStat = statsMap.officialAmount ?? statsMap.earnings ?? statsMap.moneyWon
  if (earnStat) {
    earnings =
      typeof earnStat.value === 'number' && earnStat.value > 0
        ? earnStat.value
        : parseInt((earnStat.displayValue ?? '').replace(/[^0-9]/g, ''), 10) || 0
  }

  // Cumulative total to par — `scoreToPar` is always the cumulative score.
  const rawScore   = statsMap.scoreToPar?.displayValue ?? '-'
  const scoreClean = (rawScore === '-' || rawScore === '--') ? 'E' : rawScore
  const parsedTotal = parseInt(scoreClean, 10)
  // Clamp year-as-score placeholder (e.g. "2026") to "E"
  const scoreRaw = (!isNaN(parsedTotal) && Math.abs(parsedTotal) > 99) ? 'E' : scoreClean

  // Tee time — for unstarted players status.displayValue is an ISO datetime string
  let teeTime = null
  if (thru === 0 && !isCut && !isWD) {
    const dv = c.status?.displayValue ?? ''
    if (dv.includes('T') && dv.includes(':')) teeTime = dv
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
    teeTime,
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
