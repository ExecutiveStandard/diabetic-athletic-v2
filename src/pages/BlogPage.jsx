import { Link } from 'react-router-dom'
import Button from '../components/Button'

const blogPosts = [
  {
    slug: 'is-protein-good-for-diabetics',
    title: 'Is Protein Good for Diabetics?',
    excerpt: 'Managing protein intake as a diabetic is important, especially if you want to get fit. Here\'s everything you need to know about protein and diabetes.',
    date: 'May 1, 2026',
    readTime: '8 min read',
    category: 'Nutrition'
  },
  {
    slug: 'diabetic-myopathy-muscle-weakness',
    title: 'Diabetic Myopathy: Manage Muscle Weakness',
    excerpt: 'Living with diabetic myopathy can be challenging, but you\'re not alone. Learn all about it and discover practical strategies for coping and thriving.',
    date: 'April 22, 2026',
    readTime: '12 min read',
    category: 'Health'
  },
  {
    slug: 'diabetes-joint-pain-explained',
    title: 'Diabetes Joint Pain Explained',
    excerpt: 'Diabetics often experience joint pain that hinders health and exercise routines. Here\'s everything you need to know about diabetes and joint pain.',
    date: 'April 15, 2026',
    readTime: '10 min read',
    category: 'Health'
  },
  {
    slug: 'time-in-range-strategies',
    title: '5 Strategies to Improve Your Time in Range',
    excerpt: 'Discover proven methods to keep your blood glucose levels stable and increase your daily time in range without sacrificing your fitness goals.',
    date: 'April 8, 2026',
    readTime: '9 min read',
    category: 'Strategy'
  },
  {
    slug: 'pre-workout-nutrition-t1d',
    title: 'Pre-Workout Nutrition for Type 1 Diabetics',
    excerpt: 'What you eat before exercise dramatically affects performance and blood sugar control. Here\'s the optimal pre-workout fueling strategy for T1D athletes.',
    date: 'April 1, 2026',
    readTime: '11 min read',
    category: 'Nutrition'
  },
  {
    slug: 'insulin-pump-vs-injections',
    title: 'Insulin Pump vs Multiple Daily Injections: Which is Right for Athletes?',
    excerpt: 'A comprehensive comparison of insulin delivery methods for active type 1 diabetics, with pros and cons for your fitness lifestyle.',
    date: 'March 25, 2026',
    readTime: '14 min read',
    category: 'Strategy'
  }
]

export default function BlogPage() {
  return (
    <div className="bg-da-dark bg-dots">
      {/* Page Header */}
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">From The Blog</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Latest <span className="text-da-gold">Insights</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Expert advice on diabetes management, fitness, nutrition, and living your strongest, healthiest life with Type 1 Diabetes.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="da-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="bg-da-card rounded-xl overflow-hidden flex flex-col h-full hover-lift group"
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-gradient-to-br from-da-cyan/15 to-da-gold/15 flex items-center justify-center border-b border-white/5 group-hover:from-da-cyan/25 group-hover:to-da-gold/25 transition-all">
                <p className="text-white/30 uppercase tracking-wider text-xs">Article Image</p>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4 text-xs text-white/40 uppercase tracking-wider">
                  <span className="text-da-cyan font-bold">{post.category}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white mb-4 leading-tight group-hover:text-da-cyan transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{post.date}</span>
                  <span className="text-da-cyan group-hover:text-da-gold transition-colors font-bold uppercase tracking-wider text-xs">Read →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
