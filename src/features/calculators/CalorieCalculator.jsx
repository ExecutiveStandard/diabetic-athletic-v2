import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

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

export default function CalorieCalculator() {
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

  const reset = () => {
    setFirstName(''); setEmail(''); setAge(''); setWeight('')
    setHeightCm(''); setHeightFt(''); setHeightIn('')
    setActivity(null); setGoal(null)
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
