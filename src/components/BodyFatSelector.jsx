// Reusable body-fat-percentage selector — a slider plus a reference image
// that swaps based on the caller's sex prop. Used by ProteinCalculator and
// InsulinCalculator (Magic Ratio).
const BODY_FAT_IMAGES = {
  male:   '/images/bodyfat/male.webp',
  female: '/images/bodyfat/female.webp',
}

export default function BodyFatSelector({ sex, value, onChange, label = 'Body Fat Percentage' }) {
  const min = 5
  const max = 60
  const safeSex = sex === 'female' ? 'female' : 'male'

  return (
    <div>
      <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-1">
        {label}
      </label>
      <p className="text-white/50 text-xs mb-4">
        Use the picture below to help estimate.
      </p>

      {/* Slider with floating value badge */}
      <div className="relative pt-8 pb-2">
        <div
          className="absolute -top-1 transform -translate-x-1/2 px-3 py-1 rounded-md bg-da-gradient text-da-dark text-xs font-black"
          style={{ left: `${((value - min) / (max - min)) * 100}%` }}
        >
          {value}%
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full accent-da-cyan h-2"
        />
        <div className="flex justify-between text-xs text-white/40 mt-2">
          <span>{min}%</span>
          <span>{max}%</span>
        </div>
      </div>

      {/* Reference image */}
      <div className="mt-6 bg-da-darker rounded-lg p-4 border border-white/5 flex items-center justify-center">
        <img
          src={BODY_FAT_IMAGES[safeSex]}
          alt={`${safeSex} body fat percentage reference chart`}
          loading="lazy"
          className="max-w-full h-auto rounded"
          style={{ maxHeight: '320px' }}
        />
      </div>
    </div>
  )
}
