import Button from '../../components/Button'

export default function JourneyCard({ name, description, status, isWide = false }) {
  const isComingSoon = status === 'Coming Soon'

  if (isWide) {
    return (
      <div className="bg-da-card-accent rounded-2xl overflow-hidden hover-lift">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
          {/* Image area */}
          <div className="md:col-span-5 relative min-h-[200px] md:min-h-[320px] bg-gradient-to-br from-da-cyan/15 to-da-gold/15 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
            <p className="text-white/30 uppercase tracking-wider text-xs">Product Image</p>
          </div>

          {/* Content with proper padding */}
          <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wide text-white mb-5 leading-tight">
              {name}
            </h3>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8">
              {description}
            </p>
            <div>
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
      </div>
    )
  }

  return (
    <div className="bg-da-card rounded-xl overflow-hidden flex flex-col h-full hover-lift">
      {/* Image area - separate from padded content */}
      <div className="bg-gradient-to-br from-da-cyan/15 to-da-gold/15 aspect-[4/3] flex items-center justify-center border-b border-white/5">
        <p className="text-white/30 uppercase tracking-wider text-xs">Product Image</p>
      </div>

      {/* Content with proper inner padding */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white mb-3 leading-tight">
          {name}
        </h3>
        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6 flex-1">
          {description}
        </p>
        <Button
          variant={isComingSoon ? 'outline' : 'gradient'}
          size="md"
          disabled={isComingSoon}
          className="w-full"
        >
          {status}
        </Button>
      </div>
    </div>
  )
}
