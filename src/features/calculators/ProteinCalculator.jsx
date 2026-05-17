import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import BodyFatSelector from '../../components/BodyFatSelector'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function ProteinCalculator() {
  return (
    <OptInGate slug="protein" {...OPT_IN_CONTENT.protein}>
      <ProteinCalculatorActual />
    </OptInGate>
  )
}

// =============================================================================
// Original Diabetic Athletic protein calculator — ported faithfully from the
// GoHighLevel script. All math operates on weight in POUNDS regardless of the
// units toggle (kg → lbs conversion applied first). Body fat % is from a
// 5–60% slider. The plant-based dropdown is captured for parity with the
// original but is NOT used in the calculation (mirrors the original behaviour).
// =============================================================================

const AGE_RANGES = [
  { id: 'age34', label: '< 34' },
  { id: 'age35', label: '35 – 60' },
  { id: 'age61', label: '61+' },
]

const WORKOUT_HOURS = [
  { id: 'hours0', label: '0 – 1' },
  { id: 'hours1', label: '1 – 3' },
  { id: 'hours4', label: '4 – 6' },
  { id: 'hours7', label: '7+' },
]


// =============================================================================
// MATH — straight port of the original protein_intake() function
// =============================================================================
function calcProtein({ gender, weight_lbs, age, hours, bodyFatPct }) {
  if (!weight_lbs || weight_lbs <= 0) return null

  const w = Number(weight_lbs)
  const body_fat_factor = 1 - (bodyFatPct / 100)

  const minimum = 0.8 * w * 1.0 * body_fat_factor * 1.0
  const maximum = minimum * 1.5

  let optimal_base = (minimum + maximum) / 2

  if (gender === 'male') {
    let plus = 0
    if (age === 'age35') plus = Math.ceil((w + 40) / 40)
    else if (age === 'age61') plus = Math.ceil((w + 18) / 18)

    let more_plus = 0
    if (hours === 'hours1')      more_plus = Math.ceil((w + 33.5) / 36)
    else if (hours === 'hours4') more_plus = Math.ceil((w + 17) / 19)
    else if (hours === 'hours7') more_plus = Math.ceil((w + 8.5) / 10)

    optimal_base = optimal_base + plus + more_plus
  } else {
    // female
    let minus = 0
    if (age === 'age34')      minus = Math.ceil(w / 50)
    else if (age === 'age35') minus = Math.ceil(w / 100) * -1
    else if (age === 'age61') minus = Math.ceil(w / 50) * -2

    let more_plus = 0
    if (hours === 'hours1') {
      const b = Math.ceil(w / 50)
      more_plus = 1 * 1 * (b * 2)
    } else if (hours === 'hours4') {
      const b = Math.ceil(w / 50)
      more_plus = 1 * 1.5 * (b * 2)
    } else if (hours === 'hours7') {
      const b = Math.ceil(w / 50)
      more_plus = 1 * 2 * (b * 2)
    }

    optimal_base = optimal_base - minus + more_plus
  }

  return {
    minimum: Math.round(minimum),
    maximum: Math.round(maximum),
    optimal: Math.round(optimal_base),
  }
}

// =============================================================================
// FAQ DATA
// =============================================================================
const FAQS = [
  {
    q: 'Why is my protein goal higher for fat loss than it is for building muscle?',
    a: (
      <>
        Protein serves two main purposes when it comes to body composition change: physiological & lifestyle.
        After a certain point, adding more protein to your diet won't increase how much muscle you can build —
        but there are several important benefits that come from going past that point when your goal is weight loss:
        <ul className="list-disc list-inside mt-3 space-y-1 text-white/80">
          <li>Decreased hunger and cravings in a calorie deficit</li>
          <li>Less mood disturbances, stress, and fatigue</li>
          <li>Increased metabolism (via TEF)</li>
          <li>More muscle mass retained during fat loss</li>
        </ul>
        <p className="mt-3">Protein isn't just for gym bros!</p>
      </>
    ),
  },
  {
    q: 'How much protein can I absorb in one sitting?',
    a: (
      <>
        Have you heard you can only absorb 30g of protein at once? That's a myth. Researchers concluded that
        "virtually all ingested protein is absorbed by healthy humans."
        <p className="mt-3">
          However, there's a limit to how much protein contributes to muscle protein synthesis (MPS), usually
          20–40g+ depending on factors like size, muscle mass, and age.
        </p>
        <p className="mt-3">
          Focus on your <strong className="text-da-cyan">total daily protein intake</strong>, not just how much
          you get per meal.
        </p>
      </>
    ),
  },
  {
    q: "That's a big number… How can I get that much protein in my diet?",
    a: (
      <>
        Find the best protein sources you enjoy and structure your meals around them.
        <p className="mt-3">Check out the resources section for our list of best protein sources.</p>
        <p className="mt-3">
          Or watch my protein presentation called{' '}
          <strong className="text-da-cyan">"20 Ways to Get More Protein in Your Diet"</strong>!
        </p>
      </>
    ),
  },
  {
    q: 'What happens if I eat more than my "Max Protein" goal?',
    a: (
      <>
        Think of your max protein goal as a guideline, not a hard limit. While eating beyond your max protein
        goal won't provide extra benefits, it's not harmful either.
        <p className="mt-3">
          Excess protein won't automatically turn into fat unless{' '}
          <strong className="text-da-cyan">total calorie intake</strong> exceeds energy expenditure.
        </p>
        <p className="mt-3">
          If you love protein, eat more! Just track <strong className="text-da-cyan">total calories</strong> for
          fat loss or muscle gain.
        </p>
      </>
    ),
  },
  {
    q: 'Are protein shakes the same as food to help me hit my goal?',
    a: (
      <>
        Short answer: <strong className="text-da-cyan">Yes.</strong>
        <p className="mt-3">
          Long answer: <strong className="text-da-cyan">Kinda…</strong>
        </p>
        <p className="mt-3">
          Whey protein is one of the highest-quality proteins you can consume, but it shouldn't replace whole foods.
        </p>
        <p className="mt-3">
          Protein supplements are <strong className="text-da-cyan">just that — supplements</strong>. Use them
          wisely, but prioritize whole foods.
        </p>
      </>
    ),
  },
]

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between gap-4 py-5 group"
      >
        <span className="text-white font-bold text-base md:text-lg leading-tight group-hover:text-da-cyan transition">
          {faq.q}
        </span>
        <span
          className={`text-da-gold text-2xl font-black transition-transform ${open ? 'rotate-45' : ''}`}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="pb-5 text-white/70 text-sm md:text-base leading-relaxed">
          {faq.a}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PROTEIN SOURCE GUIDE — native (replaces static infographic image)
// 3-column responsive guide: EAT MORE / EAT SOME / EAT LESS
// =============================================================================
const PROTEIN_SOURCES = {
  more: {
    headline: 'Eat More',
    accent: 'from-emerald-500 to-emerald-600',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
    items: [
      { icon: '🥚', name: 'Eggs & egg whites' },
      { icon: '🐟', name: 'Fish' },
      { icon: '🦞', name: 'Shellfish' },
      { icon: '🍗', name: 'Chicken' },
      { icon: '🦆', name: 'Duck breast & thigh' },
      { icon: '🦃', name: 'Turkey' },
      { icon: '🥩', name: 'Lean beef' },
      { icon: '🥛', name: 'Plain Greek yoghurt' },
      { icon: '🌱', name: 'Tempeh' },
      { icon: '🧀', name: 'Cultured cottage cheese' },
      { icon: '💪', name: 'Protein powder (isolate)' },
    ],
  },
  some: {
    headline: 'Eat Some',
    accent: 'from-da-gold to-amber-500',
    border: 'border-da-gold/40',
    glow: 'shadow-da-gold/20',
    items: [
      { icon: '🧀', name: 'Uncultured cottage cheese' },
      { icon: '🥩', name: 'Medium-lean meats' },
      { icon: '🍱', name: 'Tofu' },
      { icon: '🫘', name: 'Edamame beans' },
      { icon: '🥓', name: 'Canadian bacon' },
      { icon: '🥩', name: 'Beef jerky / biltong' },
      { icon: '🐑', name: 'Lamb' },
      { icon: '🥓', name: 'Minimally processed deli meat' },
      { icon: '🌭', name: 'Poultry sausage' },
      { icon: '🫘', name: 'Lentils & beans' },
    ],
  },
  less: {
    headline: 'Eat Less',
    accent: 'from-red-500 to-red-600',
    border: 'border-red-500/40',
    glow: 'shadow-red-500/20',
    items: [
      { icon: '🍳', name: 'Fried meats' },
      { icon: '🍗', name: 'Chicken fingers / nuggets / wings' },
      { icon: '🐟', name: 'Fish fingers / schnitzels' },
      { icon: '🥩', name: 'High-fat meat' },
      { icon: '🌭', name: 'High-fat sausages' },
      { icon: '🍱', name: 'Processed soy products' },
      { icon: '🥩', name: 'Processed deli meats' },
      { icon: '🍫', name: 'Protein bars' },
    ],
  },
}

function SourceColumn({ data }) {
  return (
    <div className={`bg-da-darker rounded-xl border ${data.border} overflow-hidden flex flex-col h-full shadow-lg ${data.glow}`}>
      <div className={`bg-gradient-to-r ${data.accent} px-5 py-4`}>
        <h3 className="text-da-dark font-black uppercase tracking-wider text-center text-base md:text-lg">
          {data.headline}
        </h3>
      </div>
      <ul className="p-5 space-y-3 flex-1">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-white/85 text-sm leading-snug">
            <span className="text-2xl flex-shrink-0 w-8 text-center" aria-hidden>{item.icon}</span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProteinSourceGuide() {
  return (
    <div className="max-w-6xl mx-auto mt-16">
      <div className="text-center mb-10">
        <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-2">
          Best Protein Sources
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase text-white mb-4">
          What to <span className="text-da-gold">Eat</span>
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Prioritize fresh, lean, minimally-processed sources of protein. Limit red meat to ~18 oz / 500 g
          (or 4 palms) per week or less.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SourceColumn data={PROTEIN_SOURCES.more} />
        <SourceColumn data={PROTEIN_SOURCES.some} />
        <SourceColumn data={PROTEIN_SOURCES.less} />
      </div>

      <p className="text-white/40 text-xs text-center mt-6 max-w-2xl mx-auto">
        Lentils &amp; beans count as protein for plant-based eaters and meatless meals — otherwise they're
        considered carbohydrate sources.
      </p>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
function ProteinCalculatorActual() {
  // Original defaults: lbs, male, age <34, body fat 20%, hours 0-1, plant-based No
  const [units, setUnits]         = useState('lbs')
  const [gender, setGender]       = useState('male')
  const [weight, setWeight]       = useState('')
  const [age, setAge]             = useState('age34')
  const [bodyFat, setBodyFat]     = useState(20)
  const [hours, setHours]         = useState('hours0')
  const [plantBased, setPlantBased] = useState('0')

  // Always work in lbs internally (matches original)
  const weight_lbs = useMemo(() => {
    const w = parseFloat(weight)
    if (!w) return 0
    if (w > 560) return 0  // matches original validation
    return units === 'kgs' ? w * 2.20462 : w
  }, [weight, units])

  const result = useMemo(
    () => calcProtein({ gender, weight_lbs, age, hours, bodyFatPct: bodyFat }),
    [gender, weight_lbs, age, hours, bodyFat]
  )

  const reset = () => {
    setUnits('lbs'); setGender('male'); setWeight(''); setAge('age34')
    setBodyFat(20); setHours('hours0'); setPlantBased('0')
  }

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
            The Diabetic Athletic <span className="text-da-gold">Protein</span> Calculator
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg">
            Use this free protein calculator to learn how much protein you should eat each day to achieve your goals.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-da-card rounded-2xl p-8 md:p-12 space-y-8">
          {/* ============== Imperial / Metric ============== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Imperial / Metric *
              </label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setUnits('lbs')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    units === 'lbs' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Lbs
                </button>
                <button
                  type="button"
                  onClick={() => setUnits('kgs')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    units === 'kgs' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Kgs
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    gender === 'male' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${
                    gender === 'female' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* ============== Weight ============== */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
              Weight ({units}) *
            </label>
            <input
              type="number"
              min="0"
              max="560"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={units === 'lbs' ? 'e.g. 165' : 'e.g. 75'}
              className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
            />
          </div>

          {/* ============== Age Range ============== */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
              Age Range *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AGE_RANGES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAge(a.id)}
                  className={`py-3 rounded-md text-sm font-bold uppercase transition border ${
                    age === a.id
                      ? 'bg-da-cyan text-da-dark border-da-cyan'
                      : 'bg-da-darker text-white/70 border-white/10 hover:border-white/30'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* ============== Body Fat % Selector ============== */}
          <BodyFatSelector
            sex={gender}
            value={bodyFat}
            onChange={setBodyFat}
          />

          {/* ============== Workout Hours ============== */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
              How many hours do you work out each week? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {WORKOUT_HOURS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHours(h.id)}
                  className={`py-3 rounded-md text-sm font-bold uppercase transition border ${
                    hours === h.id
                      ? 'bg-da-cyan text-da-dark border-da-cyan'
                      : 'bg-da-darker text-white/70 border-white/10 hover:border-white/30'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* ============== Plant-Based Diet ============== */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-1">
              Do you eat a mostly plant-based diet? *
            </label>
            <p className="text-white/50 text-xs mb-3">
              If 90%+ of food comes from plant-based sources
            </p>
            <select
              value={plantBased}
              onChange={(e) => setPlantBased(e.target.value)}
              className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan transition"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>

          {/* ============== Results ============== */}
          <div className="pt-4 border-t border-white/10">
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              Protein Goals:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-da-darker rounded-lg p-5 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-2">
                  Minimum
                </div>
                <div className="text-4xl md:text-5xl font-black text-white">
                  {result ? result.minimum : '—'}
                  <span className="text-base text-white/50 font-bold normal-case ml-1">g/day</span>
                </div>
              </div>
              <div className="bg-da-darker rounded-lg p-5 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-2">
                  Maximum
                </div>
                <div className="text-4xl md:text-5xl font-black text-white">
                  {result ? result.maximum : '—'}
                  <span className="text-base text-white/50 font-bold normal-case ml-1">g/day</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-da-cyan/10 to-da-gold/10 border-2 border-da-gold/40 rounded-lg p-6 text-center">
              <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-2">
                Optimal Intake
              </div>
              <div className="text-5xl md:text-7xl font-black text-white">
                {result ? result.optimal : '—'}
                <span className="text-base text-white/50 font-bold normal-case ml-2">g/day</span>
              </div>
            </div>

            <p className="text-white/40 text-xs mt-4">
              * make sure none of the above categories are left blank as that will throw off the final numbers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="gradient" size="lg" className="flex-1">
              Send My Personalized Plan →
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>

        {/* ============== Protein Source Guide (native — replaces image) ============== */}
        <ProteinSourceGuide />

        {/* ============== FAQ ============== */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="text-center mb-10">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-2">
              Frequently Asked
            </p>
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white">
              Protein <span className="text-da-gold">FAQs</span>
            </h2>
          </div>
          <div className="bg-da-card rounded-2xl px-6 md:px-10">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
