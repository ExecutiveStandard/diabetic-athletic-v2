// src/features/newsletter/NewsletterForm.jsx
import Button from '../../components/Button'
import { validateEmail, submitNewsletterSignup } from '../../lib/newsletter'
import { useNewsletterStore } from '../../store/newsletterStore'
import styles from './newsletter.module.css'

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className="text-sm text-gray-600 mb-2">
        Join Over 500+ Weekly Readers! Get a FREE digital copy of my 3 step formula to increasing your daily time in range by 30%.
      </p>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={styles.input}
          disabled={status === 'loading' || status === 'success'}
          required
          aria-label="Email address"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm" role="alert">{message}</p>
      )}

      {status === 'success' && (
        <p className="text-da-cyan text-sm" role="status">✓ {message}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={status === 'loading' || status === 'success'}
        className="w-full"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
      </Button>
    </form>
  )
}
