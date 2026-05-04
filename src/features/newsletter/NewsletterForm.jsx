// src/features/newsletter/NewsletterForm.jsx
import Button from '../../components/Button'
import { validateEmail, submitNewsletterSignup } from '../../lib/newsletter'
import { useNewsletterStore } from '../../store/newsletterStore'

export default function NewsletterForm({ onClose }) {
  const { email, setEmail, status, message, setStatus, reset } = useNewsletterStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      setStatus('error', 'Please enter a valid email')
      return
    }
    setStatus('loading')
    const result = await submitNewsletterSignup(email, 'newsletter-modal')
    if (result.success) {
      setStatus('success', result.message)
      setTimeout(() => {
        reset()
        onClose && onClose()
      }, 2000)
    } else {
      setStatus('error', result.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-white/70 text-sm">
        Join Over 500+ Weekly Readers! Get a FREE digital copy of my 3 step formula to increasing your daily time in range by 30%.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition disabled:opacity-50"
        disabled={status === 'loading' || status === 'success'}
        required
        aria-label="Email address"
      />

      {status === 'error' && (
        <p className="text-red-400 text-sm" role="alert">{message}</p>
      )}
      {status === 'success' && (
        <p className="text-da-cyan text-sm" role="status">✓ {message}</p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="md"
        disabled={status === 'loading' || status === 'success'}
        className="w-full"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
      </Button>
    </form>
  )
}
