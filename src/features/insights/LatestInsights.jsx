import Button from '../../components/Button'

const insights = [
  {
    title: "Is Protein Good for Diabetics?",
    description: "Managing protein intake as a diabetic is important, especially if you want to get fit. Here's everything you need to know about protein and diabetes.",
    cta: "Read More"
  },
  {
    title: "Diabetic Myopathy: Manage Muscle Weakness",
    description: "Living with diabetic myopathy can be challenging, but you're not alone. Learn all about it and discover practical strategies for coping and thriving.",
    cta: "Read More"
  },
  {
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
        <div className="text-center mb-16">
          <p className="text-da-cyan uppercase tracking-widest text-xs md:text-sm font-bold mb-4">From The Blog</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase text-white">
            Latest <span className="text-da-gold">Insights</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((insight, idx) => (
            <article key={idx} className="bg-da-card rounded-xl overflow-hidden p-6 md:p-7 flex flex-col hover:border-da-cyan/40 transition-all duration-300 group">
              <div className="aspect-[4/3] bg-gradient-to-br from-da-cyan/20 to-da-gold/20 rounded-lg mb-6 flex items-center justify-center border border-white/5 group-hover:from-da-cyan/30 group-hover:to-da-gold/30 transition-all">
                <p className="text-white/30 uppercase tracking-wider text-xs">Article Image</p>
              </div>
              <div className="flex-1 mb-6">
                <h3 className="text-xl font-black uppercase tracking-wide text-white mb-3 leading-tight">
                  {insight.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {insight.description}
                </p>
              </div>
              <Button variant="outline" size="md" className="w-full">
                {insight.cta}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
