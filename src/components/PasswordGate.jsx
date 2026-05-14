import { useState } from 'react'
import MastersLogo from './MastersLogo.jsx'

export default function PasswordGate({ pools, onLogin }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const match = pools.find((p) => p.password === pw.trim())
    if (match) {
      onLogin(match.id)
    } else {
      setError('Incorrect password. Please try again.')
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 400)
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'var(--green)' }}
    >
      {/* Logo */}
      <div className="mb-8">
        <MastersLogo width={180} height={130} />
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-6 rounded-sm px-12 py-10 w-[360px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,162,74,0.35)' }}
      >
        <div className="text-center">
          <h2
            className="font-display text-2xl font-semibold tracking-wide"
            style={{ color: 'var(--gold)' }}
          >
            PGA Championship Pool
          </h2>
          <p className="mt-1 text-xs tracking-widest uppercase" style={{ color: '#7a9acc' }}>
            PGA Championship · May 2026
          </p>
        </div>

        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError('') }}
          placeholder="Enter password"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className={[
            'w-full rounded-sm px-4 py-3 text-center text-sm tracking-widest outline-none transition-all',
            shake ? 'animate-[shake_0.3s_ease]' : '',
          ].join(' ')}
          style={{
            background:   'rgba(255,255,255,0.08)',
            border:       `1px solid ${error ? '#e57373' : 'rgba(201,162,74,0.4)'}`,
            color:        'var(--cream)',
            fontFamily:   'Inter, sans-serif',
          }}
        />

        <button
          type="submit"
          className="w-full rounded-sm py-3 font-display font-semibold tracking-widest transition-colors"
          style={{ background: 'var(--gold)', color: 'var(--green)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
        >
          Enter
        </button>

        <p className="min-h-4 text-xs text-center" style={{ color: '#e57373' }}>
          {error}
        </p>
      </form>

      <p className="mt-12 text-[10px] tracking-widest uppercase" style={{ color: 'rgba(122,170,144,0.5)' }}>
        Invitation only
      </p>
    </div>
  )
}
