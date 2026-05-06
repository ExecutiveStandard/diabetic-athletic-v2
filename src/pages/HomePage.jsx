import Hero from '../features/hero/Hero'
import NewsletterStrip from '../features/newsletter/NewsletterStrip'
import JourneySection from '../features/journey/JourneySection'
import CoachBio from '../features/coach/CoachBio'
import DiscoveryCallCTA from '../features/cta/DiscoveryCallCTA'
import LatestInsights from '../features/insights/LatestInsights'

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewsletterStrip />
      <JourneySection />
      <CoachBio />
      <DiscoveryCallCTA />
      <LatestInsights />
    </>
  )
}
