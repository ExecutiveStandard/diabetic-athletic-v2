import Button from '../../components/Button'

export default function JourneyCard({ name, description, status, isWide = false }) {
  const isComingSoon = status === 'Coming Soon'

  if (isWide) {
    return (
      <div className="bg-da-card-accent rounded-2xl overflow-hidden p-8 md:p-12 hover:border-da-cyan/40 transition-all duration-300 group">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Image area */}
          <div className="md:col-span-4">
            <div className="aspect-square bg-gradient-to-br from-da-cyan/20 to-da-gold/20 rounded-xl flex items-center justify-center border border-white/5 group-hover:from-da-cyan/30 group-hover:to-da-gold/30 transition-all">
              <p className="text-white/30 uppercase tracking-wider text-xs">Product Image</p>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-8">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white mb-4">
              {name}
            </h3>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8">
              {description}
            </p>
            <Button
              variant={isComingSoon ? 'outline' : 'gradient'}
              size="lg"
              disabled={isComingSoon}
            >
              {status}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-da-card rounded-xl overflow-hidden flex flex-col p-6 md:p-7 h-full hover:border-da-cyan/40 transition-all duration-300 group">
      {/* Image area */}
      <div className="bg-gradient-to-br from-da-cyan/20 to-da-gold/20 rounded-lg aspect-[4/3] mb-6 flex items-center justify-center border border-white/5 group-hover:from-da-cyan/30 group-hover:to-da-gold/30 transition-all">
        <p className="text-white/30 uppercase tracking-wider text-xs">Product Image</p>
      </div>

      <div className="flex-1 mb-6">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white mb-3 leading-tight">
          {name}
        </h3>
        <p className="text-sm md:text-base text-white/60 leading-relaxed">
          {description}
        </p>
      </div>

      <Button
        variant={isComingSoon ? 'outline' : 'gradient'}
        size="md"
        disabled={isComingSoon}
        className="w-full"
      >
        {status}
      </Button>
    </div>
  )
}
