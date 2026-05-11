import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { buildDayPlan } from './meal-frequency/planner'
import { defaultMealCount, suggestMealCount } from './meal-frequency/mealCount'

const TRAINING_TIMES = [
  { id: 'morning',   label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening' },
]

export default function MealFrequencyCalculator() {
  const [calories, setCalories] = useState('')
  const [protein,  setProtein]  = useState('')
  const [fat,      setFat]      = useState('')
  const [carbs,    setCarbs]    = useState('')
  const [fiber,    setFiber]    = useState('25')

  const [dayType,      setDayType]      = useState('rest')
  const [trainingTime, setTrainingTime] = useState('afternoon')
  const [carbWeight,   setCarbWeight]   = useState(0.65)
  const [fatWeight,    setFatWeight]    = useState(0.15)

  const [mealCount,    setMealCount]    = useState(defaultMealCount('rest'))
  const [userOverrodeN, setUserOverrodeN] = useState(false)

  const carbsNum = parseFloat(carbs) || 0

  // Re-suggest meal count when dayType / carbs / carbWeight change — UNLESS user has overridden
  const suggestion = useMemo(() => {
    if (carbsNum <= 0) return null
    return suggestMealCount({ dayType, dailyCarbs: carbsNum, carbWeight })
  }, [dayType, carbsNum, carbWeight])

  useEffect(() => {
    if (suggestion && !userOverrodeN) setMealCount(suggestion.N)
  }, [suggestion, userOverrodeN])

  // Reset override flag when daytype changes (fresh start)
  useEffect(() => {
    setUserOverrodeN(false)
    setMealCount(defaultMealCount(dayType))
  }, [dayType])

  const plan = useMemo(() => {
    if (!protein || !fat || !carbs || !fiber) return null
    return buildDayPlan({
      calories: parseFloat(calories) || 0,
      protein:  parseFloat(protein),
      fat:      parseFloat(fat),
      carbs:    parseFloat(carbs),
      fiber:    parseFloat(fiber),
      N: mealCount,
      dayType,
      trainingTime,
      carbWeight,
      fatWeight,
    })
  }, [calories, protein, fat, carbs, fiber, mealCount, dayType, trainingTime, carbWeight, fatWeight])

  const overrideMealCount = (n) => {
    setUserOverrodeN(true)
    setMealCount(n)
  }

  const reset = () => {
    setCalories(''); setProtein(''); setFat(''); setCarbs(''); setFiber('25')
    setDayType('rest'); setCarbWeight(0.65); setFatWeight(0.15)
    setUserOverrodeN(false); setMealCount(defaultMealCount('rest'))
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <Link to="/free-resources" className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4 inline-block">
            ← Back to Free Resources
          </Link>
          <p className="text-da-gold uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">🍽 Meal Frequency Planner</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Meal Frequency <span className="text-da-cyan">Planner</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Turn your daily macros into a structured eating plan — peri-workout-weighted, dosing-accurate, and built from Nicholas's coaching system.
          </p>
        </div>
      </section>

      <section className="da-container section-padding">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-da-card rounded-2xl p-6 md:p-8 space-y-6">

            {/* Daily totals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ['Calories', calories, setCalories, 'kcal'],
                ['Protein',  protein,  setProtein,  'g'],
                ['Fat',      fat,      setFat,      'g'],
                ['Carbs',    carbs,    setCarbs,    'g'],
                ['Fiber',    fiber,    setFiber,    'g'],
              ].map(([label, val, set, unit]) => (
                <div key={label}>
                  <label className="block text-da-cyan uppercase tracking-wider text-[10px] font-bold mb-1">{label}</label>
                  <div className="relative">
                    <input type="number" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} placeholder="0"
                      className="w-full bg-da-dark border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {plan?.macroConsistencyWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-200">
                ⚠️ Your stated macros don't match your stated calories (off by {Math.round(plan.macroCalorieDelta)} kcal). The plan uses your macros — double-check your numbers.
              </div>
            )}

            {/* Day type */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Day Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[['rest', 'Rest Day'], ['training', 'Training Day']].map(([d, lbl]) => (
                  <button key={d} type="button" onClick={() => setDayType(d)}
                    className={`py-3 rounded-lg ${dayType === d ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Training-day extra inputs */}
            {dayType === 'training' && (
              <>
                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Training Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRAINING_TIMES.map((t) => (
                      <button key={t.id} type="button" onClick={() => setTrainingTime(t.id)}
                        className={`py-3 rounded-lg ${trainingTime === t.id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">
                    Peri-Workout Carb Weight — {Math.round(carbWeight * 100)}%
                  </label>
                  <p className="text-xs text-white/40 mb-2">Fraction of daily carbs in the pre + post workout meals combined. Sheet default: 65%.</p>
                  <input type="range" min="0.40" max="0.80" step="0.05" value={carbWeight}
                    onChange={(e) => setCarbWeight(parseFloat(e.target.value))}
                    className="w-full accent-da-cyan" />
                </div>

                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">
                    Peri-Workout Fat Weight — {Math.round(fatWeight * 100)}%
                  </label>
                  <p className="text-xs text-white/40 mb-2">Fraction of daily fat in pre + post combined. Lower keeps peri meals light. Sheet default: 15%.</p>
                  <input type="range" min="0.10" max="0.30" step="0.05" value={fatWeight}
                    onChange={(e) => setFatWeight(parseFloat(e.target.value))}
                    className="w-full accent-da-cyan" />
                </div>
              </>
            )}

            {/* Meal count */}
            {carbsNum > 0 && (
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Meal Count</label>
                {suggestion && (
                  <p className="text-xs text-white/50 mb-2">
                    Suggested: <strong className="text-da-cyan">{suggestion.N} meals</strong>
                    {dayType === 'training'
                      ? ` (peri ~${suggestion.peri.toFixed(1)}g carbs, regular ~${suggestion.regular.toFixed(1)}g carbs)`
                      : ` (each meal ~${suggestion.perMeal.toFixed(1)}g carbs)`
                    }
                  </p>
                )}
                {suggestion?.suggestReducePeriWeight && (
                  <p className="text-xs text-yellow-300 mb-2">
                    ⚠️ Peri-workout meals alone would exceed 45g carbs. Consider lowering the carb weight above.
                  </p>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <button key={n} type="button" onClick={() => overrideMealCount(n)}
                      className={`py-3 rounded-lg ${mealCount === n ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {plan && <MealTimeline plan={plan} dayType={dayType} />}

          <EducationalCards />

          <div className="text-center pt-4">
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>

          <Disclaimer />
        </div>
      </section>
    </div>
  )
}

function MealTimeline({ plan, dayType }) {
  // Implemented in Task 2.6
  return null
}

function EducationalCards() {
  // Implemented in Task 2.7
  return null
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Meal Frequency Planner produces structural eating templates based on Nicholas's coaching system. Individual macro needs, insulin responses, and meal tolerances vary widely. The 35–45g carbs-per-meal range is a heuristic, not a prescription. Always check glucose around meals. Consult your endocrinologist or registered dietitian before significant dietary changes.</p>
    </div>
  )
}
