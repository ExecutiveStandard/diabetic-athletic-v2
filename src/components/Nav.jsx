import { Link, useLocation } from 'react-router-dom'
import Button from './Button'
import { useAppStore } from '../store/appStore'

export default function Nav() {
  const { openModal } = useAppStore()
  const location = useLocation()

  const linkClass = (path) => {
    const isActive = location.pathname === path
    return `text-sm font-bold uppercase tracking-wider transition ${
      isActive ? 'text-da-cyan' : 'text-white/80 hover:text-da-cyan'
    }`
  }

  return (
    <nav className="bg-da-dark/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="da-container py-5 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
            <span className="text-da-cyan">DIABETIC</span> ATHLETIC
          </h1>
        </Link>

        <div className="hidden md:flex gap-8 lg:gap-12 items-center">
          <Link to="/" className={linkClass('/')}>Home</Link>
          <Link to="/about" className={linkClass('/about')}>About</Link>
          <Link to="/free-resources" className={linkClass('/free-resources')}>Free Resources</Link>
          <Link to="/blog" className={linkClass('/blog')}>Blog</Link>
        </div>

        <Button
          variant="gradient"
          size="md"
          onClick={() => openModal('newsletterOpen')}
        >
          Subscribe
        </Button>
      </div>
    </nav>
  )
}
