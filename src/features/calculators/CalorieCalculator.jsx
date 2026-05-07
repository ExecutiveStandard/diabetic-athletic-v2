import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentary', desc: 'Little to no exercise, desk job' },
  { value: 1.375, label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { value: 1.55, label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { value: 1.725, label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 1.9, label: 'Extremely Active', desc: 'Hard daily training + physical job' },
]

export default function CalorieCalculator() {
  const [gender, setGender] = useState('male')
  const [units, setUnits] = useState('metric')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [activity, setActivity] = useState(1.55)
  const [results, setResults] = useState(null)

  const calculate = (e) => {
    e.preventDefault()

    let weightKg, heightCm
    if (units === 'metric') {
      weightKg = parseFloat(weight)
      heightCm = parseFloat(height)
    } else {
      weightKg = parseFloat(weight) * 0.453592
      const totalInches = (parseFloat(heightFt || 0) * 12) + parseFloat(heightIn || 0)
      heightCm = totalInches * 2.54
    }
    const ageNum = parseFloat(age)

    if (!weightKg || !heightCm || !ageNum) {
      alert('Please fill in all required fields')
      return
    }

    // Mifflin-St Jeor BMR
    const bmr = gender === 'male'
      ? (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5
      : (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161

    const tdee = bmr * activity

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      cut: Math.round(tdee - 500),
      aggressiveCut: Math.round(tdee - 750),
      bulk: Math.round(tdee + 300),
      aggressiveBulk: Math.round(tdee + 500),
    })
  }

  const reset = () => {
    setAge('')
    setWeight('')
    setHeight('')
    setHeightFt('')
    setHeightIn('')
    setResults(null)
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link to="/free-resources" className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition">
          ← Back to Free Resources
        </Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Calorie Calculator</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Calorie & <span className="text-da-gold">TDEE</span> Calculator
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Mifflin-St Jeor formula. Get your BMR, TDEE, and personalized calorie targets for any goal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <form onSubmit={calculate} className="bg-da-card rounded-2xl p-8 md:p-10 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Your Stats</h2>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Units</label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button type="button" onClick={() => setUnits('metric')} className={`py-2 px-3 rounded text-sm font-bold uppercase transition ${units === 'metric' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Metric</button>
                <button type="button" onClick={() => setUnits('imperial')} className={`py-2 px-3 rounded text-sm font-bold uppercase transition ${units === 'imperial' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Imperial</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button type="button" onClick={() => setGender('male')} className={`py-2 px-3 rounded text-sm font-bold uppercase transition ${gender === 'male' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Male</button>
                <button type="button" onClick={() => setGender('female')} className={`py-2 px-3 rounded text-sm font-bold uppercase transition ${gender === 'female' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>Female</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Age</label>
              <input type="number" min="10" max="120" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder="30" />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Weight ({units === 'metric' ? 'kg' : 'lbs'})</label>
              <input type="number" min="20" max="500" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder={units === 'metric' ? '75' : '165'} />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Height ({units === 'metric' ? 'cm' : 'ft / in'})</label>
              {units === 'metric' ? (
                <input type="number" min="50" max="250" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder="180" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="3" max="8" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder="ft" />
                  <input type="number" min="0" max="11" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition" placeholder="in" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-3">Activity Level</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <label key={level.value} className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition border ${activity === level.value ? 'bg-da-cyan/15 border-da-cyan/50' : 'bg-da-darker border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="activity" value={level.value} checked={activity === level.value} onChange={() => setActivity(level.value)} className="mt-1 accent-da-cyan" />
                    <div>
                      <div className="text-white font-bold text-sm">{level.label}</div>
                      <div className="text-white/50 text-xs">{level.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="gradient" size="lg" className="flex-1">Calculate →</Button>
              <Button type="button" variant="outline" size="lg" onClick={reset}>Reset</Button>
            </div>
          </form>

          <div className="lg:sticky lg:top-24 self-start">
            {results ? (
              <div className="bg-da-card-accent rounded-2xl p-8 md:p-10 space-y-6">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">Your Results</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-da-darker rounded-lg p-4 border border-white/10">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">BMR</div>
                    <div className="text-3xl font-black text-white">{results.bmr.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">cal/day at rest</div>
                  </div>
                  <div className="bg-da-darker rounded-lg p-4 border border-da-gold/40">
                    <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-1">TDEE</div>
                    <div className="text-3xl font-black text-white">{results.tdee.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">cal/day total</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Goal Targets</h3>
                  {[
                    { label: 'Aggressive Fat Loss', val: results.aggressiveCut, sub: '-750 cal/day · ~1.5 lb/week' },
                    { label: 'Moderate Fat Loss', val: results.cut, sub: '-500 cal/day · ~1 lb/week' },
                    { label: 'Maintenance', val: results.tdee, sub: 'Hold your current weight' },
                    { label: 'Lean Bulk', val: results.bulk, sub: '+300 cal/day · ~0.5 lb/week' },
                    { label: 'Aggressive Bulk', val: results.aggressiveBulk, sub: '+500 cal/day · ~1 lb/week' },
                  ].map((goal) => (
                    <div key={goal.label} className="flex items-center justify-between p-3 bg-da-darker/50 rounded-lg border border-white/5">
                      <div>
                        <div className="text-white text-sm font-bold">{goal.label}</div>
                        <div className="text-white/40 text-xs">{goal.sub}</div>
                      </div>
                      <div className="text-2xl font-black text-da-cyan">{goal.val.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <p className="text-white/40 text-xs leading-relaxed pt-4 border-t border-white/10">
                  These are estimates. Track your weight weekly and adjust calories ±100-200/day if you're not seeing the change you want after 2 weeks. T1Ds: monitor BG closely on cuts, low-glucose risk increases with caloric deficits.
                </p>
              </div>
            ) : (
              <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-3">Awaiting Inputs</div>
                <p className="text-white/60">Fill in your stats and hit Calculate to see your personalized targets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
