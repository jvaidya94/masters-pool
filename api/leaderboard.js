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
    const competitors = (competition.competitors ?? []).map(parseCompetitor)

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

function parseCompetitor(c) {
  const statsMap = Object.fromEntries(
    (c.statistics ?? []).map((s) => [s.name, s])
  )

  // Round scores — sort by period number
  const rounds = (c.linescores ?? [])
    .filter((r) => r.period?.number)
    .sort((a, b) => a.period.number - b.period.number)
    .map((r) => (r.value != null ? Number(r.value) : null))

  const statusName = c.status?.type?.name ?? ''
  const isCut = statusName.includes('CUT')
  const isWD  = statusName.includes('WD') || statusName.includes('WITHDRAWN')

  // Earnings: ESPN may store as number (value) or formatted string (displayValue)
  let earnings = 0
  const earnStat = statsMap.earnings ?? statsMap.moneyWon
  if (earnStat) {
    earnings =
      typeof earnStat.value === 'number'
        ? earnStat.value
        : parseInt((earnStat.displayValue ?? '').replace(/[^0-9]/g, ''), 10) || 0
  }

  // Score to par — normalise "E" → "0", strip "+" prefix.
  // Guard against ESPN returning the year (e.g. "2026") for pre-round players.
  const rawScore =
    statsMap.score?.displayValue ??
    statsMap.topar?.displayValue ??
    c.status?.displayValue ??
    'E'
  const parsedN = parseInt(rawScore, 10)
  const scoreRaw = (!isNaN(parsedN) && Math.abs(parsedN) > 99) ? 'E' : rawScore

  return {
    id:       c.athlete?.id ?? null,
    name:     c.athlete?.displayName ?? '',
    country:  c.athlete?.flag?.alt ?? '',
    position: c.status?.position?.displayName ?? (isCut ? 'CUT' : isWD ? 'WD' : ''),
    score:    scoreRaw,
    rounds,
    thru:     c.status?.thru ?? (statusName.includes('COMPLETE') ? 'F' : ''),
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
