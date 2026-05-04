import Button from '../../components/Button'
import { useAppStore } from '../../store/appStore'

export default function CoachBio() {
  const { openModal } = useAppStore()

  return (
    <section className="bg-da-darker relative">
      <div className="section-divider"></div>
      <div className="da-container section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Photo */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-da-cyan/25 to-da-gold/25 blur-3xl pointer-events-none"></div>
              <div className="relative aspect-[4/5] bg-gradient-to-br from-da-dark to-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-da-cyan/10 via-transparent to-da-gold/10"></div>
                <p className="text-white/40 uppercase tracking-wider text-xs relative z-10">Coach Photo</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="lg:col-span-7">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Our Coach</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-8">
              Nicholas <span className="text-da-gold">Caracandas</span>
            </h2>
            <div className="space-y-5 text-white/70 text-base md:text-lg leading-relaxed mb-10">
              <p>
                My name is Nicholas Caracandas and I'm a Diabetic Management Strategist.
              </p>
              <p>
                As a type 1 diabetic for 30 years, a certified fitness coach, ex competitive athlete and PT working 1-1 for just as long, you get to develop a deep level of understanding about what it takes to navigate exercise, diabetes and nutritional strategies in order to live the best quality life with T1D.
              </p>
              <p>
                Our mission is to help as many of us living with T1D to enjoy and experience the freedom that a strong, lean and athletic body and mind can do for those of us looking to do more than "manage sugar levels" each day.
              </p>
            </div>
            <Button variant="gradient" size="lg" onClick={() => openModal('newsletterOpen')}>
              Book Your Discovery Call →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
