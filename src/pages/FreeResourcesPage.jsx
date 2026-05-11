import { Link } from 'react-router-dom'
import Button from '../components/Button'

const calculators = [
  {
    slug: 'calorie',
    name: 'Calorie & TDEE Calculator',
    tagline: 'Your daily energy blueprint',
    description: 'Calculate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) using the proven Mifflin-St Jeor formula. Get personalized calorie targets for fat loss, maintenance, and muscle gain — calibrated specifically for your activity level.',
    badge: 'Most Popular',
  },
  {
    slug: 'protein',
    name: 'Protein Intake Calculator',
    tagline: 'Build muscle, manage glucose',
    description: 'Discover the optimal daily protein intake to preserve muscle, improve insulin sensitivity, and accelerate recovery. Tailored ranges for cutting, maintenance, and muscle building, with per-meal distribution recommendations.',
    badge: 'Essential',
  },
  {
    slug: 'magic-ratio',
    name: 'The Magic Ratio Calculator',
    tagline: 'Wizard-like accuracy, athlete-like confidence',
    description: 'Your perfect starting point to find your insulin-to-carb (I:C) ratios and Insulin Sensitivity Factor (ISF). Get morning, afternoon, and evening ICRs plus full meal-time dose calculations including carb coverage and high-BG correction. Built for Type 1 diabetics who want predictable, accurate dosing.',
    badge: 'T1D Essential',
  },
  {
    slug: 'cardio',
    name: 'Heart Rate Zones Calculator',
    tagline: 'Train smarter, not harder',
    description: 'Calculate your 5 personalized heart rate training zones using the Karvonen method (which factors in your resting heart rate). Know exactly when to push, when to recover, and how to optimize cardio for fat loss vs endurance.',
    badge: 'Performance',
  },
  {
    slug: 'pre-workout-glucose',
    name: 'Pre-Workout Glucose Predictor',
    tagline: 'Predict end-glucose before you train',
    description: 'Plug in your starting glucose, CGM trend, IOB, and the workout you\'re about to do. Get a literature-grounded prediction of where your glucose will land and whether you need to fuel up first. Built on Riddell consensus + EXTOD guidelines.',
    badge: 'NEW',
  },
]

export default function FreeResourcesPage() {
  return (
    <div className="bg-da-dark bg-dots">
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Free Resources</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Diabetic Athletic <span className="text-da-gold">Toolkit</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Five free, fully-functional calculators built for Type 1 diabetics serious about their fitness. No email gates on the math — just plug in your numbers and get answers.
          </p>
        </div>
      </section>

      <section className="da-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {calculators.map((calc) => (
            <article key={calc.slug} className="bg-da-card rounded-2xl overflow-hidden hover-lift flex flex-col h-full">
              <div className="p-8 md:p-10 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-da-cyan/20 to-da-gold/20 border border-da-cyan/30 flex items-center justify-center">
                    <span className="text-da-cyan font-black text-xl uppercase tracking-wider">{calc.slug.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="bg-da-gold/15 border border-da-gold/30 text-da-gold text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full">
                    {calc.badge}
                  </span>
                </div>
                <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">{calc.tagline}</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white mb-4 leading-tight">
                  {calc.name}
                </h2>
                <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8 flex-1">
                  {calc.description}
                </p>
                <Link to={`/calculators/${calc.slug}`}>
                  <Button variant="gradient" size="lg" className="w-full">
                    Open Calculator →
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
