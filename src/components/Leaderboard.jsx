import TeamCard from './TeamCard.jsx'

export default function Leaderboard({ entries, pool, event }) {
  const isFinal = event?.completed ?? false
  const heading = isFinal ? 'Final Standings' : 'Live Standings'

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--green)' }}>
          {heading}
        </h2>
        <span className="text-[11px] font-medium tracking-widest uppercase" style={{ color: '#7A7A7A' }}>
          {pool.name} · {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <TeamCard
            key={entry.id}
            entry={entry}
            rank={i + 1}
            defaultExpanded={i < 3}
          />
        ))}
      </div>

      {entries.length === 0 && (
        <div
          className="rounded-sm p-8 text-center text-sm"
          style={{ background: 'white', border: '1px solid var(--cream-dark)', color: '#7A7A7A' }}
        >
          No entries found for this pool.
        </div>
      )}
    </section>
  )
}
