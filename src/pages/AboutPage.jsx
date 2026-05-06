import Button from '../components/Button'
import { useAppStore } from '../store/appStore'

export default function AboutPage() {
  const { openModal } = useAppStore()

  return (
    <div className="bg-da-dark bg-dots">
      {/* Hero */}
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Who We Are</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            About <span className="text-da-gold">Diabetic Athletic</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Empowering Type 1 Diabetics to live stronger, leaner, and more confident lives through proven coaching strategies.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="da-container section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-da-cyan/25 to-da-gold/25 blur-3xl pointer-events-none"></div>
              <div className="relative aspect-[4/5] bg-gradient-to-br from-da-dark to-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                <p className="text-white/40 uppercase tracking-wider text-xs">Coach Photo</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Our Mission</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase leading-[1.1] text-white mb-8">
              More <span className="text-da-gold">Athletic</span>, Less Diabetic
            </h2>
            <div className="space-y-5 text-white/70 text-base md:text-lg leading-relaxed mb-10">
              <p>
                Our mission is to help as many of us living with T1D to enjoy and experience the freedom that a strong, lean and athletic body and mind can do for those of us looking to do more than "manage sugar levels" each day.
              </p>
              <p>
                To be effortlessly above average and to lead a life more ATHLETIC and far less "Diabetic" in every way.
              </p>
              <p>
                We believe that with the right strategies, anyone living with Type 1 Diabetes can outperform the average — turning what feels like a daily struggle into a competitive advantage.
              </p>
            </div>
            <Button variant="gradient" size="lg" onClick={() => openModal('newsletterOpen')}>
              Join Our Community →
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
