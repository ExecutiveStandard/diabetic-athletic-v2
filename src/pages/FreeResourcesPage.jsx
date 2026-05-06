import { Link } from 'react-router-dom'
import Button from '../components/Button'

const resources = [
  {
    title: 'Calorie Calculator',
    description: 'Calculate your daily caloric needs as a type 1 diabetic. Optimize your nutrition for fitness goals.',
    cta: 'Calculate Now',
    badge: 'Tool',
    href: '#'
  },
  {
    title: 'Protein Calculator',
    description: 'Find your optimal protein intake for muscle gain, fat loss, or maintenance with diabetes considerations.',
    cta: 'Calculate Now',
    badge: 'Tool',
    href: '#'
  },
  {
    title: '5 Day Diabetic Domination Toolkit',
    description: 'Catapult your time in range to 85% in just 5 days with this free downloadable PDF guide.',
    cta: 'Download Free',
    badge: 'PDF',
    href: '#'
  },
  {
    title: 'Insulin Dosing Cheat Sheet',
    description: 'Quick reference guide for adjusting insulin around exercise, meals, and stress.',
    cta: 'Download Free',
    badge: 'PDF',
    href: '#'
  },
  {
    title: 'Pre-Workout Nutrition Guide',
    description: 'Learn what to eat before exercise to maintain stable glucose and maximize performance.',
    cta: 'Read Guide',
    badge: 'Guide',
    href: '#'
  },
  {
    title: 'Weekly Newsletter',
    description: 'Get the Diabetic Athletic secrets delivered to your inbox every week.',
    cta: 'Subscribe',
    badge: 'Newsletter',
    href: '#'
  }
]

export default function FreeResourcesPage() {
  return (
    <div className="bg-da-dark bg-dots">
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">100% Free</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Free <span className="text-da-gold">Resources</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Calculators, guides, and tools to help you master your T1D and crush your fitness goals — all completely free.
          </p>
        </div>
      </section>

      <section className="da-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, idx) => (
            <article key={idx} className="bg-da-card rounded-xl overflow-hidden flex flex-col h-full hover-lift">
              <div className="aspect-[16/10] bg-gradient-to-br from-da-cyan/15 to-da-gold/15 flex items-center justify-center border-b border-white/5 relative">
                <span className="absolute top-4 right-4 bg-da-cyan/20 text-da-cyan text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full border border-da-cyan/30">
                  {resource.badge}
                </span>
                <p className="text-white/30 uppercase tracking-wider text-xs">Resource Image</p>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white mb-4 leading-tight">
                  {resource.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1">
                  {resource.description}
                </p>
                <Button variant="gradient" size="md" className="w-full">
                  {resource.cta}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
