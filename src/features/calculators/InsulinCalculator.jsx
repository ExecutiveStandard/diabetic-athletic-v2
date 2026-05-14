import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'

// =============================================================================
// THE DIABETIC ATHLETIC MAGIC RATIO CALCULATOR
// Faithful port of the original GoHighLevel `calculate()` math:
//   - TDD (auto): weight × 0.55 (kg) or weight ÷ 4 (lbs)
//   - ISF: (1800 | 100) ÷ TDD for rapid-acting, (1500 | 83) ÷ TDD for regular
//   - ICRs: morning = 500 / (TDD × 0.8), afternoon = 500 / (TDD × 1.2),
//           evening = 500 / TDD
//   - Carb dose = carbs / ICR(time-of-day)
//   - Correction = (currentBG − targetBG) / ISF, clamped at 0
//   - Total meal dose = carb dose + correction
// Targets: mg/dL → 100, mmol/L → 6
// =============================================================================

const ISF_NUMERATORS = {
  rapid:   { 'mg/dL': 1800, 'mmol/L': 100 },
  regular: { 'mg/dL': 1500, 'mmol/L': 83  },
}

const TARGET_BG = { 'mg/dL': 100, 'mmol/L': 6 }

const TIME_OF_DAY = [
  { id: 'morning',   label: 'Morning',   factor: 0.8 },
  { id: 'afternoon', label: 'Afternoon', factor: 1.2 },
  { id: 'evening',   label: 'Evening',   factor: 1.0 },
]

// ───────────── PERSONALIZATION MULTIPLIERS ─────────────
// Coefficients drawn from Riddell 2017, Yardley 2018, ADA exercise
// guidelines, and Brown et al. (menstrual cycle). Conservative midpoints
// within published ranges; subject to feedback-based refinement.

const TRAINING_TDD_MULT = {
  untrained:     1.10,  // higher insulin resistance, slightly more daily insulin
  recreational:  1.00,  // baseline matches weight × 0.55 estimate
  trained:       0.90,  // ~10% reduction from training adaptations
  highlyTrained: 0.80,  // ~20% reduction at elite levels
}

const SEX_TDD_MULT = {
  male:   1.00,
  female: 0.95,  // women ~5% more insulin sensitive at baseline (cycle adds further variation)
}

const CYCLE_TDD_MULT = {
  follicular: 0.90,  // most sensitive (low estrogen + progesterone)
  midCycle:   0.95,  // intermediate
  luteal:     1.05,  // least sensitive (high progesterone) — near male baseline
  unknown:    0.95,  // safe midpoint default
}

const TRAINING_STATUSES = [
  { id: 'untrained',     label: 'Untrained',      detail: 'Little or no regular exercise' },
  { id: 'recreational',  label: 'Recreational',   detail: '2–3 days/week, casual' },
  { id: 'trained',       label: 'Trained',        detail: '4–5 days/week, structured plan' },
  { id: 'highlyTrained', label: 'Highly Trained', detail: '6–7 days/week, competitive' },
]

const CYCLE_PHASES = [
  { id: 'follicular', label: 'Follicular Phase', detail: 'Early cycle, post-period' },
  { id: 'midCycle',   label: 'Mid-cycle',        detail: '~Ovulation' },
  { id: 'luteal',     label: 'Luteal Phase',     detail: 'Late cycle, pre-period' },
  { id: 'unknown',    label: "Don't know / N/A", detail: 'Default — works for most' },
]

// =============================================================================
// MATH HELPERS
// =============================================================================
function calcTDD({
  weight,
  weightUnits,
  // NEW personalization inputs — all optional. When omitted, the function
  // returns the same weight-based estimate as before (backward compatibility).
  actualTdd,
  bodyFatPercent,
  trainingStatus,
  sex,
  cyclePhase,
}) {
  if (!weight || weight <= 0) return 0

  // Step 1 — determine base TDD
  // Out-of-range Actual TDD or Body Fat % values are silently ignored
  // (the field's HTML min/max only blocks the spin buttons, not paste).
  let tdd
  if (actualTdd && actualTdd >= 5 && actualTdd <= 200) {
    tdd = actualTdd
  } else if (bodyFatPercent && bodyFatPercent >= 5 && bodyFatPercent <= 60) {
    const lbm = weight * (1 - bodyFatPercent / 100)
    tdd = weightUnits === 'kg' ? lbm * 0.7 : (lbm / 2.2) * 0.7
  } else {
    tdd = weightUnits === 'kg' ? weight * 0.55 : weight / 4
  }

  // Step 2 — apply training status multiplier
  tdd *= TRAINING_TDD_MULT[trainingStatus] ?? 1.00

  // Step 3 — apply sex × cycle multiplier
  const sexMult   = SEX_TDD_MULT[sex] ?? 1.00
  const cycleMult = sex === 'female' ? (CYCLE_TDD_MULT[cyclePhase] ?? 0.95) : 1.00
  tdd *= sexMult * cycleMult

  return tdd
}

function calcISF({ tdd, insulinType, bgUnit }) {
  if (!tdd) return 0
  return ISF_NUMERATORS[insulinType][bgUnit] / tdd
}

function calcICR({ tdd, time }) {
  if (!tdd) return 0
  const t = TIME_OF_DAY.find((x) => x.id === time)
  return 500 / (tdd * (t?.factor ?? 1))
}

function calcCarbDose({ carbGrams, icr }) {
  if (!carbGrams || !icr) return 0
  return carbGrams / icr
}

function calcCorrectionDose({ currentBG, targetBG, isf }) {
  if (!currentBG || !isf) return 0
  const diff = currentBG - targetBG
  return diff > 0 ? diff / isf : 0
}

// =============================================================================
// REUSABLE STEP CARD (collapsible)
// =============================================================================
function StepCard({ stepNumber, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`bg-da-card rounded-2xl overflow-hidden transition-all ${open ? 'border-da-cyan/40' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-6 md:px-8 py-5 flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <span className="bg-da-gradient text-da-dark font-black uppercase tracking-wider text-xs px-3 py-1.5 rounded-full">
            Step {stepNumber}
          </span>
          <span className="text-white font-bold uppercase tracking-wider text-sm md:text-base text-left group-hover:text-da-cyan transition">
            {title}
          </span>
        </div>
        <span className={`text-da-gold text-2xl font-black transition-transform flex-shrink-0 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 md:px-8 pb-8 pt-2 border-t border-white/5 space-y-5">
          {children}
        </div>
      )}
    </div>
  )
}

function ResultBox({ label, value, suffix = '', accent = 'cyan', subtitle }) {
  const accentClasses = {
    cyan: 'border-da-cyan/40',
    gold: 'border-da-gold/40 bg-gradient-to-br from-da-cyan/10 to-da-gold/10',
  }
  return (
    <div className={`bg-da-darker rounded-lg p-5 text-center border ${accentClasses[accent]}`}>
      <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-2">
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-black text-white">
        {value}
        {suffix && <span className="text-sm text-white/50 font-bold normal-case ml-1">{suffix}</span>}
      </div>
      {subtitle && <div className="text-white/50 text-xs mt-2">{subtitle}</div>}
    </div>
  )
}

function InfoBox({ children }) {
  return (
    <div className="bg-da-cyan/10 border-l-4 border-da-cyan rounded-r-lg p-4 text-white/80 text-xs md:text-sm leading-relaxed">
      {children}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function InsulinCalculator() {
  // Step 1 — baseline inputs
  const [insulinType, setInsulinType] = useState('rapid')
  const [bgUnit, setBgUnit]           = useState('mg/dL')
  const [weight, setWeight]           = useState('')
  const [weightUnits, setWeightUnits] = useState('kg')

  // Step 2 — meal
  const [carbGrams, setCarbGrams]   = useState('')
  const [timeOfDay, setTimeOfDay]   = useState('morning')

  // Step 3 — correction
  const [currentBG, setCurrentBG]   = useState('')

  // Show formula reference table
  const [showFormulaTable, setShowFormulaTable] = useState(false)

  // Mode toggle — Beginner (default) shows existing inputs only;
  // Advanced reveals the personalization inputs that refine the TDD calc.
  const [mode, setMode] = useState('beginner')

  // Personalization inputs (only visible when mode === 'advanced')
  const [actualTdd,         setActualTdd]         = useState('')
  const [bodyFatPercent,    setBodyFatPercent]    = useState('')
  const [trainingStatus,    setTrainingStatus]    = useState('recreational')
  const [sex,               setSex]               = useState('male')
  const [cyclePhase,        setCyclePhase]        = useState('unknown')
  const [cycleExpanded,     setCycleExpanded]     = useState(false)

  // ===== Computed =====
  const tdd = useMemo(() => {
    const w = parseFloat(weight)
    const isAdvanced = mode === 'advanced'
    return calcTDD({
      weight: w,
      weightUnits,
      actualTdd:      isAdvanced ? parseFloat(actualTdd) || 0 : 0,
      bodyFatPercent: isAdvanced ? parseFloat(bodyFatPercent) || 0 : 0,
      trainingStatus: isAdvanced ? trainingStatus : 'recreational',
      sex:            isAdvanced ? sex : 'male',
      cyclePhase:     isAdvanced ? cyclePhase : 'unknown',
    })
  }, [mode, weight, weightUnits, actualTdd, bodyFatPercent, trainingStatus, sex, cyclePhase])

  const systemISF = useMemo(
    () => calcISF({ tdd, insulinType, bgUnit }),
    [tdd, insulinType, bgUnit]
  )

  const systemICRs = useMemo(() => ({
    morning:   calcICR({ tdd, time: 'morning' }),
    afternoon: calcICR({ tdd, time: 'afternoon' }),
    evening:   calcICR({ tdd, time: 'evening' }),
  }), [tdd])

  // ISF actually used in meal-dose math
  const activeISF = systemISF

  // ICR for selected time of day
  const activeICR = useMemo(
    () => systemICRs[timeOfDay],
    [timeOfDay, systemICRs]
  )

  // Step 2 — carb coverage
  const carbDose = useMemo(
    () => calcCarbDose({ carbGrams: parseFloat(carbGrams), icr: activeICR }),
    [carbGrams, activeICR]
  )

  // Step 3 — correction
  const targetBG = TARGET_BG[bgUnit]
  const correctionDose = useMemo(
    () => calcCorrectionDose({ currentBG: parseFloat(currentBG), targetBG, isf: activeISF }),
    [currentBG, targetBG, activeISF]
  )

  const tooLow = parseFloat(currentBG) > 0 && parseFloat(currentBG) <= targetBG

  // Step 4 — total
  const totalDose = carbDose + correctionDose

  // ===== Helpers for display =====
  const fmt = (n, dec = 2) => (n > 0 ? n.toFixed(dec) : '0')
  const fmtIcr = (n) => (n > 0 ? `1 : ${Math.round(n)}` : '—')

  const reset = () => {
    setInsulinType('rapid'); setBgUnit('mg/dL'); setWeight(''); setWeightUnits('kg')
    setCarbGrams(''); setTimeOfDay('morning'); setCurrentBG('')
    // Personalization defaults
    setMode('beginner')
    setActualTdd(''); setBodyFatPercent(''); setTrainingStatus('recreational')
    setSex('male'); setCyclePhase('unknown'); setCycleExpanded(false)
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
            ✨ Magic Ratio Calculator
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            The <span className="text-da-gold">Magic Ratio</span> Calculator
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            The perfect starting point to find your insulin and carb ratios — so you can dose with{' '}
            <span className="text-da-cyan font-bold">wizard-like accuracy</span> and{' '}
            <span className="text-da-gold font-bold">athlete-like confidence</span>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {/* Mode toggle — Beginner / Advanced */}
          <div className="mb-6">
            <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['beginner', 'Beginner', 'Recommended'],
                ['advanced', 'Advanced', 'I have more data'],
              ].map(([id, lbl, detail]) => (
                <button key={id} type="button" onClick={() => setMode(id)}
                  className={`p-3 rounded-lg text-left ${mode === id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
                  <div className={`font-bold ${mode === id ? 'text-da-cyan' : 'text-white'}`}>{lbl}</div>
                  <div className="text-xs text-white/40">{detail}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ============== STEP 1: Baseline ============== */}
          <StepCard stepNumber={1} title="Finding Your Baseline (TDD, I:C & ISF)" defaultOpen>
            {/* Insulin type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80">
                  Insulin Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowFormulaTable(!showFormulaTable)}
                  className="text-da-gold text-xs uppercase tracking-wider font-bold hover:text-da-cyan transition"
                >
                  {showFormulaTable ? 'Hide' : 'Show'} formulas
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setInsulinType('rapid')}
                  className={`py-2.5 rounded text-xs md:text-sm font-bold uppercase transition ${
                    insulinType === 'rapid' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Rapid Acting
                </button>
                <button
                  type="button"
                  onClick={() => setInsulinType('regular')}
                  className={`py-2.5 rounded text-xs md:text-sm font-bold uppercase transition ${
                    insulinType === 'regular' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  Regular Insulin
                </button>
              </div>

              {showFormulaTable && (
                <div className="mt-3 bg-da-darker border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-white/80">
                    <thead className="bg-white/5 text-da-cyan uppercase tracking-wider">
                      <tr>
                        <th className="text-left p-3">Insulin Type</th>
                        <th className="text-left p-3">mg/dL</th>
                        <th className="text-left p-3">mmol/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-white/5">
                        <td className="p-3">Rapid Acting (Humalog, Novolog, Apidra)</td>
                        <td className="p-3 font-mono">1800 ÷ TDD</td>
                        <td className="p-3 font-mono">100 ÷ TDD</td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="p-3">Regular Insulin (R)</td>
                        <td className="p-3 font-mono">1500 ÷ TDD</td>
                        <td className="p-3 font-mono">83 ÷ TDD</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Glucose units */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Calculate Doses In
              </label>
              <div className="grid grid-cols-2 gap-2 bg-da-darker rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setBgUnit('mg/dL')}
                  className={`py-2.5 rounded text-sm font-bold uppercase transition ${
                    bgUnit === 'mg/dL' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  mg/dL
                </button>
                <button
                  type="button"
                  onClick={() => setBgUnit('mmol/L')}
                  className={`py-2.5 rounded text-sm font-bold uppercase transition ${
                    bgUnit === 'mmol/L' ? 'bg-da-cyan text-da-dark' : 'text-white/60'
                  }`}
                >
                  mmol/L
                </button>
              </div>
            </div>

            {/* Body weight */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Body Weight *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={weightUnits === 'kg' ? '75' : '165'}
                  className="col-span-2 px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <select
                  value={weightUnits}
                  onChange={(e) => setWeightUnits(e.target.value)}
                  className="px-3 py-3 bg-da-darker border border-white/20 rounded-md text-white focus:outline-none focus:border-da-cyan transition"
                >
                  <option value="kg">kg</option>
                  <option value="pound">lbs</option>
                </select>
              </div>
            </div>

            {/* TDD result */}
            <div className="pt-2">
              <ResultBox
                label="Recommended Total Daily Dose (TDD)"
                value={fmt(tdd)}
                suffix="units / day"
                subtitle="~40–50% basal · ~50–60% bolus (carb cover + correction)"
              />
            </div>

            {/* Show system-calculated ratios */}
            <ResultBox
              label="Insulin Sensitivity Factor (ISF)"
              value={fmt(systemISF)}
              suffix={bgUnit}
              subtitle="One unit of insulin lowers BG by this amount"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Morning ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.morning)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Afternoon ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.afternoon)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Evening ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.evening)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
            </div>

          </StepCard>

          {/* Advanced Inputs — conditional on mode === 'advanced' */}
          {mode === 'advanced' && (
            <StepCard stepNumber="A" title="Advanced Inputs (optional)">
              <p className="text-white/60 text-sm mb-4">
                The more we know about you, the more accurate your calculated ratios. All fields below are optional — fill in what you know.
              </p>

              {/* Actual TDD */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Actual Total Daily Dose (units, optional)
                </label>
                <input
                  type="number" step="0.5" min="5" max="200"
                  value={actualTdd}
                  onChange={(e) => setActualTdd(e.target.value)}
                  placeholder="e.g. 32"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <p className="text-white/40 text-xs mt-1 italic">
                  Your average daily insulin (basal + bolus combined). If you don't know this, leave it blank — we'll estimate from your weight.
                </p>
              </div>

              {/* Body Fat % */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Body Fat % (optional)
                </label>
                <input
                  type="number" step="0.5" min="5" max="60"
                  value={bodyFatPercent}
                  onChange={(e) => setBodyFatPercent(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <p className="text-white/40 text-xs mt-1 italic">
                  For a more accurate TDD estimate if you know your body fat %. Skip if you provided actual TDD above.
                </p>
              </div>

              {/* Training Status */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Training Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TRAINING_STATUSES.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTrainingStatus(t.id)}
                      className={`p-3 rounded-lg text-left ${trainingStatus === t.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-darker border border-white/15'}`}>
                      <div className={`font-bold text-sm ${trainingStatus === t.id ? 'text-da-cyan' : 'text-white'}`}>{t.label}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{t.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sex (+ optional Cycle expander) */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['male', 'Male'], ['female', 'Female']].map(([id, lbl]) => (
                    <button key={id} type="button" onClick={() => setSex(id)}
                      className={`py-3 rounded-lg ${sex === id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-darker border border-white/15 text-white/60'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Cycle expander — only when Female */}
                {sex === 'female' && (
                  <>
                    <button type="button" onClick={() => setCycleExpanded(!cycleExpanded)}
                      className="text-da-cyan text-xs uppercase tracking-wider mt-2 font-bold">
                      {cycleExpanded ? '− Hide menstrual cycle refinement' : '+ Refine for menstrual cycle phase (optional)'}
                    </button>
                    {cycleExpanded && (
                      <div className="mt-3 p-4 bg-da-darker rounded-lg">
                        <p className="text-xs text-white/50 mb-3">
                          Cycle phase affects insulin sensitivity. Adjusts the calculation by ~5–15%. If you're not menstruating, on hormonal contraception, or don't track your cycle, leave this as "Don't know / N/A" — the default works for most users.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CYCLE_PHASES.map((p) => (
                            <button key={p.id} type="button" onClick={() => setCyclePhase(p.id)}
                              className={`p-3 rounded-lg text-left ${cyclePhase === p.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/15'}`}>
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
            </StepCard>
          )}

          {/* ============== STEP 2: Carb Coverage ============== */}
          <StepCard stepNumber={2} title="Carb Coverage">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Carbohydrate Content (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={carbGrams}
                onChange={(e) => setCarbGrams(e.target.value)}
                placeholder="How many grams of carbs in your meal?"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Time of Day
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OF_DAY.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeOfDay(t.id)}
                    className={`py-3 rounded-md text-sm font-bold uppercase transition border ${
                      timeOfDay === t.id
                        ? 'bg-da-cyan text-da-dark border-da-cyan'
                        : 'bg-da-darker text-white/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-white/60 mb-2">
                Carbohydrate Ratio (g per 1 unit)
              </div>
              <div className="px-4 py-3 bg-da-darker/60 border border-white/10 rounded-md text-white/90 font-mono text-sm">
                {activeICR > 0 ? activeICR.toFixed(0) : '—'} g per 1 unit
              </div>
              <p className="text-white/40 text-xs mt-2">
                Auto-populated from your selected time-of-day ICR above.
              </p>
            </div>

            <div className="pt-2">
              <ResultBox
                label="Insulin Dose to Cover Carbohydrates"
                value={fmt(carbDose)}
                suffix="units"
                accent="cyan"
              />
            </div>
          </StepCard>

          {/* ============== STEP 3: Correction ============== */}
          <StepCard stepNumber={3} title="High Blood Sugar Correction">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Current BG ({bgUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentBG}
                  onChange={(e) => setCurrentBG(e.target.value)}
                  placeholder={bgUnit === 'mg/dL' ? '180' : '10'}
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Target BG ({bgUnit})
                </label>
                <div className="px-4 py-3 bg-da-darker/60 border border-white/10 rounded-md text-white/90">
                  {targetBG} <span className="text-white/40 text-xs ml-1">(fixed)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-white/60 mb-2">
                Insulin Sensitivity Factor ({bgUnit} per unit)
              </div>
              <div className="px-4 py-3 bg-da-darker/60 border border-white/10 rounded-md text-white/90 font-mono text-sm">
                {activeISF > 0 ? activeISF.toFixed(2) : '—'} {bgUnit} / unit
              </div>
              <p className="text-white/40 text-xs mt-2">
                Auto-calculated from your TDD and insulin type.
              </p>
            </div>

            <div className="pt-2">
              <ResultBox
                label="Insulin Dose to Correct Blood Glucose"
                value={fmt(correctionDose)}
                suffix="units"
                accent="cyan"
              />
              {tooLow && (
                <p className="text-red-400 text-xs text-center mt-3 font-bold">
                  ⚠️ Current BG must be greater than target BG for a correction dose to be needed.
                </p>
              )}
            </div>
          </StepCard>

          {/* ============== STEP 4: Total ============== */}
          <StepCard stepNumber={4} title="Total Meal Time Dose">
            <ResultBox
              label="Total Insulin Dose"
              value={fmt(totalDose)}
              suffix="units"
              accent="gold"
            />
            <InfoBox>
              This is the total amount of insulin to:<br />
              <strong className="text-da-cyan">a)</strong> cover the carbs in your meal, plus<br />
              <strong className="text-da-cyan">b)</strong> correct your glucose to target range.
            </InfoBox>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                <div className="text-da-cyan text-[10px] uppercase tracking-wider font-bold mb-1">
                  Carb Coverage
                </div>
                <div className="text-xl font-black text-white">{fmt(carbDose)}<span className="text-xs text-white/50 ml-1">u</span></div>
              </div>
              <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                <div className="text-da-cyan text-[10px] uppercase tracking-wider font-bold mb-1">
                  Correction
                </div>
                <div className="text-xl font-black text-white">{fmt(correctionDose)}<span className="text-xs text-white/50 ml-1">u</span></div>
              </div>
            </div>
          </StepCard>

          {/* Reality-check note — frames the calculator output as starting points */}
          <p className="text-xs text-white/50 italic text-center mt-6">
            These are your calibrated starting points. Track your real-world response over 1–2 weeks and you'll lock in the version that's truly yours.
          </p>

          {/* Dawn vs Foot-to-Floor educational card */}
          <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan mt-6">
            <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">🌅 Why your morning numbers might still need adjusting</p>
            <div className="text-white/70 space-y-3 text-sm leading-relaxed">
              <p>
                <strong className="text-white">Dawn Phenomenon</strong> is a slow glucose rise that happens <em>while you're still asleep</em> (typically 2–4 AM), driven by overnight hormones. If your glucose is <em>already</em> elevated when you check on waking, that's a sign of dawn phenomenon — usually addressed by overnight basal adjustments or bedtime tweaks, not by this calculator.
              </p>
              <p>
                <strong className="text-white">Foot-to-Floor</strong> is the sharp glucose spike that happens <em>after you get out of bed</em>, driven by the cortisol and adrenaline of waking up. Your glucose is fine on waking, then rises 15–60 minutes later. Many T1Ds preempt this with a small fixed bolus on waking.
              </p>
              <p>
                These two get conflated constantly. If you suspect one of them is affecting your mornings, track your numbers around waking for a week and look at the pattern — getting the diagnosis right is the first step toward dosing with confidence.
              </p>
            </div>
          </div>

          {/* Reset */}
          <div className="flex justify-center pt-4">
            <Button type="button" variant="outline" size="md" onClick={reset}>
              Reset Calculator
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto mt-12 p-6 border border-white/10 rounded-2xl bg-da-darker/40">
          <p className="text-white/50 text-xs leading-relaxed italic">
            <strong className="text-da-gold not-italic">⚠️ Educational tool — not medical advice.</strong>{' '}
            The Magic Ratio Calculator is intended for informational and educational purposes only. It is
            not a substitute for professional medical advice, diagnosis, or treatment. Always consult your
            healthcare provider or diabetes specialist before making any changes to your insulin regimen.
            While this tool is designed to help you calculate potential <em>starting numbers</em>, you are
            responsible for verifying all inputs and outputs before administering insulin. Diabetic Athletic
            assumes no liability for any errors, inaccuracies, or consequences arising from the use of this
            calculator.
          </p>
        </div>
      </div>
    </div>
  )
}
