import { useParams, Link } from 'react-router-dom'
import Button from '../components/Button'
import { useAppStore } from '../store/appStore'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { openModal } = useAppStore()

  return (
    <div className="bg-da-dark bg-dots">
      <article className="da-container section-padding">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="text-da-cyan hover:text-da-gold transition uppercase text-xs font-bold tracking-wider mb-8 inline-block">
            ← Back to Blog
          </Link>

          <div className="flex items-center gap-3 mb-6 text-xs text-white/40 uppercase tracking-wider">
            <span className="text-da-cyan font-bold">Article</span>
            <span>•</span>
            <span>10 min read</span>
            <span>•</span>
            <span>May 2026</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-white mb-8">
            {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </h1>

          <div className="aspect-[16/9] bg-gradient-to-br from-da-cyan/15 to-da-gold/15 rounded-2xl flex items-center justify-center border border-white/10 mb-12">
            <p className="text-white/30 uppercase tracking-wider text-xs">Featured Image</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-white/70 text-lg leading-relaxed mb-12">
            <p>
              This is a placeholder for the article content. In Phase 2, blog posts will be loaded from Firestore with full markdown support.
            </p>
            <p>
              The actual article content for "{slug}" will appear here, including images, headings, lists, and rich formatting.
            </p>
            <p>
              For now, this serves as a structural placeholder demonstrating the article layout.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-da-card-accent rounded-2xl p-8 md:p-12 text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
              Want More <span className="text-da-gold">Insights</span> Like This?
            </h3>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Subscribe to the Diabetic Athletic newsletter and get expert advice delivered to your inbox every week.
            </p>
            <Button variant="gradient" size="lg" onClick={() => openModal('newsletterOpen')}>
              Subscribe Free →
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
