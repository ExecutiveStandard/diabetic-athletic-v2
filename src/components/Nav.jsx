import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from './Button'
import { useAppStore } from '../store/appStore'

export default function Nav() {
  const { openModal } = useAppStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const linkClass = (path) => {
    const isActive = location.pathname === path
    return `text-sm font-bold uppercase tracking-wider transition ${
      isActive ? 'text-da-cyan' : 'text-white/80 hover:text-da-cyan'
    }`
  }

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <nav className="bg-da-dark/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="da-container py-5 flex justify-between items-center gap-4">
        <Link to="/" className="flex items-center" onClick={closeMobile}>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white whitespace-nowrap">
            <span className="text-da-cyan">DIABETIC</span> ATHLETIC
          </h1>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-8 lg:gap-12 items-center">
          <Link to="/" className={linkClass('/')}>Home</Link>
          <Link to="/about" className={linkClass('/about')}>About</Link>
          <Link to="/free-resources" className={linkClass('/free-resources')}>Free Resources</Link>
          <Link to="/blog" className={linkClass('/blog')}>Blog</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button
            variant="gradient"
            size="md"
            onClick={() => openModal('newsletterOpen')}
          >
            Subscribe
          </Button>
        </div>

        {/* Mobile hamburger / close */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-white"
        >
          {mobileMenuOpen ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu drawer — slides down when open */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-da-dark">
          <div className="da-container py-4 flex flex-col gap-1">
            <Link to="/" className={`${linkClass('/')} py-3`} onClick={closeMobile}>Home</Link>
            <Link to="/about" className={`${linkClass('/about')} py-3`} onClick={closeMobile}>About</Link>
            <Link to="/free-resources" className={`${linkClass('/free-resources')} py-3`} onClick={closeMobile}>Free Resources</Link>
            <Link to="/blog" className={`${linkClass('/blog')} py-3`} onClick={closeMobile}>Blog</Link>
            <Button
              variant="gradient"
              size="md"
              onClick={() => { closeMobile(); openModal('newsletterOpen') }}
              className="mt-3 w-full"
            >
              Subscribe
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
