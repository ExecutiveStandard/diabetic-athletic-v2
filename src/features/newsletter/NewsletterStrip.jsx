import Button from '../../components/Button'
import { useAppStore } from '../../store/appStore'

export default function NewsletterStrip() {
  const { openModal } = useAppStore()

  return (
    <section className="bg-da-dark relative">
      <div className="da-container py-16 md:py-20">
        <div className="bg-da-card-accent rounded-3xl overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
            {/* Left: Stacked product images */}
            <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-da-cyan/10 to-da-gold/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-dots opacity-50"></div>
              <div className="relative flex items-center justify-center gap-2">
                {[1, 2, 3].map((n, i) => (
                  <div
                    key={n}
                    className="w-32 h-44 md:w-40 md:h-56 bg-gradient-to-br from-da-darker to-da-dark border border-white/10 rounded-lg shadow-2xl"
                    style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${Math.abs(i - 1) * 8}px)` }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <p className="text-white/30 text-xs uppercase tracking-wider px-3 text-center">Course {n}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Subscribe text + button */}
            <div className="card-padding">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-white leading-tight mb-4">
                Subscribe to the <span className="text-da-cyan">Diabetic Athletic Secrets</span>
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                Get a FREE digital copy of my 3 step formula to increasing your daily time in range by 30% with wizard-like stability and glucose level predictability in under 14 days.
              </p>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => openModal('newsletterOpen')}
              >
                Subscribe Now →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
