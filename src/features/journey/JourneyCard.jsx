// src/features/journey/JourneyCard.jsx
import Button from '../../components/Button'
import styles from './journey.module.css'

export default function JourneyCard({ name, description, status }) {
  const getButtonVariant = () => {
    if (status === 'Coming Soon') return 'outline'
    return 'primary'
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <h3 className="text-lg font-bold text-da-dark mb-2">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>
      <Button
        variant={getButtonVariant()}
        size="sm"
        disabled={status === 'Coming Soon'}
      >
        {status}
      </Button>
    </div>
  )
}
