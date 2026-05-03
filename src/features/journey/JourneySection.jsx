// src/features/journey/JourneySection.jsx
import JourneyCard from './JourneyCard'
import styles from './journey.module.css'
import homeData from '../../data/home.json'

export default function JourneySection() {
  const { journey } = homeData

  return (
    <section className={styles.journeySection}>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-da-dark text-center mb-4">
          {journey.headline}
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          {journey.description}
        </p>

        {journey.steps.map((step) => (
          <div key={step.id} className="mb-16">
            <h3 className="text-2xl font-bold text-da-dark mb-8 text-center">{step.title}</h3>

            {step.singleCard ? (
              <div className="max-w-2xl mx-auto mb-8">
                <JourneyCard
                  name={step.name}
                  description={step.description}
                  status={step.status}
                />
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-${step.courses.length === 4 ? '2 lg:grid-cols-4' : '3'} gap-6`}>
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
