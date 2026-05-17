import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import {
  computeMacros,
  MACRO_DEFAULTS,
  FIBER_DEFAULT_G,
  SLIDER_RANGES,
} from './calorie-tdee/macros'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function CalorieCalculator() {
  return (
    <OptInGate slug="calorie" {...OPT_IN_CONTENT.calorie}>
      <CalorieCalculatorActual />
    </OptInGate>
  )
}

// Activity multipliers — matches the original Diabetic Athletic CCalc.io widget exactly.
// These are slightly lower than the textbook Mifflin-St Jeor multipliers (1.375, 1.55, 1.725)
// — Nicholas tunes these for typical T1D coaching clients.
const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentary',           detail: 'Office job' },
  { value: 1.3, label: 'Light Exercise',      detail: '1–2 days/week' },
  { value: 1.5, label: 'Moderate Exercise',   detail: '3–5 days/week' },
  { value: 1.7, label: 'Heavy Exercise',      detail: '5–7 days/week' },
  { value: 1.9, label: 'Athlete',             detail: '2× per day' },
]

// Goal offsets — matches the original calculator. Three options, fixed offsets.
const GOALS = [
  { id: 'loss',     label: 'Weight Loss',          offset: -500 },
  { id: 'maintain', label: 'Maintain Weight',      offset: 0 },
  { id: 'gain',     label: 'Weight / Muscle Gain', offset: 300 },
]

// Mifflin-St Jeor BMR
function calcBMR({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

function CalorieCalculatorActual() {
  // Lead capture
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  // Stats
  const [gender, setGender] = useState('male')
  const [units, setUnits] = useState('metric')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')

  // Activity & goal — null until user picks one (mirrors the original UX)
  const [activity, setActivity] = useState(null)
  const [goal, setGoal] = useState(null)

  // Macro state — initialized to null; set by useEffect when goal is picked.
  const [proteinPerKg, setProteinPerKg] = useState(null)
  const [fatPercent,   setFatPercent]   = useState(null)
  const [fiberGrams,   setFiberGrams]   = useState(FIBER_DEFAULT_G)

  // Convert inputs to metric for calculation
  const metric = useMemo(() => {
    const ageNum = parseFloat(age)
    let weightKg, hCm
    if (units === 'metric') {
      weightKg = parseFloat(weight)
      hCm = parseFloat(heightCm)
    } else {
      weightKg = parseFloat(weight) * 0.453592
      const totalIn = parseFloat(heightFt || 0) * 12 + parseFloat(heightIn || 0)
      hCm = totalIn * 2.54
    }
    return { ageNum, weightKg, heightCm: hCm }
  }, [units, age, weight, heightCm, heightFt, heightIn])

  // Live BMR
  const bmr = useMemo(() => {
    const { ageNum, weightKg, heightCm } = metric
    if (!ageNum || !weightKg || !heightCm) return null
    return calcBMR({ gender, weightKg, heightCm, age: ageNum })
  }, [metric, gender])

  const tdee = useMemo(() => {
    if (!bmr || !activity) return null
    return Math.round(bmr * activity.value)
  }, [bmr, activity])

  const goalCalories = useMemo(() => {
    if (!tdee || !goal) return null
    return tdee + goal.offset
  }, [tdee, goal])

  // When goal changes, reset protein/fat sliders to goal-specific defaults.
  // Fiber is not reset — user's slider position persists across goal changes.
  useEffect(() => {
    if (!goal) return
    const defaults = MACRO_DEFAULTS[goal.id]
    if (!defaults) return
    setProteinPerKg(defaults.proteinPerKg)
    setFatPercent(defaults.fatPercent)
  }, [goal])

  // Derived macros — recompute whenever any input changes.
  const macros = useMemo(() => {
    if (!goalCalories || !metric.weightKg || proteinPerKg == null) return null
    return computeMacros({
      goalCalories,
      bodyweightKg: metric.weightKg,
      proteinPerKg,
      fatPercent,
      fiberGrams,
    })
  }, [goalCalories, metric.weightKg, proteinPerKg, fatPercent, fiberGrams])

  // URL query string for cross-tool hand-off to the Meal Frequency Planner.
  const macroQueryString = useMemo(() => {
    if (!macros || !goalCalories) return ''
    const params = new URLSearchParams({
      calories: Math.round(goalCalories).toString(),
      protein:  Math.round(macros.protein).toString(),
      fat:      Math.round(macros.fat).toString(),
      carbs:    Math.round(macros.carbs).toString(),
      fiber:    Math.round(macros.fiber).toString(),
    })
    return `?${params.toString()}`
  }, [macros, goalCalories])

  const reset = () => {
    setFirstName(''); setEmail(''); setAge(''); setWeight('')
    setHeightCm(''); setHeightFt(''); setHeightIn('')
    setActivity(null); setGoal(null)
    setProteinPerKg(null); setFatPercent(null); setFiberGrams(FIBER_DEFAULT_G)
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
            🔥 Calorie Calculator
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Total Daily <span className="text-da-gold">Energy Expenditure</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg">
            Calculate your BMR and personalized daily calorie target using the Mifflin-St Jeor formula —
            tuned for diabetic athletes.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-da-card rounded-2xl p-8 md:p-12 space-y-10">
          {/* ============== STEP 1: Required Info ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              Required Info
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your First Name…"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your BEST Email Address *"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />

              <input
                type="number"
                min="10" max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="How old are you? *"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />

              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setUnits('metric')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'metric' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}
                >
                  Metric (cm / kg)
                </button>
                <button
                  type="button"
                  onClick={() => setUnits('imperial')}
                  className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'imperial' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}
                >
                  Imperial (ft / lbs)
                </button>
              </div>

              {units === 'metric' ? (
                <input
                  type="number"
                  min="50" max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="What is your height in CM? *"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number" min="3" max="8"
                    value={heightFt} onChange={(e) => setHeightFt(e.target.value)}
                    placeholder="Height (ft)"
                    className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                  />
                  <input
                    type="number" min="0" max="11"
                    value={heightIn} onChange={(e) => setHeightIn(e.target.value)}
                    placeholder="Height (in)"
                    className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                  />
                </div>
              )}

              <input
                type="number"
                min="20" max="500" step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`What is your weight in ${units === 'metric' ? 'KG' : 'LBS'}? *`}
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="radio" name="gender" checked={gender === 'male'}
                    onChange={() => setGender('male')} className="accent-da-cyan w-4 h-4"
                  />
                  <span className="font-bold">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="radio" name="gender" checked={gender === 'female'}
                    onChange={() => setGender('female')} className="accent-da-cyan w-4 h-4"
                  />
                  <span className="font-bold">Female</span>
                </label>
              </div>
            </div>
          </section>

          {/* ============== STEP 2: BMR Result ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              Your BMR is:
            </h2>
            <div className="bg-da-darker border border-white/15 rounded-lg p-5 text-center mb-5">
              <div className="text-5xl md:text-6xl font-black text-white">
                {bmr ? bmr.toLocaleString() : '—'}
                <span className="text-base md:text-lg text-white/50 font-bold normal-case ml-2">cal/day</span>
              </div>
            </div>

            <div className="bg-da-gold/15 border-l-4 border-da-gold rounded-r-lg p-5 text-white/90 text-sm leading-relaxed space-y-3">
              <p>
                <span className="font-black">Definition:</span> BMR is the amount of energy (calories) your body needs to perform basic life-sustaining functions while at rest.
              </p>
              <p>
                <span className="font-black">Basic Functions Include:</span> Breathing, circulating blood, controlling body temperature, cell growth, brain function, and even keeping your heart beating.
              </p>
              <p>
                <span className="font-black">Think of it as:</span> The number of calories you would burn if you did nothing but lie in bed all day.
              </p>
            </div>
          </section>

          {/* ============== STEP 3: Activity Factor ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-3">
              To calculate your total daily calorie expenditure, we need one final piece of information —
              your activity factor. What best describes your current activity level?
            </h2>

            <div className="space-y-2 mt-5">
              {ACTIVITY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-start gap-3 p-4 rounded-md cursor-pointer transition border ${
                    activity?.value === level.value
                      ? 'bg-da-cyan/15 border-da-cyan/50'
                      : 'bg-da-darker border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio" name="activity"
                    checked={activity?.value === level.value}
                    onChange={() => setActivity(level)}
                    className="mt-1 accent-da-cyan"
                  />
                  <div className="text-white font-bold text-sm">
                    {level.label} <span className="text-white/50 font-normal">({level.detail})</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* ============== STEP 4: TDEE Result ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              Your total daily energy expenditure is:
            </h2>
            <div className="bg-da-darker border border-da-cyan/40 rounded-lg p-5 text-center mb-5">
              <div className="text-5xl md:text-6xl font-black text-white">
                {tdee ? tdee.toLocaleString() : '—'}
                <span className="text-base md:text-lg text-white/50 font-bold normal-case ml-2">cal/day</span>
              </div>
            </div>

            <div className="bg-da-gold/15 border-l-4 border-da-gold rounded-r-lg p-5 text-white/90 text-sm leading-relaxed">
              <p>
                <span className="font-black">This is the average number of calories</span> to aim for to maintain your current bodyweight at your current activity levels. For a more accurate figure based on your goals, please complete the next section.
              </p>
            </div>
          </section>

          {/* ============== STEP 5: Goal ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              What is your goal?
            </h2>

            <div className="space-y-2">
              {GOALS.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-3 p-4 rounded-md cursor-pointer transition border ${
                    goal?.id === g.id
                      ? 'bg-da-cyan/15 border-da-cyan/50'
                      : 'bg-da-darker border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio" name="goal"
                    checked={goal?.id === g.id}
                    onChange={() => setGoal(g)}
                    className="accent-da-cyan"
                  />
                  <div className="text-white font-bold text-sm">{g.label}</div>
                  <div className="ml-auto text-xs text-white/50">
                    {g.offset > 0 ? `+${g.offset}` : g.offset === 0 ? 'TDEE' : g.offset} cal
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* ============== STEP 6: Goal Calorie Result ============== */}
          <section>
            <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-5">
              Based on your goal, your estimated daily calories should be approximately:
            </h2>
            <div className="bg-gradient-to-br from-da-cyan/10 to-da-gold/10 border-2 border-da-gold/40 rounded-lg p-6 text-center mb-5">
              <div className="text-5xl md:text-7xl font-black text-white">
                {goalCalories ? goalCalories.toLocaleString() : '—'}
                <span className="text-base md:text-lg text-white/50 font-bold normal-case ml-2">cal/day</span>
              </div>
              {goal && tdee && (
                <div className="text-da-cyan text-sm font-bold uppercase tracking-wider mt-2">
                  {goal.label}
                </div>
              )}
            </div>

            <div className="bg-da-gold/15 border-l-4 border-da-gold rounded-r-lg p-5 text-white/90 text-sm leading-relaxed">
              <p>
                This result is based on the information provided, however should not be taken as prescriptive advice. Other factors can impact scale weight, such as stress, sleep, hydration and dietary intake. It's important to check with a health care practitioner or qualified person before starting any new nutrition or training regime.
              </p>
            </div>
          </section>

          {/* ============== STEP 7: Macro Breakdown ============== */}
          {macros && (
            <section>
              <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-2">
                Your Daily Macro Targets
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Tuned for Type 1 diabetic athletes by Diabetic Athletic. Adjust the sliders to fine-tune.
              </p>

              {/* Protein slider */}
              <div className="mb-5">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Protein — {proteinPerKg.toFixed(1)} g/kg = <span className="text-da-cyan">{Math.round(macros.protein)}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.protein.min}
                  max={SLIDER_RANGES.protein.max}
                  step={SLIDER_RANGES.protein.step}
                  value={proteinPerKg}
                  onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{SLIDER_RANGES.protein.min}</span>
                  <span>{SLIDER_RANGES.protein.max} g/kg</span>
                </div>
              </div>

              {/* Fat slider */}
              <div className="mb-5">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Fat — {Math.round(fatPercent * 100)}% of calories = <span className="text-da-cyan">{Math.round(macros.fat)}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.fat.min}
                  max={SLIDER_RANGES.fat.max}
                  step={SLIDER_RANGES.fat.step}
                  value={fatPercent}
                  onChange={(e) => setFatPercent(parseFloat(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{Math.round(SLIDER_RANGES.fat.min * 100)}%</span>
                  <span>{Math.round(SLIDER_RANGES.fat.max * 100)}%</span>
                </div>
              </div>

              {/* Fiber slider */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Fiber — <span className="text-da-cyan">{fiberGrams}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.fiber.min}
                  max={SLIDER_RANGES.fiber.max}
                  step={SLIDER_RANGES.fiber.step}
                  value={fiberGrams}
                  onChange={(e) => setFiberGrams(parseInt(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{SLIDER_RANGES.fiber.min}g</span>
                  <span>{SLIDER_RANGES.fiber.max}g</span>
                </div>
                <p className="text-xs text-white/40 mt-2 italic">
                  The UK Scientific Advisory Committee on Nutrition (SCAN, 2015) recommends a minimum 30g/day for general health. Slider goes up to 40g for aggressive-deficit cases where volume feeding via non-starchy vegetables increases fiber intake.
                </p>
              </div>

              {/* Result tiles or guard-rail warning */}
              {macros.carbsClampedToZero ? (
                <div className="bg-red-500/15 border border-red-500/40 rounded-lg p-4 text-red-200 text-sm">
                  ⚠️ Your protein and fat alone exceed your goal calories. Lower one to make room for carbs, or recheck your TDEE inputs.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Protein', grams: macros.protein, cal: macros.proteinCal, pct: macros.proteinPercent, color: 'da-cyan' },
                    { label: 'Carbs',   grams: macros.carbs,   cal: macros.carbsCal,   pct: macros.carbsPercent,   color: 'white' },
                    { label: 'Fat',     grams: macros.fat,     cal: macros.fatCal,     pct: macros.fatPercent,     color: 'da-gold' },
                    { label: 'Fiber',   grams: macros.fiber,   cal: null,              pct: null,                  color: 'white' },
                  ].map(({ label, grams, cal, pct, color }) => (
                    <div key={label} className="bg-da-darker/60 rounded-lg p-4 text-center">
                      <p className={`text-[10px] uppercase tracking-wider text-${color === 'white' ? 'white/60' : color} mb-1 font-bold`}>{label}</p>
                      <p className="text-2xl font-black text-white">{Math.round(grams)}<span className="text-xs text-white/40 ml-1">g</span></p>
                      {cal != null && (
                        <p className="text-xs text-white/40 mt-1">{Math.round(cal)} kcal</p>
                      )}
                      {pct != null && (
                        <p className="text-xs text-white/40">{Math.round(pct)}%</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cross-tool CTA */}
              {!macros.carbsClampedToZero && (
                <Link to={`/calculators/meal-frequency${macroQueryString}`}>
                  <Button type="button" variant="gradient" size="lg" className="w-full">
                    🍽 Use these macros in the Meal Frequency Planner →
                  </Button>
                </Link>
              )}
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="gradient" size="lg" className="flex-1">
              Send My Personalized Plan →
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>

        <p className="text-white/40 text-xs text-center mt-8 max-w-2xl mx-auto">
          Math: Mifflin-St Jeor BMR × activity multiplier (1.2 / 1.3 / 1.5 / 1.7 / 1.9). Goal offsets: −500 (loss),
          0 (maintain), +300 (gain). Always validate with your healthcare provider, especially if managing T1D.
        </p>
      </div>
    </div>
  )
}
