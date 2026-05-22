import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { predictEndGlucose } from './pre-workout-glucose/prediction'
import { buildFuelPlan } from './pre-workout-glucose/fuelPlan'
import { computeIob } from './pre-workout-glucose/iobDecay'
import { mgdlToMmol } from './pre-workout-glucose/units'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
import FuelPlanResults from './pre-workout-glucose/FuelPlanResults'

export default function PreWorkoutGlucoseCalculator() {
  return (
    <OptInGate slug="pre-workout-glucose" {...OPT_IN_CONTENT['pre-workout-glucose']}>
      <PreWorkoutGlucoseCalculatorActual />
    </OptInGate>
  )
}

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

// Heart Rate zones using Karvonen (% HRR). Used when workoutType === 'aerobic'
// — replaces the RPE slider. Each zone maps to one of the 4 intensity bands
// the existing prediction math uses (no math changes required).
const HR_ZONES = [
  { id: 'Z1', label: 'Recovery',        rangeHrr: '68-73%',  band: 'easy'     },
  { id: 'Z2', label: 'Steady',          rangeHrr: '73-80%',  band: 'moderate' },
  { id: 'Z3', label: 'Moderate Effort', rangeHrr: '80-87%',  band: 'moderate' },
  { id: 'Z4', label: 'Threshold',       rangeHrr: '87-93%',  band: 'hard'     },
  { id: 'Z5', label: 'Very Hard',       rangeHrr: '93-100%', band: 'veryHard' },
]

// Maps an intensity band back to an RPE midpoint that the existing
// intensityBand() function in prediction.js will classify into that same band.
// (intensityBand uses thresholds: ≤3 easy, ≤6 moderate, ≤8 hard, else veryHard.)
const INTENSITY_RPE_FROM_BAND = {
  easy:     2,  // ≤3 → 'easy'
  moderate: 5,  // ≤6 → 'moderate'
  hard:     7,  // ≤8 → 'hard'
  veryHard: 9,  // else → 'veryHard'
}

// Personalization inputs (added 2026-05-13) — see spec
// docs/superpowers/specs/2026-05-13-workout-fueling-calc-personalization-design.md

const CYCLE_PHASES = [
  { id: 'follicular', label: 'Follicular Phase', detail: 'Early cycle, post-period' },
  { id: 'midCycle',   label: 'Mid-cycle',        detail: '~Ovulation' },
  { id: 'luteal',     label: 'Luteal Phase',     detail: 'Late cycle, pre-period' },
  { id: 'unknown',    label: "Don't know / N/A", detail: 'Default — works for most' },
]

const TRAINING_STATUSES = [
  { id: 'untrained',     label: 'Untrained',      detail: 'Little or no regular exercise' },
  { id: 'recreational',  label: 'Recreational',   detail: '2–3 days/week, casual' },
  { id: 'trained',       label: 'Trained',        detail: '4–5 days/week, structured plan' },
  { id: 'highlyTrained', label: 'Highly Trained', detail: '6–7 days/week, competitive' },
]

const INSULIN_ADJUSTMENTS = [
  { id: 'none',        label: 'None',        detail: 'Normal basal & bolus' },
  { id: 'modest',      label: 'Modest',      detail: '25–50% reduction' },
  { id: 'significant', label: 'Significant', detail: '50–80% reduction' },
]

function StepCard({ stepNumber, title, children }) {
  return (
    <div className="bg-da-card rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-da-cyan/20 border border-da-cyan flex items-center justify-center text-da-cyan font-black text-sm flex-shrink-0">
          {stepNumber}
        </div>
        <h3 className="text-white font-bold text-lg uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function PreWorkoutGlucoseCalculatorActual() {
  // Mode toggle — Beginner (default) shows the 5 essentials only; Advanced
  // reveals HR zone, insulin type, adjustment, trend, sex, training status,
  // fasted/fed, time of day, recent carbs.
  const [mode, setMode] = useState('beginner')

  // Glucose
  const [glucoseUnit, setGlucoseUnit] = useState('mmol')
  const [startGlucose, setStartGlucose] = useState('')

  // Trend
  const [trendArrow, setTrendArrow] = useState('flat')

  // Workout
  const [workoutType, setWorkoutType] = useState('aerobic')
  const [intensity, setIntensity] = useState(5)
  const [hrZone, setHrZone] = useState('Z3')  // Default: Zone 3 (Moderate Effort)
  const [duration, setDuration] = useState('')

  // Personalization (added 2026-05-13)
  const [sex,               setSex]               = useState('male')
  const [cyclePhase,        setCyclePhase]        = useState('unknown')
  const [cycleExpanded,     setCycleExpanded]     = useState(false)
  const [trainingStatus,    setTrainingStatus]    = useState('recreational')
  const [fastedFed,         setFastedFed]         = useState('fed')
  const [insulinAdjustment, setInsulinAdjustment] = useState('none')

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

    // For aerobic workouts, derive intensity from the selected HR Zone.
    // For all other workout types, use the RPE slider value directly.
    const effectiveIntensity = workoutType === 'aerobic'
      ? INTENSITY_RPE_FROM_BAND[HR_ZONES.find((z) => z.id === hrZone).band]
      : intensity

    const startMmol = glucoseUnit === 'mmol' ? sg : mgdlToMmol(sg)
    const bodyweightKg = weightUnit === 'kg' ? wt : wt * 0.453592
    return predictEndGlucose({
      startMmol,
      trendArrow,
      workoutType,
      intensity: effectiveIntensity,
      durationMin: dur,
      iobUnits: iob,
      recentCarbs: hasRecentCarbs
        ? { grams: parseFloat(recentGrams) || 0, minutesAgo: parseFloat(recentMinutesAgo) || 0 }
        : { grams: 0, minutesAgo: 0 },
      bodyweightKg,
      timeOfDay,
      // NEW personalization inputs
      sex,
      cyclePhase,
      trainingStatus,
      fastedFed,
      insulinAdjustment,
    })
  }, [startGlucose, glucoseUnit, trendArrow, workoutType, intensity, hrZone, duration, effectiveIob, hasRecentCarbs, recentGrams, recentMinutesAgo, weight, weightUnit, timeOfDay, sex, cyclePhase, trainingStatus, fastedFed, insulinAdjustment])

  // Build the fuel plan from the prediction + raw input state
  const fuelPlan = useMemo(() => {
    if (!prediction) return null
    const startMmol = glucoseUnit === 'mmol'
      ? parseFloat(startGlucose) || 0
      : mgdlToMmol(parseFloat(startGlucose) || 0)
    const durationMin = parseFloat(duration) || 0
    const wtKg = weightUnit === 'kg' ? parseFloat(weight) || 70 : (parseFloat(weight) || 154) * 0.453592
    const iob = parseFloat(effectiveIob) || 0
    return buildFuelPlan({
      startGlucoseMmol: startMmol,
      predictedEndMmol: prediction.endMmol,
      activityType: workoutType,
      durationMinutes: durationMin,
      bodyweightKg: wtKg,
      iobUnits: iob,
    })
  }, [prediction, startGlucose, glucoseUnit, workoutType, duration, weight, weightUnit, effectiveIob])

  const reset = () => {
    setMode('beginner')
    setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
    setIntensity(5); setHrZone('Z3'); setDuration(''); setIobUnits('')
    setIobHelperOpen(false); setLastBolus(''); setMinutesSinceBolus(''); setInsulinType('rapid')
    setHasRecentCarbs(false); setRecentGrams(''); setRecentMinutesAgo('')
    setWeight('')
    // Personalization defaults
    setSex('male'); setCyclePhase('unknown'); setCycleExpanded(false)
    setTrainingStatus('recreational'); setFastedFed('fed'); setInsulinAdjustment('none')
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
          <p className="text-da-gold uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">⚡ Workout Fueling Calculator</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Workout <span className="text-da-cyan">Fueling</span> Calculator
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Know how much glucose you need to fuel your workout and avoid intra-workout lows. Plug in your numbers, get a literature-grounded fueling plan plus your predicted end-glucose.
          </p>
        </div>
      </section>

      {/* Form + results */}
      <section className="da-container section-padding">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Mode toggle — Beginner / Advanced */}
          <div className="mb-6">
            <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['beginner', 'Beginner', 'Recommended'],
                ['advanced', 'Advanced', 'I want more accuracy'],
              ].map(([id, lbl, detail]) => (
                <button key={id} type="button" onClick={() => setMode(id)}
                  className={`p-3 rounded-lg text-left ${mode === id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                  <div className={`font-bold ${mode === id ? 'text-da-cyan' : 'text-white'}`}>{lbl}</div>
                  <div className="text-xs text-white/40">{detail}</div>
                </button>
              ))}
            </div>
          </div>

          {/* StepCard 1 — Starting Glucose */}
          <StepCard stepNumber={1} title="Starting Glucose">
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
          </StepCard>

          {/* StepCard 2 — Workout */}
          <StepCard stepNumber={2} title="Workout">
            {/* Activity type */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Activity Type</label>
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

            {/* Duration */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Planned Duration (minutes)</label>
              <input type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-da-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30" />
            </div>
          </StepCard>

          {/* StepCard 3 — Body Weight */}
          <StepCard stepNumber={3} title="Body Weight">
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
          </StepCard>

          {/* StepCard 4 — Active Insulin (IOB) */}
          <StepCard stepNumber={4} title="Active Insulin (IOB)">
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
          </StepCard>

          {/* Advanced refinements — only when mode === 'advanced' */}
          {mode === 'advanced' && (
            <StepCard stepNumber="A" title="Advanced refinements (optional)">
              <p className="text-white/60 text-sm mb-4">
                The more we know about you, the more accurate your fuel plan. All fields below are optional — fill in what you know.
              </p>

              {/* 1. HR Zone (conditional on workoutType === 'aerobic') */}
              {workoutType === 'aerobic' ? (
                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">
                    Training Zone — {HR_ZONES.find((z) => z.id === hrZone).label} ({HR_ZONES.find((z) => z.id === hrZone).rangeHrr} HRR)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {HR_ZONES.map((z) => (
                      <button key={z.id} type="button" onClick={() => setHrZone(z.id)}
                        className={`p-2 rounded-lg text-center ${hrZone === z.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                        <div className={`font-bold text-sm ${hrZone === z.id ? 'text-da-cyan' : 'text-white'}`}>{z.id}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{z.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 italic mt-2">
                    Don't know your zones?{' '}
                    <a href="/calculators/cardio" target="_blank" rel="noopener noreferrer" className="text-da-cyan underline">
                      Calculate them here ↗
                    </a>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Intensity (RPE 1–10) — {intensity}</label>
                  <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full accent-da-cyan" />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Easy</span><span>Moderate</span><span>Hard</span><span>Very Hard</span>
                  </div>
                </div>
              )}

              {/* 2. Pre-workout insulin adjustment */}
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Pre-Workout Insulin Adjustment</label>
                <div className="grid grid-cols-3 gap-2">
                  {INSULIN_ADJUSTMENTS.map((a) => (
                    <button key={a.id} type="button" onClick={() => setInsulinAdjustment(a.id)}
                      className={`p-3 rounded-lg text-left ${insulinAdjustment === a.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                      <div className={`font-bold text-sm ${insulinAdjustment === a.id ? 'text-da-cyan' : 'text-white'}`}>{a.label}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{a.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Trend arrow */}
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

              {/* 4. Sex + cycle expander */}
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['male', 'Male'], ['female', 'Female']].map(([id, lbl]) => (
                    <button key={id} type="button" onClick={() => setSex(id)}
                      className={`py-3 rounded-lg ${sex === id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Cycle phase expander — only when Female */}
                {sex === 'female' && (
                  <>
                    <button type="button" onClick={() => setCycleExpanded(!cycleExpanded)}
                      className="text-da-cyan text-xs uppercase tracking-wider mt-2 font-bold">
                      {cycleExpanded ? '− Hide menstrual cycle refinement' : '+ Refine for menstrual cycle phase (optional)'}
                    </button>
                    {cycleExpanded && (
                      <div className="mt-3 p-4 bg-da-dark rounded-lg">
                        <p className="text-xs text-white/50 mb-3">
                          Cycle phase affects insulin sensitivity. Adjusts the fuel calculation by ~5–15%. If you're not menstruating, on hormonal contraception, or don't track your cycle, leave this as "Don't know / N/A" — the default works for most users.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CYCLE_PHASES.map((p) => (
                            <button key={p.id} type="button" onClick={() => setCyclePhase(p.id)}
                              className={`p-3 rounded-lg text-left ${cyclePhase === p.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-darker border border-white/10'}`}>
                              <div className={`font-bold text-sm ${cyclePhase === p.id ? 'text-da-cyan' : 'text-white'}`}>{p.label}</div>
                              <div className="text-[10px] text-white/40 mt-0.5">{p.detail}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 5. Training status */}
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Training Status</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TRAINING_STATUSES.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTrainingStatus(t.id)}
                      className={`p-3 rounded-lg text-left ${trainingStatus === t.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                      <div className={`font-bold ${trainingStatus === t.id ? 'text-da-cyan' : 'text-white'}`}>{t.label}</div>
                      <div className="text-xs text-white/40">{t.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Fasted vs Fed */}
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Meal State</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['fed',    'Fed',            'Eaten within the last 4 hours'],
                    ['fasted', 'Fasted (4+ hr)', 'No food for 4+ hours'],
                  ].map(([id, lbl, detail]) => (
                    <button key={id} type="button" onClick={() => setFastedFed(id)}
                      className={`p-3 rounded-lg text-left ${fastedFed === id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                      <div className={`font-bold ${fastedFed === id ? 'text-da-cyan' : 'text-white'}`}>{lbl}</div>
                      <div className="text-xs text-white/40">{detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Time of day */}
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

              {/* 8. Recent carbs expander */}
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

            </StepCard>
          )}

          {prediction && fuelPlan ? (
            <FuelPlanResults
              fuelPlan={fuelPlan}
              prediction={prediction}
              glucoseUnit={glucoseUnit}
              activityType={workoutType}
            />
          ) : (
            <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan/40 text-center">
              <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">👇 Almost there</p>
              <p className="text-white/70 text-base leading-relaxed">
                Fill in your <strong className="text-white">starting glucose</strong>, <strong className="text-white">activity type and duration</strong>, and <strong className="text-white">body weight</strong> above — your personalized fuel plan will appear here.
              </p>
            </div>
          )}

          <div className="text-center pt-4">
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>

          <Disclaimer />
        </div>
      </section>
    </div>
  )
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Workout Fueling Calculator uses literature-based modeling to estimate likely glucose response to exercise in people with type 1 diabetes. Individual responses vary substantially. Always check your glucose before, during, and after exercise. Always carry fast-acting carbs. Never adjust insulin doses based solely on this tool. Consult your endocrinologist before making changes to your exercise or insulin routine.</p>
    </div>
  )
}
