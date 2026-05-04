// src/features/journey/JourneySection.jsx
import JourneyCard from './JourneyCard'
import homeData from '../../data/home.json'

export default function JourneySection() {
  const { journey } = homeData

  // Static class mapping (Tailwind needs static class names)
  const getGridClasses = (count) => {
    if (count === 4) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-6'
    return 'grid grid-cols-1 md:grid-cols-2 gap-6'
  }

  return (
    <section className="bg-da-dark bg-dots py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl md:text-6xl font-black uppercase text-center mb-4 text-white">
          Start Your <span className="text-da-gold">Journey</span>
        </h2>
        <p className="text-center text-white/60 mb-20 max-w-2xl mx-auto text-lg">
          {journey.description}
        </p>

        {journey.steps.map((step) => (
          <div key={step.id} className="mb-20">
            <h3 className="text-3xl md:text-4xl font-black uppercase text-center mb-12 text-white">
              Step <span className="text-da-gold">{step.title.replace('Step ', '')}</span>
            </h3>

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
    </section>
  )
}
