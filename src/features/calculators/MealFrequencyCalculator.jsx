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
  return (
    <div className="space-y-3">
      <div className="bg-da-card rounded-2xl p-6">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-1">{dayType === 'training' ? 'Training Day' : 'Rest Day'} Meal Plan</p>
        <p className="text-white/40 text-sm">Daily totals stay constant across day types — only the structure shifts.</p>
      </div>

      {plan.meals.map((meal) => {
        const isPre  = meal.name === 'Pre-Workout'
        const isPost = meal.name === 'Post-Workout'
        const accentColor = isPre ? '#46C0ED' : isPost ? '#FCC826' : null
        const accentIcon = isPre ? '⚡' : isPost ? '💪' : null

        return (
          <div key={meal.idx}
            className="bg-da-card rounded-2xl p-5 md:p-6"
            style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                {meal.role === 'peri' && (
                  <p className="uppercase tracking-wider text-xs font-bold mb-1" style={{ color: accentColor }}>
                    {accentIcon} Peri-Workout
                  </p>
                )}
                <h3 className="text-xl font-black text-white uppercase tracking-wide">{meal.name}</h3>
                <p className="text-xs text-white/40 mt-1">Carbs type: <span className="text-white/60 capitalize">{meal.carbsType}</span></p>
              </div>
              {meal.warnOverFifty && (
                <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                  ⚠️ &gt;50g carbs
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {[
                ['Calories', meal.calories.toFixed(0), 'kcal'],
                ['Protein',  meal.protein.toFixed(1),  'g'],
                ['Carbs',    meal.carbs.toFixed(1),    'g'],
                ['Fat',      meal.fat.toFixed(1),      'g'],
                ['Fiber',    meal.fiber.toFixed(1),    'g'],
              ].map(([label, val, unit]) => (
                <div key={label} className="bg-da-dark/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
                  <p className="text-white font-bold">{val}<span className="text-white/40 text-xs ml-0.5">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EducationalCards() {
  return (
    <div className="space-y-4">
      {/* Three-Hour Rule */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">🕒 The Three-Hour Rule</p>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>The <strong className="text-white">timing</strong> of your pre-workout meal changes how you should <strong className="text-white">dose insulin</strong> for it (even though the meal's macros stay the same in this plan).</p>
          <p><strong className="text-white">A meal 3+ hours before training</strong> can be dosed normally — most short-acting insulin has a ~4-hour action window, so by the time you train you'll have roughly 25% of that bolus still on board. Great for strength work; minimal hypo risk for endurance.</p>
          <p><strong className="text-white">A meal within 1 hour of training</strong> is best dosed at roughly 25% of your usual amount (a 75% reduction). The remaining 75% would otherwise stack with exercise-driven glucose drops.</p>
          <p>
            <Link to="/calculators/magic-ratio" className="text-da-cyan underline font-bold">
              → Use the Magic Ratio Calculator to calibrate your insulin-to-carb ratio
            </Link>
          </p>
        </div>
      </div>

      {/* Post-workout insulin sensitivity */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-gold">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-3">💉 Post-Workout Insulin Sensitivity</p>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>You're significantly more insulin-sensitive <strong className="text-white">during and after</strong> training — for up to 24 hours, peaking 4–6 hours after exercise.</p>
          <p>Most people benefit from reducing the post-workout meal bolus by <strong className="text-white">50–75%</strong> of their normal insulin-to-carb ratio. Recheck glucose at 30 min and 2 hours post-meal to verify.</p>
          <p>
            <Link to="/calculators/magic-ratio" className="text-da-gold underline font-bold">
              → Recalibrate around training with the Magic Ratio Calculator
            </Link>
          </p>
        </div>
      </div>

      {/* Coaching notes */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Coach's Notes</p>
        <ul className="space-y-2 text-sm text-white/70">
          <li>💧 <strong className="text-white">Eat in a relaxed state.</strong> Suit meals to your life schedule, not the other way around.</li>
          <li>⚠️ <strong className="text-white">Carbs used to treat hypos count.</strong> Adjust meals down on days you've had to treat lows.</li>
          <li>🎯 <strong className="text-white">This is a template, not a rule.</strong> Shift meal timing as needed — daily totals are what matter.</li>
          <li>🍎 <strong className="text-white">Pre-workout = simple carbs, post-workout = complex carbs.</strong> Same macro amounts, different carb types for utilization and replenishment.</li>
        </ul>
      </div>
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Meal Frequency Planner produces structural eating templates based on Nicholas's coaching system. Individual macro needs, insulin responses, and meal tolerances vary widely. The 35–45g carbs-per-meal range is a heuristic, not a prescription. Always check glucose around meals. Consult your endocrinologist or registered dietitian before significant dietary changes.</p>
    </div>
  )
}
