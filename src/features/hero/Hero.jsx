// src/features/hero/Hero.jsx
import Button from '../../components/Button'
import styles from './hero.module.css'
import { useAppStore } from '../../store/appStore'
import homeData from '../../data/home.json'

export default function Hero() {
  const { openModal } = useAppStore()
  const { hero } = homeData

  return (
    <section className={styles.hero}>
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left side: Text */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-da-dark mb-4">
            {hero.headline}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {hero.description}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => openModal('newsletterOpen')}
          >
            {hero.cta}
          </Button>
        </div>

        {/* Right side: Placeholder for coach image */}
        <div className={styles.heroImage}>
          <div className="w-full h-96 md:h-full bg-gradient-to-br from-da-cyan to-da-gold rounded-md flex items-center justify-center min-h-[400px]">
            <p className="text-white text-center">Coach Photo Placeholder</p>
          </div>
        </div>
      </div>
    </section>
  )
}
