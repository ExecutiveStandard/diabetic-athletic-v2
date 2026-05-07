import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

export default function InsulinCalculator() {
  const [units, setUnits] = useState('mgdl')
  const [carbs, setCarbs] = useState('')
  const [icRatio, setIcRatio] = useState('')
  const [currentBG, setCurrentBG] = useState('')
  const [targetBG, setTargetBG] = useState(100)
  const [isf, setIsf] = useState('')
  const [iob, setIob] = useState('0')
  const [results, setResults] = useState(null)

  const calculate = (e) => {
    e.preventDefault()
    const c = parseFloat(carbs)
    const ic = parseFloat(icRatio)
    const bg = parseFloat(currentBG)
    const tgt = parseFloat(targetBG)
    const sens = parseFloat(isf)
    const onBoard = parseFloat(iob || 0)

    if (!c || !ic) return alert('Carbs and I:C ratio are required')

    const mealDose = c / ic
    let correctionDose = 0
    if (bg && tgt && sens) {
      correctionDose = (bg - tgt) / sens
    }
    const totalBeforeIOB = mealDose + correctionDose
    const finalDose = Math.max(0, totalBeforeIOB - onBoard)

    setResults({
      mealDose: Math.round(mealDose * 10) / 10,
      correctionDose: Math.round(correctionDose * 10) / 10,
      iob: onBoard,
      finalDose: Math.round(finalDose * 10) / 10,
      bgDelta: bg && tgt ? Math.round((bg - tgt) * 10) / 10 : null,
    })
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link to="/free-resources" className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition">← Back to Free Resources</Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">Insulin Calculator</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Insulin <span className="text-da-gold">Dose</span> Calculator
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">Calculate your meal dose + correction dose using your personal I:C ratio, ISF, and current BG.</p>
        </div>

        <div className="bg-da-gold/10 border border-da-gold/30 rounded-xl p-5 mb-10 max-w-4xl mx-auto">
          <p className="text-da-gold text-sm font-bold mb-1">Educational Tool — Not Medical Advice</p>
          <p className="text-white/60 text-xs leading-relaxed">This calculator helps you understand how insulin dosing math works. ALWAYS verify with your endocrinologist or CDE before adjusting doses. Your real-world dose may differ based on illness, stress, exercise, hormones, and food composition.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <form onSubmit={calculate} className="bg-da-card rounded-2xl p-8 md:p-10 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Inputs</h2>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">BG Units</label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button type="button" onClick={() => { setUnits('mgdl'); setTargetBG(100) }} className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'mgdl' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>mg/dL</button>
                <button type="button" onClick={() => { setUnits('mmoll'); setTargetBG(5.5) }} className={`py-2 rounded text-sm font-bold uppercase transition ${units === 'mmoll' ? 'bg-da-cyan text-da-dark' : 'text-white/60'}`}>mmol/L</button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-da-cyan mb-4">Meal Dose</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Carbs in Meal (g)</label>
                  <input type="number" min="0" step="1" value={carbs} onChange={(e) => setCarbs(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder="60" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">I:C Ratio (1 unit per X g carbs)</label>
                  <input type="number" min="1" step="0.5" value={icRatio} onChange={(e) => setIcRatio(e.target.value)} required className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder="10" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-da-cyan mb-4">Correction Dose <span className="text-white/40 normal-case font-normal">(optional)</span></h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Current BG ({units === 'mgdl' ? 'mg/dL' : 'mmol/L'})</label>
                  <input type="number" min="0" step="0.1" value={currentBG} onChange={(e) => setCurrentBG(e.target.value)} className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder={units === 'mgdl' ? '180' : '10'} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Target BG ({units === 'mgdl' ? 'mg/dL' : 'mmol/L'})</label>
                  <input type="number" min="0" step="0.1" value={targetBG} onChange={(e) => setTargetBG(e.target.value)} className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">ISF — Drop per 1 unit ({units === 'mgdl' ? 'mg/dL' : 'mmol/L'})</label>
                  <input type="number" min="1" step="0.1" value={isf} onChange={(e) => setIsf(e.target.value)} className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder={units === 'mgdl' ? '50' : '2.8'} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Insulin On Board (units, optional)</label>
                  <input type="number" min="0" step="0.1" value={iob} onChange={(e) => setIob(e.target.value)} className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan" placeholder="0" />
                </div>
              </div>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full">Calculate Dose →</Button>
          </form>

          <div className="lg:sticky lg:top-24 self-start">
            {results ? (
              <div className="bg-da-card-accent rounded-2xl p-8 md:p-10 space-y-6">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">Recommended Dose</h2>

                <div className="bg-da-darker rounded-lg p-6 border border-da-gold/40 text-center">
                  <div className="text-da-gold text-xs uppercase tracking-wider font-bold mb-2">Total Dose</div>
                  <div className="text-6xl font-black text-white mb-1">{results.finalDose}<span className="text-2xl text-white/60"> u</span></div>
                  <div className="text-white/50 text-sm">units of rapid-acting insulin</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-da-darker/50 rounded-lg border border-white/5">
                    <div>
                      <div className="text-white text-sm font-bold">Meal Dose</div>
                      <div className="text-white/40 text-xs">{carbs}g ÷ {icRatio} g/u</div>
                    </div>
                    <div className="text-2xl font-black text-da-cyan">{results.mealDose}u</div>
                  </div>

                  {results.correctionDose !== 0 && (
                    <div className="flex justify-between items-center p-3 bg-da-darker/50 rounded-lg border border-white/5">
                      <div>
                        <div className="text-white text-sm font-bold">Correction Dose</div>
                        <div className="text-white/40 text-xs">BG delta {results.bgDelta} ÷ ISF {isf}</div>
                      </div>
                      <div className={`text-2xl font-black ${results.correctionDose > 0 ? 'text-da-cyan' : 'text-red-400'}`}>{results.correctionDose > 0 ? '+' : ''}{results.correctionDose}u</div>
                    </div>
                  )}

                  {results.iob > 0 && (
                    <div className="flex justify-between items-center p-3 bg-da-darker/50 rounded-lg border border-white/5">
                      <div>
                        <div className="text-white text-sm font-bold">Subtract IOB</div>
                        <div className="text-white/40 text-xs">Active insulin from prior dose</div>
                      </div>
                      <div className="text-2xl font-black text-red-400">−{results.iob}u</div>
                    </div>
                  )}
                </div>

                <p className="text-white/40 text-xs leading-relaxed pt-4 border-t border-white/10">
                  Pre-bolus by 10–20 minutes for high-carb meals to flatten the post-meal spike. Higher protein/fat meals may need extended/dual wave dosing. Always verify with your CDE.
                </p>
              </div>
            ) : (
              <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-3">Awaiting Inputs</div>
                <p className="text-white/60">Enter your meal carbs and I:C ratio. Add BG inputs to include a correction dose.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
