import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

const ZONES = [
  { num: 1, name: 'Recovery', low: 0.50, high: 0.60, color: 'bg-green-500/20 border-green-400/40 text-green-300', purpose: 'Active recovery, warm-up, cool-down. Build aerobic base.' },
  { num: 2, name: 'Endurance', low: 0.60, high: 0.70, color: 'bg-da-cyan/20 border-da-cyan/40 text-da-cyan', purpose: 'Fat burning, long steady runs. Best for body composition + glucose stability.' },
  { num: 3, name: 'Tempo', low: 0.70, high: 0.80, color: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300', purpose: 'Aerobic capacity, sustained efforts. Improves lactate threshold.' },
  { num: 4, name: 'Threshold', low: 0.80, high: 0.90, color: 'bg-orange-500/20 border-orange-400/40 text-orange-300', purpose: 'Maximum sustainable intensity. Builds race pace and grit.' },
  { num: 5, name: 'VO2 Max', low: 0.90, high: 1.00, color: 'bg-red-500/20 border-red-400/40 text-red-300', purpose: 'All-out intervals. Boosts peak performance — risky for hypos, fuel before.' },
]

export default function CardioCalculator() {
  const [age, setAge] = useState('')
  const [rhr, setRhr] = useState('')
  const [results, setResults] = useState(null)

  const calculate = (e) => {
    e.preventDefault()
    const ageNum = parseFloat(age)
    const rhrNum = parseFloat(rhr)
    if (!ageNum || !rhrNum) return alert('Please enter both age and resting heart rate')

    const mhr = 220 - ageNum
    const hrr = mhr - rhrNum

    const zones = ZONES.map(z => ({
      ...z,
      lowBpm: Math.round(rhrNum + (hrr * z.low)),
      highBpm: Math.round(rhrNum + (hrr * z.high)),
    }))

    setResults({ mhr, hrr, rhr: rhrNum, zones })
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link to="/free-resources" className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition">← Back to Free Resources</Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Cardio Calculator</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Heart Rate <span className="text-da-gold">Zones</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">Karvonen method — uses your resting heart rate for personalized, accurate zones.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <form onSubmit={calculate} className="bg-da-card rounded-2xl p-8 md:p-10 space-y-6 lg:col-span-1">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Your Stats</h2>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Age</label>
              <input type="number" min="10" max="120" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder="30" />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Resting HR (bpm)</label>
              <input type="number" min="30" max="120" value={rhr} onChange={(e) => setRhr(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder="60" />
              <p className="text-white/40 text-xs mt-2">Best measured first thing in the morning before getting out of bed.</p>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full">Calculate Zones →</Button>
          </form>

          <div className="lg:col-span-2 self-start">
            {results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-da-card rounded-lg p-4 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">Max HR</div>
                    <div className="text-2xl font-black text-white">{results.mhr} <span className="text-sm text-white/60">bpm</span></div>
                  </div>
                  <div className="bg-da-card rounded-lg p-4 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">Resting HR</div>
                    <div className="text-2xl font-black text-white">{results.rhr} <span className="text-sm text-white/60">bpm</span></div>
                  </div>
                  <div className="bg-da-card rounded-lg p-4 text-center">
                    <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">HR Reserve</div>
                    <div className="text-2xl font-black text-white">{results.hrr} <span className="text-sm text-white/60">bpm</span></div>
                  </div>
                </div>

                {results.zones.map(z => (
                  <div key={z.num} className={`rounded-xl border p-5 ${z.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-white">{z.num}</div>
                        <h3 className="text-xl font-black uppercase tracking-wider text-white">{z.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{z.lowBpm}–{z.highBpm}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wider">bpm · {Math.round(z.low * 100)}–{Math.round(z.high * 100)}% HRR</div>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{z.purpose}</p>
                  </div>
                ))}

                <p className="text-white/40 text-xs leading-relaxed p-4 border border-white/10 rounded-lg">
                  T1Ds: Zone 4–5 cardio raises BG short-term (adrenaline) but can cause delayed lows hours later. Zone 2 is the sweet spot for fat loss and stable glucose. Always carry fast carbs.
                </p>
              </div>
            ) : (
              <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10 h-full flex flex-col justify-center items-center">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-3">Awaiting Inputs</div>
                <p className="text-white/60">Enter your age and resting heart rate to calculate your 5 personalized training zones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
