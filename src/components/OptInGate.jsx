import { useEffect, useState } from 'react'
import { submitOptIn } from '../lib/optInSubmit'

// Reusable opt-in gate. Wraps any calculator (passed as children) with a
// split-layout landing page that captures first name + email before
// revealing the calculator.
//
// Per-calculator memory lives in localStorage:
//   - optin:<slug>   → presence means this calc is unlocked for this browser
//   - optinName      → cross-calc pre-fill name
//   - optinEmail     → cross-calc pre-fill email
//
// Three internal states: 'gated' | 'submitting' | 'unlocked'
export default function OptInGate({
  slug,
  headline,
  subhead,
  bullets = [],
  ctaText = 'Unlock',
  imageSrc = null,
  imageAlt = '',
  placeholderIcon = '✨',
  placeholderTagline = '',
  children,
}) {
  // Compute initial state synchronously from localStorage so the gate
  // never flashes for already-opted-in users.
  const [status, setStatus] = useState(() => {
    if (typeof window === 'undefined') return 'gated'
    return localStorage.getItem(`optin:${slug}`) ? 'unlocked' : 'gated'
  })

  const [firstName, setFirstName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('optinName') || ''
  })
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('optinEmail') || ''
  })

  const [fieldErrors, setFieldErrors] = useState({ firstName: '', email: '' })
  const [submitError, setSubmitError] = useState('')
  const [showBanner, setShowBanner] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const isReturningUser =
    status === 'gated' &&
    firstName.trim().length > 0 &&
    email.trim().length > 0

  // Fade out the success banner after 5s
  useEffect(() => {
    if (!showBanner) return
    const t = setTimeout(() => setShowBanner(false), 5000)
    return () => clearTimeout(t)
  }, [showBanner])

  function validate() {
    const errors = { firstName: '', email: '' }
    const trimmedName = firstName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (trimmedName.length < 1) errors.firstName = 'Please enter your first name'
    if (trimmedName.length > 50) errors.firstName = 'Name is too long'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      errors.email = 'Please enter a valid email address'
    return { errors, trimmedName, trimmedEmail }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const { errors, trimmedName, trimmedEmail } = validate()
    if (errors.firstName || errors.email) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({ firstName: '', email: '' })
    setStatus('submitting')
    try {
      const res = await submitOptIn({
        firstName: trimmedName,
        email: trimmedEmail,
        calcSlug: slug,
      })
      if (!res?.ok) throw new Error('submit failed')
      localStorage.setItem(`optin:${slug}`, '1')
      localStorage.setItem('optinName', trimmedName)
      localStorage.setItem('optinEmail', trimmedEmail)
      setShowBanner(true)
      setStatus('unlocked')
    } catch (err) {
      setSubmitError(
        "Something went wrong — try again in a moment, or email nick@diabeticathletic.com if it persists.",
      )
      setStatus('gated')
    }
  }

  // ─────────────────────────── UNLOCKED ───────────────────────────
  if (status === 'unlocked') {
    return (
      <>
        {showBanner && (
          <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-da-cyan text-da-dark font-bold px-6 py-3 rounded-lg shadow-lg text-sm">
            ✓ You're in — the calculator is unlocked below.
          </div>
        )}
        {children}
      </>
    )
  }

  // ─────────────────────────── GATED / SUBMITTING ───────────────────────────
  const submitting = status === 'submitting'

  return (
    <div className="min-h-screen bg-da-dark py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left column — content + form */}
        <div className="order-2 md:order-1">
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            {headline}
          </h1>
          <p className="text-white/70 text-base md:text-lg leading-relaxed mb-6">
            {subhead}
          </p>

          {bullets.length > 0 && (
            <ul className="space-y-3 mb-8">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80 text-sm md:text-base">
                  <span className="text-da-cyan font-bold mt-0.5">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {isReturningUser && (
            <p className="text-da-cyan text-sm mb-4">
              Welcome back, {firstName} — confirm to unlock.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <input
                type="text"
                aria-label="First name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                maxLength={50}
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition disabled:opacity-50"
              />
              {fieldErrors.firstName && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="mb-4">
              <input
                type="email"
                aria-label="Email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition disabled:opacity-50"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-da-gradient text-da-dark font-black uppercase tracking-wider py-4 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Unlocking…' : `${ctaText} →`}
            </button>

            {submitError && (
              <p className="text-red-400 text-sm mt-3">{submitError}</p>
            )}

            <p className="text-white/40 text-xs mt-4 text-center">
              We respect your inbox. Unsubscribe anytime. No spam, ever.
            </p>
          </form>
        </div>

        {/* Right column — image OR placeholder card */}
        <div className="order-1 md:order-2">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="w-full h-auto rounded-2xl"
            />
          ) : (
            <div className="bg-da-card rounded-2xl p-12 border-l-4 border-da-cyan flex flex-col items-center justify-center text-center min-h-[360px]">
              <div className="text-7xl mb-4">{placeholderIcon}</div>
              {placeholderTagline && (
                <p className="text-white/70 text-lg font-medium italic max-w-xs">
                  {placeholderTagline}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
