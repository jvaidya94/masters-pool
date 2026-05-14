// SVG recreation of the 2026 PGA Championship at Aronimink logo
export default function PGALogo({ width = 160, height = 200 }) {
  const navy = '#1D3068'
  return (
    <svg viewBox="0 0 300 370" width={width} height={height} xmlns="http://www.w3.org/2000/svg">

      {/* ── Oval crest ── */}
      <ellipse cx="150" cy="88" rx="62" ry="78" fill="none" stroke={navy} strokeWidth="3.5" />

      {/* AGC monogram – overlapping letters inside oval */}
      {/* Large G */}
      <text x="148" y="118" textAnchor="middle" fontFamily="Georgia, serif" fontSize="90"
            fontWeight="bold" fill={navy} letterSpacing="-4">G</text>
      {/* A overlaid upper-right */}
      <text x="168" y="82" textAnchor="middle" fontFamily="Georgia, serif" fontSize="52"
            fontWeight="bold" fill={navy}>A</text>
      {/* C overlaid lower-left */}
      <text x="132" y="118" textAnchor="middle" fontFamily="Georgia, serif" fontSize="46"
            fontWeight="bold" fill={navy}>C</text>

      {/* ── "20" left of oval, "26" right, with horizontal rules ── */}
      <line x1="18"  y1="96" x2="78"  y2="96" stroke={navy} strokeWidth="2" />
      <text x="48"  y="91" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22"
            fontWeight="bold" fill={navy}>20</text>

      <line x1="222" y1="96" x2="282" y2="96" stroke={navy} strokeWidth="2" />
      <text x="252" y="91" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22"
            fontWeight="bold" fill={navy}>26</text>

      {/* ── PGA ── */}
      <text x="150" y="248" textAnchor="middle" fontFamily="Georgia, serif" fontSize="128"
            fontWeight="900" fill={navy} letterSpacing="-2">PGA</text>

      {/* ── Double rules ── */}
      <line x1="18" y1="262" x2="282" y2="262" stroke={navy} strokeWidth="2.5" />
      <line x1="18" y1="270" x2="282" y2="270" stroke={navy} strokeWidth="1" />

      {/* ── ARONIMINK ── */}
      <text x="150" y="310" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="23"
            fontWeight="bold" letterSpacing="5" fill={navy}>ARONIMINK</text>
    </svg>
  )
}
