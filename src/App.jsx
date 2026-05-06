import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Modal from './components/Modal'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import AboutPage from './pages/AboutPage'
import FreeResourcesPage from './pages/FreeResourcesPage'
import NewsletterForm from './features/newsletter/NewsletterForm'
import { useAppStore } from './store/appStore'

export default function App() {
  const { modals, closeModal } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col bg-da-dark">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/free-resources" element={<FreeResourcesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
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
