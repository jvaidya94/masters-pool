import MastersLogo from './MastersLogo.jsx'

export default function Header({ pool, event, lastUpdated }) {
  const isLive      = event && !event.completed && event.status !== 'STATUS_SCHEDULED'
  const isFinal     = event?.completed
  const roundLabel  = event?.round ? `Round ${event.round}` : null

  const badgeLabel = isFinal
    ? '✓ Final Results'
    : isLive
    ? (roundLabel ?? 'Live')
    : 'Pre-Tournament'

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header style={{ background: 'var(--green)', borderBottom: '3px solid var(--gold)' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-center justify-between">

        {/* Left: logo + pool name */}
        <div className="flex items-center gap-4">
          <MastersLogo width={52} height={38} />
          <div style={{ borderLeft: '1px solid rgba(201,162,74,0.35)', paddingLeft: '1rem' }}>
            <h1 className="font-display text-xl font-semibold tracking-wide" style={{ color: 'var(--gold)' }}>
              {pool.name}
            </h1>
            <p className="text-[11px] tracking-widest uppercase mt-0.5" style={{ color: '#7a9acc' }}>
              PGA Championship · May 2026
            </p>
          </div>
        </div>

        {/* Right: status badge + last updated */}
        <div className="text-right">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm text-[11px] font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(201,162,74,0.15)', border: '1px solid var(--gold)', color: 'var(--gold-light)' }}
          >
            {isLive && (
              <span
                className="pulse-dot w-2 h-2 rounded-full"
                style={{ background: '#4caf50', display: 'inline-block' }}
              />
            )}
            {badgeLabel}
          </div>
          {updatedStr && (
            <p className="text-[11px] mt-1.5 tracking-wide" style={{ color: '#7aaa90' }}>
              Updated {updatedStr} · refreshes every 60s
            </p>
          )}
        </div>

      </div>

      {/* Pool tab — locked to current pool, no switching */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <span
            className="inline-block font-display text-sm font-medium tracking-wide py-3 px-4"
            style={{ color: 'var(--gold)', borderBottom: '3px solid var(--gold)' }}
          >
            {pool.name}
          </span>
        </div>
      </div>
    </header>
  )
}
