// SVG recreation of the 2026 PGA Championship at Aronimink logo
// color prop: pass 'white' for use on dark backgrounds, defaults to navy
export default function PGALogo({ width = 160, height = 200, color = '#1D3068' }) {
  return (
    <svg viewBox="0 0 300 370" width={width} height={height} xmlns="http://www.w3.org/2000/svg">

      {/* ── Oval crest ── */}
      <ellipse cx="150" cy="88" rx="62" ry="78" fill="none" stroke={color} strokeWidth="3.5" />

      {/* AGC monogram – overlapping letters inside oval */}
      <text x="148" y="118" textAnchor="middle" fontFamily="Georgia, serif" fontSize="90"
            fontWeight="bold" fill={color} letterSpacing="-4">G</text>
      <text x="168" y="82" textAnchor="middle" fontFamily="Georgia, serif" fontSize="52"
            fontWeight="bold" fill={color}>A</text>
      <text x="132" y="118" textAnchor="middle" fontFamily="Georgia, serif" fontSize="46"
            fontWeight="bold" fill={color}>C</text>

      {/* ── "20" left of oval, "26" right, with horizontal rules ── */}
      <line x1="18"  y1="96" x2="78"  y2="96" stroke={color} strokeWidth="2" />
      <text x="48"  y="91" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22"
            fontWeight="bold" fill={color}>20</text>

      <line x1="222" y1="96" x2="282" y2="96" stroke={color} strokeWidth="2" />
      <text x="252" y="91" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22"
            fontWeight="bold" fill={color}>26</text>

      {/* ── PGA ── */}
      <text x="150" y="248" textAnchor="middle" fontFamily="Georgia, serif" fontSize="128"
            fontWeight="900" fill={color} letterSpacing="-2">PGA</text>

      {/* ── Double rules ── */}
      <line x1="18" y1="262" x2="282" y2="262" stroke={color} strokeWidth="2.5" />
      <line x1="18" y1="270" x2="282" y2="270" stroke={color} strokeWidth="1" />

      {/* ── ARONIMINK ── */}
      <text x="150" y="310" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="23"
            fontWeight="bold" letterSpacing="5" fill={color}>ARONIMINK</text>
    </svg>
  )
}
