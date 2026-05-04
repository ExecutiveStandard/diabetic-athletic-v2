import Nav from './components/Nav'
import Footer from './components/Footer'
import Modal from './components/Modal'
import Hero from './features/hero/Hero'
import JourneySection from './features/journey/JourneySection'
import NewsletterForm from './features/newsletter/NewsletterForm'
import { useAppStore } from './store/appStore'

export default function App() {
  const { modals, closeModal } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col bg-da-dark">
      <Nav />
      <main className="flex-1">
        <Hero />
        <JourneySection />
      </main>
      <Footer />

      <Modal
        isOpen={modals.newsletterOpen}
        onClose={() => closeModal('newsletterOpen')}
        title="Subscribe"
      >
        <NewsletterForm onClose={() => closeModal('newsletterOpen')} />
      </Modal>
    </div>
  )
}
