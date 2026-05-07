import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

const GOALS = [
  { id: 'cut', label: 'Fat Loss / Cut', range: [1.8, 2.2], desc: 'Preserve muscle in a deficit' },
  { id: 'maintain', label: 'Maintenance', range: [1.4, 1.8], desc: 'Hold lean mass, recover well' },
  { id: 'bulk', label: 'Muscle Gain / Bulk', range: [1.6, 2.0], desc: 'Build new tissue efficiently' },
  { id: 'athlete', label: 'High-Performance Athlete', range: [2.0, 2.4], desc: 'Heavy training, fast recovery' },
]

export default function ProteinCalculator() {
  const [units, setUnits] = useState('metric')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState('maintain')
  const [meals, setMeals] = useState(4)
  const [results, setResults] = useState(null)

  const calculate = (e) => {
    e.preventDefault()
    const weightKg = units === 'metric' ? parseFloat(weight) : parseFloat(weight) * 0.453592
    if (!weightKg) return alert('Please enter your weight')

    const goalData = GOALS.find(g => g.id === goal)
    const lowG = Math.round(weightKg * goalData.range[0])
    const highG = Math.round(weightKg * goalData.range[1])
    const targetG = Math.round(weightKg * ((goalData.range[0] + goalData.range[1]) / 2))

    setResults({
      low: lowG,
      target: targetG,
      high: highG,
      perMeal: Math.round(targetG / meals),
      meals,
      goalLabel: goalData.label,
      kcal: Math.round(targetG * 4),
    })
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link to="/free-resources" className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition">← Back to Free Resources</Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Protein Calculator</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Daily <span className="text-da-gold">Protein</span> Target
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">Optimal intake to preserve muscle, manage glucose, and recover faster.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <form onSubmit={calculate} className="bg-da-card rounded-2xl p-8 md:p-10 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Your Stats</h2>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Units</label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button type="button" onClick={() => setUnits('metric')} className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'metric' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Metric</button>
                <button type="button" onClick={() => setUnits('imperial')} className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'imperial' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Imperial</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Body Weight ({units === 'metric' ? 'kg' : 'lbs'})</label>
              <input type="number" min="20" max="500" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder={units === 'metric' ? '75' : '165'} />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-3">Goal</label>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <label key={g.id} className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition border ${goal === g.id ? 'bg-da-cyan/15 border-da-cyan/50' : 'bg-da-darker border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="goal" checked={goal === g.id} onChange={() => setGoal(g.id)} className="mt-1 accent-da-cyan" />
                    <div>
                      <div className="text-white font-bold text-sm">{g.label}</div>
                      <div className="text-white/50 text-xs">{g.range[0]}–{g.range[1]} g/kg · {g.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Meals per Day: <span className="text-da-cyan">{meals}</span></label>
              <input type="range" min="2" max="6" value={meals} onChange={(e) => setMeals(parseInt(e.target.value))} className="w-full accent-da-cyan" />
              <div className="flex justify-between text-xs text-white/40 mt-1"><span>2</span><span>6</span></div>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full">Calculate →</Button>
          </form>

          <div className="lg:sticky lg:top-24 self-start">
            {results ? (
              <div className="bg-da-card-accent rounded-2xl p-8 md:p-10 space-y-6">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">Your Protein Plan</h2>

                <div className="bg-da-darker rounded-lg p-6 border border-da-gold/40 text-center">
                  <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-2">Daily Target ({results.goalLabel})</div>
                  <div className="text-5xl md:text-6xl font-black text-white mb-1">{results.target}<span className="text-2xl text-white/60">g</span></div>
                  <div className="text-white/50 text-sm">Range: {results.low}g – {results.high}g</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-da-darker rounded-lg p-4 border border-white/10 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">Per Meal</div>
                    <div className="text-2xl font-black text-white">{results.perMeal}g</div>
                    <div className="text-white/40 text-xs">across {results.meals} meals</div>
                  </div>
                  <div className="bg-da-darker rounded-lg p-4 border border-white/10 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">Calories</div>
                    <div className="text-2xl font-black text-white">{results.kcal.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">from protein only</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-3">Real-Food Equivalents</h3>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex justify-between"><span>Chicken breast (raw)</span><span className="text-white">~{Math.round(results.target / 0.31)}g</span></div>
                    <div className="flex justify-between"><span>Whey protein scoops</span><span className="text-white">~{Math.round(results.target / 25)} scoops</span></div>
                    <div className="flex justify-between"><span>Large eggs</span><span className="text-white">~{Math.round(results.target / 6)} eggs</span></div>
                  </div>
                </div>

                <p className="text-white/40 text-xs leading-relaxed pt-4 border-t border-white/10">
                  Distribute evenly across meals for max muscle protein synthesis. T1Ds: protein has a small but real impact on BG over 3-5 hours — log meals and watch the late post-meal trace.
                </p>
              </div>
            ) : (
              <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-3">Awaiting Inputs</div>
                <p className="text-white/60">Enter your weight and goal to get your daily protein target.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
