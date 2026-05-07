import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

// Protein target ranges in g per kg of LEAN BODY MASS (more accurate than total weight,
// especially for users with higher body fat). Source: International Society of Sports
// Nutrition position stand + Helms et al. systematic reviews.
const GOALS = [
  {
    id: 'cut',
    label: 'Fat Loss / Cut',
    range: [2.3, 3.1],
    desc: 'Preserve muscle in a calorie deficit. Higher protein offsets muscle loss.',
  },
  {
    id: 'maintain',
    label: 'Maintenance',
    range: [1.8, 2.2],
    desc: 'Hold lean mass, recover well, support training.',
  },
  {
    id: 'bulk',
    label: 'Muscle Gain / Bulk',
    range: [2.0, 2.5],
    desc: 'Build new muscle tissue efficiently in a surplus.',
  },
  {
    id: 'athlete',
    label: 'High-Performance Athlete',
    range: [2.5, 3.3],
    desc: 'Heavy training volume, fast recovery, peak adaptation.',
  },
]

// Body fat estimation reference, gender-specific.
// Each entry covers a range and describes what that level typically looks like.
const BODY_FAT_REFERENCE = {
  male: [
    { value: 8,  range: '6–9%',   label: 'Competition',   desc: 'Striated, vascular, paper-thin skin. Stage-ready.' },
    { value: 12, range: '10–14%', label: 'Athletic',      desc: 'Abs clearly visible, vascularity in arms.' },
    { value: 17, range: '15–19%', label: 'Lean / Fit',    desc: 'Some ab definition, lean overall.' },
    { value: 22, range: '20–24%', label: 'Average',       desc: 'No visible abs, slight softness around midsection.' },
    { value: 27, range: '25–29%', label: 'Above Average', desc: 'Softer waist, no muscle definition visible.' },
    { value: 33, range: '30%+',   label: 'High',          desc: 'Larger waist, fat distributed across body.' },
  ],
  female: [
    { value: 16, range: '14–17%', label: 'Competition',   desc: 'Visible muscle striation. Stage-ready (very low for women).' },
    { value: 20, range: '18–22%', label: 'Athletic',      desc: 'Abs visible, defined arms and legs.' },
    { value: 25, range: '23–27%', label: 'Fit',           desc: 'Lean, toned, slight ab outline.' },
    { value: 30, range: '28–32%', label: 'Average',       desc: 'Healthy curves, no visible abs.' },
    { value: 35, range: '33–37%', label: 'Above Average', desc: 'Softer overall, fuller hips and thighs.' },
    { value: 40, range: '38%+',   label: 'High',          desc: 'Higher fat distribution across all areas.' },
  ],
}

export default function ProteinCalculator() {
  const [gender, setGender] = useState('male')
  const [units, setUnits] = useState('metric')
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [goal, setGoal] = useState('maintain')
  const [meals, setMeals] = useState(4)
  const [results, setResults] = useState(null)

  const calculate = (e) => {
    e.preventDefault()

    const weightKg = units === 'metric'
      ? parseFloat(weight)
      : parseFloat(weight) * 0.453592
    const bf = parseFloat(bodyFat)

    if (!weightKg || !bf) {
      alert('Please enter your weight and body fat percentage')
      return
    }
    if (bf < 3 || bf > 60) {
      alert('Body fat % should be between 3 and 60')
      return
    }

    const lbmKg = weightKg * (1 - bf / 100)
    const goalData = GOALS.find((g) => g.id === goal)
    const lowG = Math.round(lbmKg * goalData.range[0])
    const highG = Math.round(lbmKg * goalData.range[1])
    const targetG = Math.round(
      lbmKg * ((goalData.range[0] + goalData.range[1]) / 2)
    )
    const fatMassKg = weightKg - lbmKg

    setResults({
      weightKg: Math.round(weightKg * 10) / 10,
      lbmKg: Math.round(lbmKg * 10) / 10,
      lbmLbs: Math.round(lbmKg * 2.20462 * 10) / 10,
      fatMassKg: Math.round(fatMassKg * 10) / 10,
      bodyFat: bf,
      low: lowG,
      target: targetG,
      high: highG,
      perMeal: Math.round(targetG / meals),
      meals,
      goalLabel: goalData.label,
      kcal: Math.round(targetG * 4),
    })
  }

  const reset = () => {
    setWeight('')
    setBodyFat('')
    setResults(null)
  }

  const reference = BODY_FAT_REFERENCE[gender]

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link
          to="/free-resources"
          className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition"
        >
          ← Back to Free Resources
        </Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">
            💪 Protein Calculator
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Daily <span className="text-da-gold">Protein</span> Target
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg">
            Body-fat-adjusted calculation using <span className="text-da-cyan font-bold">Lean Body Mass</span> — the
            gold standard for accuracy, especially if you carry extra body fat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <form
            onSubmit={calculate}
            className="bg-da-card rounded-2xl p-8 md:p-10 space-y-6"
          >
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">
              Your Stats
            </h2>

            {/* Gender */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    gender === 'male'
                      ? 'bg-da-cyan text-da-dark'
                      : 'text-white/60'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    gender === 'female'
                      ? 'bg-da-cyan text-da-dark'
                      : 'text-white/60'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Units */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Units
              </label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setUnits('metric')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    units === 'metric'
                      ? 'bg-da-cyan text-da-dark'
                      : 'text-white/60'
                  }`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUnits('imperial')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    units === 'imperial'
                      ? 'bg-da-cyan text-da-dark'
                      : 'text-white/60'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Body Weight ({units === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                type="number"
                min="20"
                max="500"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                placeholder={units === 'metric' ? '75' : '165'}
              />
            </div>

            {/* Body Fat % */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Body Fat % <span className="text-da-cyan normal-case font-normal">(use chart below to estimate)</span>
              </label>
              <input
                type="number"
                min="3"
                max="60"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                required
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                placeholder={gender === 'male' ? '15' : '25'}
              />
              <p className="text-white/40 text-xs mt-2">
                If you have a DEXA / InBody scan, use that. Otherwise estimate from the visual reference below.
              </p>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-3">
                Goal
              </label>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <label
                    key={g.id}
                    className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition border ${
                      goal === g.id
                        ? 'bg-da-cyan/15 border-da-cyan/50'
                        : 'bg-da-darker border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      checked={goal === g.id}
                      onChange={() => setGoal(g.id)}
                      className="mt-1 accent-da-cyan"
                    />
                    <div>
                      <div className="text-white font-bold text-sm">{g.label}</div>
                      <div className="text-white/50 text-xs">
                        {g.range[0]}–{g.range[1]} g/kg LBM · {g.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Meals slider */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Meals per Day:{' '}
                <span className="text-da-cyan">{meals}</span>
              </label>
              <input
                type="range"
                min="2"
                max="6"
                value={meals}
                onChange={(e) => setMeals(parseInt(e.target.value))}
                className="w-full accent-da-cyan"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>2</span>
                <span>6</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="gradient" size="lg" className="flex-1">
                Calculate →
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={reset}>
                Reset
              </Button>
            </div>
          </form>

          {/* Results */}
          <div className="lg:sticky lg:top-24 self-start">
            {results ? (
              <div className="bg-da-card-accent rounded-2xl p-8 md:p-10 space-y-6">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  Your Protein Plan
                </h2>

                {/* LBM breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                      Total Weight
                    </div>
                    <div className="text-xl font-black text-white">
                      {results.weightKg}
                      <span className="text-xs text-white/60"> kg</span>
                    </div>
                  </div>
                  <div className="bg-da-darker rounded-lg p-3 text-center border border-da-gold/40">
                    <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-1">
                      Lean Body Mass
                    </div>
                    <div className="text-xl font-black text-white">
                      {results.lbmKg}
                      <span className="text-xs text-white/60"> kg</span>
                    </div>
                  </div>
                  <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                      Fat Mass
                    </div>
                    <div className="text-xl font-black text-white">
                      {results.fatMassKg}
                      <span className="text-xs text-white/60"> kg</span>
                    </div>
                  </div>
                </div>

                {/* Daily target */}
                <div className="bg-da-darker rounded-lg p-6 border border-da-gold/40 text-center">
                  <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-2">
                    Daily Target ({results.goalLabel})
                  </div>
                  <div className="text-5xl md:text-6xl font-black text-white mb-1">
                    {results.target}
                    <span className="text-2xl text-white/60">g</span>
                  </div>
                  <div className="text-white/50 text-sm">
                    Range: {results.low}g – {results.high}g
                  </div>
                  <div className="text-white/40 text-xs mt-2">
                    Calculated from {results.lbmKg} kg LBM ({results.bodyFat}% body fat)
                  </div>
                </div>

                {/* Per-meal + calories */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-da-darker rounded-lg p-4 border border-white/10 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                      Per Meal
                    </div>
                    <div className="text-2xl font-black text-white">
                      {results.perMeal}g
                    </div>
                    <div className="text-white/40 text-xs">
                      across {results.meals} meals
                    </div>
                  </div>
                  <div className="bg-da-darker rounded-lg p-4 border border-white/10 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                      Calories
                    </div>
                    <div className="text-2xl font-black text-white">
                      {results.kcal.toLocaleString()}
                    </div>
                    <div className="text-white/40 text-xs">
                      from protein only
                    </div>
                  </div>
                </div>

                {/* Real-food equivalents */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-3">
                    Real-Food Equivalents (per day)
                  </h3>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex justify-between">
                      <span>Chicken breast</span>
                      <span className="text-white">
                        ~{Math.round(results.target / 0.31)}g raw
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Whey protein scoops</span>
                      <span className="text-white">
                        ~{Math.round(results.target / 25)} scoops
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Large eggs</span>
                      <span className="text-white">
                        ~{Math.round(results.target / 6)} eggs
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-white/40 text-xs leading-relaxed pt-4 border-t border-white/10">
                  💡 Distribute evenly across meals for max muscle protein synthesis. T1Ds: protein has a small but
                  real impact on BG over 3–5 hours — log meals and watch the late post-meal trace.
                </p>
              </div>
            ) : (
              <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10">
                <div className="text-6xl mb-4">🥩</div>
                <p className="text-white/60">
                  Fill in your stats and body fat % to get a precision protein target based on Lean Body Mass.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Body Fat Visual Reference Chart */}
        <div className="max-w-6xl mx-auto mt-16 md:mt-20">
          <div className="text-center mb-10">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-2">
              Visual Reference
            </p>
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-3">
              Body Fat % <span className="text-da-gold">Estimation Guide</span>
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
              Compare yourself to the descriptions below to estimate your body fat. Click any card to use that value.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reference.map((ref) => {
              const isSelected = parseFloat(bodyFat) === ref.value
              return (
                <button
                  key={ref.range}
                  type="button"
                  onClick={() => setBodyFat(String(ref.value))}
                  className={`text-left bg-da-card rounded-xl p-5 hover-lift transition border ${
                    isSelected
                      ? 'border-da-cyan ring-2 ring-da-cyan/40'
                      : 'border-white/10 hover:border-da-cyan/40'
                  }`}
                >
                  <div className="aspect-square mb-3 flex items-center justify-center bg-gradient-to-br from-da-cyan/10 to-da-gold/10 rounded-lg border border-white/5">
                    {/* Simple silhouette built from CSS */}
                    <svg
                      viewBox="0 0 60 100"
                      className="h-20 text-white/60"
                      fill="currentColor"
                    >
                      {gender === 'male' ? (
                        // Male silhouette: broader shoulders, V-taper that softens at higher BF
                        <path
                          d={
                            ref.value <= 12
                              ? 'M30 8 a6 6 0 1 0 0.1 0 z M22 18 L38 18 L46 36 L40 54 L40 92 L34 92 L34 70 L30 70 L26 70 L26 92 L20 92 L20 54 L14 36 Z'
                              : ref.value <= 22
                              ? 'M30 8 a6.5 6.5 0 1 0 0.1 0 z M21 18 L39 18 L47 38 L42 58 L42 92 L34 92 L34 72 L30 72 L26 72 L26 92 L18 92 L18 58 L13 38 Z'
                              : ref.value <= 30
                              ? 'M30 8 a7 7 0 1 0 0.1 0 z M20 18 L40 18 L48 40 L46 60 L46 92 L34 92 L34 72 L30 72 L26 72 L26 92 L14 92 L14 60 L12 40 Z'
                              : 'M30 8 a7.5 7.5 0 1 0 0.1 0 z M19 18 L41 18 L50 42 L50 64 L48 92 L34 92 L34 72 L30 72 L26 72 L26 92 L12 92 L10 64 L10 42 Z'
                          }
                        />
                      ) : (
                        // Female silhouette: narrower waist, fuller hips that broaden at higher BF
                        <path
                          d={
                            ref.value <= 20
                              ? 'M30 8 a6 6 0 1 0 0.1 0 z M22 18 L38 18 L42 36 L34 50 L40 70 L38 92 L32 92 L31 70 L30 70 L29 70 L28 92 L22 92 L20 70 L26 50 L18 36 Z'
                              : ref.value <= 30
                              ? 'M30 8 a6.5 6.5 0 1 0 0.1 0 z M22 18 L38 18 L42 36 L36 50 L44 72 L40 92 L33 92 L31 72 L30 72 L29 72 L27 92 L20 92 L16 72 L24 50 L18 36 Z'
                              : ref.value <= 36
                              ? 'M30 8 a7 7 0 1 0 0.1 0 z M21 18 L39 18 L43 38 L38 52 L48 74 L42 92 L33 92 L31 74 L30 74 L29 74 L27 92 L18 92 L12 74 L22 52 L17 38 Z'
                              : 'M30 8 a7.5 7.5 0 1 0 0.1 0 z M20 18 L40 18 L44 40 L40 54 L52 76 L44 92 L33 92 L31 76 L30 76 L29 76 L27 92 L16 92 L8 76 L20 54 L16 40 Z'
                          }
                        />
                      )}
                    </svg>
                  </div>
                  <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-1">
                    {ref.range}
                  </div>
                  <div className="text-white text-sm font-bold mb-1">{ref.label}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{ref.desc}</div>
                </button>
              )
            })}
          </div>

          <p className="text-white/40 text-xs text-center mt-6 max-w-2xl mx-auto">
            These visual estimates are approximate. For precise numbers use a DEXA scan, BodPod, or InBody. Tape and
            caliper methods can vary by ±3–5%.
          </p>
        </div>
      </div>
    </div>
  )
}
