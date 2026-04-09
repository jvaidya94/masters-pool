import { useState, useEffect, useCallback } from 'react'
import poolsData from './data/pools.json'
import { computeEntryScores, DEFAULT_PURSE } from './lib/scoring.js'
import PasswordGate from './components/PasswordGate.jsx'
import Header       from './components/Header.jsx'
import Leaderboard  from './components/Leaderboard.jsx'
import Sidebar      from './components/Sidebar.jsx'

const POLL_MS = 60_000

export default function App() {
  const [activePool,   setActivePool]   = useState(null)
  const [competitors,  setCompetitors]  = useState([])
  const [event,        setEvent]        = useState(null)
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [fetchError,   setFetchError]   = useState(null)

  // ── Fetch leaderboard from our proxy ──────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCompetitors(data.competitors ?? [])
      setEvent(data.event ?? null)
      setLastUpdated(new Date())
      setFetchError(null)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Start polling once authenticated
  useEffect(() => {
    if (!activePool) return
    fetchLeaderboard()
    const id = setInterval(fetchLeaderboard, POLL_MS)
    return () => clearInterval(id)
  }, [activePool, fetchLeaderboard])

  // ── Auth ──────────────────────────────────────────────────────────────────
  function handleLogin(poolId) {
    const pool = poolsData.pools.find((p) => p.id === poolId)
    setActivePool(pool ?? null)
  }

  if (!activePool) {
    return <PasswordGate pools={poolsData.pools} onLogin={handleLogin} />
  }

  // ── Score entries against live field ─────────────────────────────────────
  const purse        = event?.purse ?? poolsData.purse ?? DEFAULT_PURSE
  const scoredEntries = computeEntryScores(activePool.entries, competitors, purse)

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <Header pool={activePool} event={event} lastUpdated={lastUpdated} />

      {/* Error banner */}
      {fetchError && (
        <div className="max-w-[1200px] mx-auto px-8 pt-4">
          <div
            className="rounded-sm px-4 py-2 text-xs"
            style={{ background: '#fff3f3', border: '1px solid #e57373', color: '#8B0000' }}
          >
            Could not reach ESPN ({fetchError}). Showing last known data.
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="max-w-[1200px] mx-auto px-8 py-8 grid gap-8 items-start"
           style={{ gridTemplateColumns: '1fr 340px' }}>
        <Leaderboard entries={scoredEntries} pool={activePool} event={event} />
        <Sidebar competitors={competitors} event={event} pool={activePool} />
      </div>
    </div>
  )
}
