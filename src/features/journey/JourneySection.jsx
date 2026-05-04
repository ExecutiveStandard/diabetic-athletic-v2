import JourneyCard from './JourneyCard'
import homeData from '../../data/home.json'

export default function JourneySection() {
  const { journey } = homeData

  const getGridClasses = (count) => {
    if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-8'
    return 'grid grid-cols-1 md:grid-cols-2 gap-8'
  }

  return (
    <section className="bg-da-dark bg-dots relative">
      {/* Top divider gradient */}
      <div className="section-divider"></div>

      <div className="da-container section-padding">
        {/* Section header */}
        <div className="text-center mb-20 md:mb-32">
          <p className="text-da-cyan uppercase tracking-widest text-xs md:text-sm font-bold mb-4">Your Path</p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-6 text-white">
            Start Your <span className="text-da-gold">Journey</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
            {journey.description}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-24 md:space-y-32">
          {journey.steps.map((step) => (
            <div key={step.id}>
              {/* Step header */}
              <div className="text-center mb-12 md:mb-16">
                <h3 className="text-3xl md:text-5xl font-black uppercase text-white mb-4">
                  Step <span className="text-da-gold">{step.title.replace('Step ', '')}</span>
                </h3>
                {step.id === 2 && (
                  <p className="text-white/60 max-w-3xl mx-auto text-base md:text-lg">
                    Whether you've been living with Type 1 Diabetes for 10 months or 10 years, this 5 Day Diabetic Domination Toolkit will instantly catapult your T1D management to 'Pro Level' status in as little as 5 days!
                  </p>
                )}
                {step.id === 3 && (
                  <p className="text-white/60 max-w-3xl mx-auto text-base md:text-lg">
                    Join the ranks of the world's most empowered and confident Diabetics on the planet!
                  </p>
                )}
              </div>

              {step.singleCard ? (
                <div className="max-w-4xl mx-auto">
                  <JourneyCard
                    name={step.name}
                    description={step.description}
                    status={step.status}
                    isWide={true}
                  />
                </div>
              ) : (
                <div className={getGridClasses(step.courses.length)}>
                  {step.courses.map((course, idx) => (
                    <JourneyCard
                      key={idx}
                      name={course.name}
                      description={course.description}
                      status={course.status}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
