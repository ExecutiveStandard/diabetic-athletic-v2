// src/features/journey/JourneyCard.jsx
import Button from '../../components/Button'

export default function JourneyCard({ name, description, status, isWide = false }) {
  const isComingSoon = status === 'Coming Soon'

  return (
    <div className={`bg-da-card rounded-xl overflow-hidden flex flex-col ${isWide ? 'p-8' : 'p-6'} h-full hover:border-da-cyan/40 transition-all duration-300 group`}>
      {/* Image placeholder area */}
      <div className={`bg-gradient-to-br from-da-cyan/20 to-da-gold/20 rounded-lg ${isWide ? 'h-48' : 'h-32'} mb-6 flex items-center justify-center border border-white/5 group-hover:from-da-cyan/30 group-hover:to-da-gold/30 transition-all`}>
        <p className="text-white/30 uppercase tracking-wider text-xs">Product Image</p>
      </div>

      <div className="flex-1 mb-6">
        <h3 className={`${isWide ? 'text-2xl' : 'text-lg'} font-black uppercase tracking-wide text-white mb-3`}>
          {name}
        </h3>
        <p className={`${isWide ? 'text-base' : 'text-sm'} text-white/60 leading-relaxed`}>
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
