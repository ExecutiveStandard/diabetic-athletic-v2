// src/features/hero/Hero.jsx
import Button from '../../components/Button'
import { useAppStore } from '../../store/appStore'
import homeData from '../../data/home.json'

export default function Hero() {
  const { openModal } = useAppStore()
  const { hero } = homeData

  return (
    <section className="bg-da-dark bg-dots relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side: Text */}
        <div>
          <p className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-4">
            The Official Website Of Diabetic Athletic
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-tight tracking-tight text-white mb-8">
            Known For Turning <span className="text-da-cyan">Diabetic Struggles</span> Into <span className="underline-gold">Fitness Successes</span>
          </h1>
          <Button
            variant="gradient"
            size="lg"
            onClick={() => openModal('newsletterOpen')}
          >
            Subscribe →
          </Button>
          <p className="text-white/60 mt-4 text-sm">Join Over 500+ Weekly Readers!</p>
        </div>

        {/* Right side: Coach Photo Placeholder */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-da-cyan/30 to-da-gold/30 blur-3xl"></div>
          <div className="relative w-full h-[500px] bg-gradient-to-br from-da-dark to-da-darker border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-da-cyan/20 via-transparent to-da-gold/20"></div>
            <p className="text-white/40 text-center relative z-10 uppercase tracking-wider text-sm">Coach Photo<br/>(Nicholas Caracandas)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
