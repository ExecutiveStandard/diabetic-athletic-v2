import Button from '../../components/Button'
import { useAppStore } from '../../store/appStore'

export default function DiscoveryCallCTA() {
  const { openModal } = useAppStore()

  return (
    <section className="bg-da-dark relative">
      <div className="section-divider"></div>
      <div className="da-container py-20 md:py-24">
        <div className="bg-da-card-accent rounded-3xl overflow-hidden border border-white/10 relative">
          <div className="absolute inset-0 bg-dots opacity-30"></div>
          <div className="relative card-padding md:py-16 md:px-12 text-center">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">
              Not Sure Where to Start?
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-[1.1] text-white mb-6 max-w-3xl mx-auto">
              Schedule a <span className="text-da-gold">Discovery Call</span> Today!
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              A quick session to figure out where you're falling down, what needs to change and if we'd be a good fit to work together. Let's tackle T1D head-on and pave the way to a healthier, happier you!
            </p>
            <Button variant="gradient" size="lg" onClick={() => openModal('newsletterOpen')}>
              Book Your Call Here →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
