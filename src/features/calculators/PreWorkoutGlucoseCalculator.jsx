import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { predictEndGlucose } from './pre-workout-glucose/prediction'
import { bandFor } from './pre-workout-glucose/riskBands'
import { gramsNeeded } from './pre-workout-glucose/carbRecommendation'
import { computeIob } from './pre-workout-glucose/iobDecay'
import { mmolToMgdl, mgdlToMmol, formatGlucose } from './pre-workout-glucose/units'

const WORKOUT_TYPES = [
  { id: 'aerobic',   label: 'Aerobic',   detail: 'Running, cycling, swimming' },
  { id: 'anaerobic', label: 'Anaerobic', detail: 'Sprints, HIIT' },
  { id: 'mixed',     label: 'Mixed',     detail: 'CrossFit, team sports' },
  { id: 'strength',  label: 'Strength',  detail: 'Weights, calisthenics' },
]

const TRENDS = [
  { id: 'doubleUp',   label: '↑↑' },
  { id: 'up',         label: '↑' },
  { id: 'flat',       label: '→' },
  { id: 'down',       label: '↓' },
  { id: 'doubleDown', label: '↓↓' },
]

const TIME_OF_DAY = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday',  label: 'Midday' },
  { id: 'evening', label: 'Evening' },
]

export default function PreWorkoutGlucoseCalculator() {
  // Glucose
  const [glucoseUnit, setGlucoseUnit] = useState('mmol')
  const [startGlucose, setStartGlucose] = useState('')

  // Trend
  const [trendArrow, setTrendArrow] = useState('flat')

  // Workout
  const [workoutType, setWorkoutType] = useState('aerobic')
  const [intensity, setIntensity] = useState(5)
  const [duration, setDuration] = useState('')

  // IOB
  const [iobUnits, setIobUnits] = useState('')
  const [iobHelperOpen, setIobHelperOpen] = useState(false)
  const [lastBolus, setLastBolus] = useState('')
  const [minutesSinceBolus, setMinutesSinceBolus] = useState('')
  const [insulinType, setInsulinType] = useState('rapid')

  // Recent carbs (optional)
  const [hasRecentCarbs, setHasRecentCarbs] = useState(false)
  const [recentGrams, setRecentGrams] = useState('')
  const [recentMinutesAgo, setRecentMinutesAgo] = useState('')

  // Body weight
  const [weightUnit, setWeightUnit] = useState('kg')
  const [weight, setWeight] = useState('')

  // Time of day (default: derive from clock once)
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const h = new Date().getHours()
    if (h < 11) return 'morning'
    if (h < 17) return 'midday'
    return 'evening'
  })

  // IOB helper auto-fill
  const helperIob = useMemo(() => {
    const b = parseFloat(lastBolus)
    const m = parseFloat(minutesSinceBolus)
    if (!b || isNaN(m)) return null
    return computeIob(b, m, insulinType)
  }, [lastBolus, minutesSinceBolus, insulinType])

  // Apply helper IOB if computed
  const effectiveIob = iobUnits === '' && helperIob != null ? helperIob.toFixed(2) : iobUnits

  // Build the prediction input (in mmol/L internally)
  const prediction = useMemo(() => {
    const sg = parseFloat(startGlucose)
    const dur = parseFloat(duration)
    const wt = parseFloat(weight)
    const iob = parseFloat(effectiveIob) || 0
    if (!sg || !dur || !wt) return null
    const startMmol = glucoseUnit === 'mmol' ? sg : mgdlToMmol(sg)
    const bodyweightKg = weightUnit === 'kg' ? wt : wt * 0.453592
    return predictEndGlucose({
      startMmol,
      trendArrow,
      workoutType,
      intensity,
      durationMin: dur,
      iobUnits: iob,
      recentCarbs: hasRecentCarbs
        ? { grams: parseFloat(recentGrams) || 0, minutesAgo: parseFloat(recentMinutesAgo) || 0 }
        : { grams: 0, minutesAgo: 0 },
      bodyweightKg,
      timeOfDay,
    })
  }, [startGlucose, glucoseUnit, trendArrow, workoutType, intensity, duration, effectiveIob, hasRecentCarbs, recentGrams, recentMinutesAgo, weight, weightUnit, timeOfDay])

  const reset = () => {
    setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
    setIntensity(5); setDuration(''); setIobUnits('')
    setIobHelperOpen(false); setLastBolus(''); setMinutesSinceBolus('')
    setHasRecentCarbs(false); setRecentGrams(''); setRecentMinutesAgo('')
    setWeight('')
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      {/* Page header */}
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <Link to="/free-resources" className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4 inline-block">
            ← Back to Free Resources
          </Link>
          <p className="text-da-gold uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">⚡ Pre-Workout Calculator</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Pre-Workout <span className="text-da-cyan">Glucose</span> Predictor
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Predict your end-glucose and risk-of-low before you train. Inputs in 60 seconds, literature-grounded prediction.
          </p>
        </div>
      </section>

      {/* Form + results */}
      <section className="da-container section-padding">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* INPUT CARD */}
          <div className="bg-da-card rounded-2xl p-6 md:p-8 space-y-6">

            {/* Glucose */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Starting Glucose</label>
              <div className="flex gap-2">
                <input
                  type="number" inputMode="decimal" value={startGlucose}
                  onChange={(e) => setStartGlucose(e.target.value)}
                  placeholder={glucoseUnit === 'mmol' ? 'e.g. 6.5' : 'e.g. 120'}
                  className="flex-1 bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30"
                />
                <div className="flex bg-da-dark border border-white/10 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setGlucoseUnit('mmol')} className={`px-4 ${glucoseUnit === 'mmol' ? 'bg-da-cyan text-da-dark font-bold' : 'text-white/60'}`}>mmol/L</button>
                  <button type="button" onClick={() => setGlucoseUnit('mgdl')} className={`px-4 ${glucoseUnit === 'mgdl' ? 'bg-da-cyan text-da-dark font-bold' : 'text-white/60'}`}>mg/dL</button>
                </div>
              </div>
            </div>

            {/* Trend arrow */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">CGM Trend Arrow</label>
              <div className="grid grid-cols-5 gap-2">
                {TRENDS.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTrendArrow(t.id)}
                    className={`py-3 rounded-lg text-2xl ${trendArrow === t.id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workout type */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Workout Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WORKOUT_TYPES.map((w) => (
                  <button key={w.id} type="button" onClick={() => setWorkoutType(w.id)}
                    className={`p-3 rounded-lg text-left ${workoutType === w.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                    <div className={`font-bold ${workoutType === w.id ? 'text-da-cyan' : 'text-white'}`}>{w.label}</div>
                    <div className="text-xs text-white/40">{w.detail}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Intensity (RPE 1–10) — {intensity}</label>
              <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-da-cyan" />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>Easy</span><span>Moderate</span><span>Hard</span><span>Very Hard</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Planned Duration (minutes)</label>
              <input type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
            </div>

            {/* IOB */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Active Insulin (IOB, units)</label>
              <input type="number" inputMode="decimal" step="0.1" value={iobUnits}
                onChange={(e) => setIobUnits(e.target.value)}
                placeholder={helperIob != null ? `Auto: ${helperIob.toFixed(2)}u` : 'e.g. 1.5'}
                className="w-full bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
              <button type="button" onClick={() => setIobHelperOpen(!iobHelperOpen)}
                className="text-da-cyan text-xs uppercase tracking-wider mt-2 font-bold">
                {iobHelperOpen ? '− Hide helper' : '+ Help me calculate it'}
              </button>
              {iobHelperOpen && (
                <div className="mt-3 p-4 bg-da-dark rounded-lg space-y-3">
                  <p className="text-xs text-white/50">Pump users: read IOB off your pump. This is for MDI users.</p>
                  <input type="number" inputMode="decimal" step="0.5" value={lastBolus} onChange={(e) => setLastBolus(e.target.value)} placeholder="Last bolus units" className="w-full bg-da-darker border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 text-sm" />
                  <input type="number" inputMode="numeric" value={minutesSinceBolus} onChange={(e) => setMinutesSinceBolus(e.target.value)} placeholder="Minutes since bolus" className="w-full bg-da-darker border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 text-sm" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setInsulinType('rapid')} className={`flex-1 py-2 rounded text-sm ${insulinType === 'rapid' ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-darker border border-white/10 text-white/60'}`}>Rapid-acting</button>
                    <button type="button" onClick={() => setInsulinType('ultra')} className={`flex-1 py-2 rounded text-sm ${insulinType === 'ultra' ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-darker border border-white/10 text-white/60'}`}>Ultra-rapid</button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent carbs (optional) */}
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={hasRecentCarbs} onChange={(e) => setHasRecentCarbs(e.target.checked)} className="mr-2 accent-da-cyan" />
                <span className="text-da-cyan uppercase tracking-wider text-xs font-bold">Have you eaten any carbs recently?</span>
              </label>
              {hasRecentCarbs && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <input type="number" inputMode="numeric" value={recentGrams} onChange={(e) => setRecentGrams(e.target.value)} placeholder="Grams" className="bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
                  <input type="number" inputMode="numeric" value={recentMinutesAgo} onChange={(e) => setRecentMinutesAgo(e.target.value)} placeholder="Minutes ago" className="bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
                </div>
              )}
            </div>

            {/* Body weight */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Body Weight</label>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder={weightUnit === 'kg' ? 'e.g. 75' : 'e.g. 165'}
                  className="flex-1 bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
                <div className="flex bg-da-dark border border-white/10 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setWeightUnit('kg')} className={`px-4 ${weightUnit === 'kg' ? 'bg-da-cyan text-da-dark font-bold' : 'text-white/60'}`}>kg</button>
                  <button type="button" onClick={() => setWeightUnit('lb')} className={`px-4 ${weightUnit === 'lb' ? 'bg-da-cyan text-da-dark font-bold' : 'text-white/60'}`}>lb</button>
                </div>
              </div>
            </div>

            {/* Time of day */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Time of Day</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OF_DAY.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTimeOfDay(t.id)}
                    className={`py-3 rounded-lg ${timeOfDay === t.id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {prediction && <PredictionResults prediction={prediction} bodyweightKg={parseFloat(weight) * (weightUnit === 'kg' ? 1 : 0.453592)} glucoseUnit={glucoseUnit} workoutType={workoutType} />}

          <div className="text-center pt-4">
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>

          <Disclaimer />
        </div>
      </section>
    </div>
  )
}

function PredictionResults({ prediction, bodyweightKg, glucoseUnit, workoutType }) {
  const band = bandFor(prediction.endMmol)
  const carbs = gramsNeeded(prediction.endMmol, bodyweightKg || 70)

  const display = (mmol) => glucoseUnit === 'mmol'
    ? `${formatGlucose(mmol, 'mmol')} mmol/L`
    : `${formatGlucose(mmolToMgdl(mmol), 'mgdl')} mg/dL`

  // Tip text by workout type
  const tips = {
    aerobic:   'Aerobic exercise typically lowers glucose steadily. Recheck at 30min. Carry 15g fast carbs.',
    anaerobic: 'High-intensity work can raise glucose during, then drop afterward. Watch the cool-down window.',
    mixed:     'Mixed workouts have variable responses — recheck at 20 and 40min.',
    strength:  'Strength training has lower hypo-risk during, but post-workout drops are common 1–4hr later.',
  }

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-2" style={{ borderColor: band.color }}>
        <p className="text-white/50 uppercase tracking-wider text-xs font-bold mb-2">Predicted End-Glucose</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-5xl md:text-6xl font-black text-white">{display(prediction.endMmol)}</span>
          <span className="text-lg text-white/40">({glucoseUnit === 'mmol' ? `${mmolToMgdl(prediction.endMmol)} mg/dL` : `${formatGlucose(prediction.endMmol, 'mmol')} mmol/L`})</span>
        </div>
        <div className="mt-4 inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: band.color + '22', color: band.color, border: `1px solid ${band.color}66` }}>
          {band.label}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Recommendation</p>
        <p className="text-white text-lg">
          {carbs > 0
            ? `Consume ${carbs}g of fast-acting carbs (glucose tabs, juice, dextrose) now and recheck in 15 minutes before starting.`
            : band.action
          }
        </p>
      </div>

      {/* Why this prediction */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Why this prediction</p>
        <ul className="space-y-2">
          {prediction.breakdown.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className={`font-bold ${item.delta < 0 ? 'text-red-400' : item.delta > 0 ? 'text-da-gold' : 'text-white/60'}`}>
                {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)} mmol/L
              </span>
              <span className="text-white/70 flex-1">{item.label} — <span className="text-white/40">{item.reasoning}</span></span>
            </li>
          ))}
        </ul>
      </div>

      {/* During-workout tips */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">During-Workout Tips</p>
        <p className="text-white/70">{tips[workoutType] || tips.aerobic}</p>
      </div>

      {/* Post-workout brief */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">Post-Workout Brief</p>
        <p className="text-white/70">
          You may experience a <strong>delayed glucose drop 4–6 hours post-workout</strong> due to ongoing glycogen replenishment. Recheck at 1hr and 4hr after finishing. Your post-workout insulin needs may be reduced by 50–75%. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to recalibrate your bolus around training.
        </p>
      </div>
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Pre-Workout Glucose Predictor uses literature-based modeling to estimate likely glucose response to exercise in people with type 1 diabetes. Individual responses vary substantially. Always check your glucose before, during, and after exercise. Always carry fast-acting carbs. Never adjust insulin doses based solely on this tool. Consult your endocrinologist before making changes to your exercise or insulin routine.</p>
    </div>
  )
}
