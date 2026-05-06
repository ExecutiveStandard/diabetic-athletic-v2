import { Link } from 'react-router-dom'
import Button from '../../components/Button'

const insights = [
  {
    slug: 'is-protein-good-for-diabetics',
    title: "Is Protein Good for Diabetics?",
    description: "Managing protein intake as a diabetic is important, especially if you want to get fit. Here's everything you need to know about protein and diabetes.",
    cta: "Read More"
  },
  {
    slug: 'diabetic-myopathy-muscle-weakness',
    title: "Diabetic Myopathy: Manage Muscle Weakness",
    description: "Living with diabetic myopathy can be challenging, but you're not alone. Learn all about it and discover practical strategies for coping and thriving.",
    cta: "Read More"
  },
  {
    slug: 'diabetes-joint-pain-explained',
    title: "Diabetes Joint Pain Explained",
    description: "Diabetics often experience joint pain that hinders health and exercise routines. Here's everything you need to know about diabetes and joint pain.",
    cta: "Read More"
  }
]

export default function LatestInsights() {
  return (
    <section className="bg-da-dark bg-dots relative">
      <div className="section-divider"></div>
      <div className="da-container section-padding">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">From The Blog</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase text-white">
            Latest <span className="text-da-gold">Insights</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((insight) => (
            <article key={insight.slug} className="bg-da-card rounded-xl overflow-hidden flex flex-col h-full hover-lift">
              <div className="aspect-[16/10] bg-gradient-to-br from-da-cyan/15 to-da-gold/15 flex items-center justify-center border-b border-white/5">
                <p className="text-white/30 uppercase tracking-wider text-xs">Article Image</p>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h3 className="text-xl font-black uppercase tracking-wide text-white mb-4 leading-tight">
                  {insight.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1">
                  {insight.description}
                </p>
                <Link to={`/blog/${insight.slug}`}>
                  <Button variant="outline" size="md" className="w-full">
                    {insight.cta}
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/blog">
            <Button variant="gradient" size="lg">
              View All Articles →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
