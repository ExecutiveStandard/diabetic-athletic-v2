# Workout Fueling Calc Personalization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new personalization inputs (Sex, Cycle Phase, Training Status, Fasted/Fed, Pre-workout Insulin Adjustment) to the Workout Fueling Calculator. Each input is applied as a multiplicative coefficient on a specific existing prediction component (base_rate or iob_contribution), preserving backward compatibility — when all new inputs are omitted or set to their defaults, the calculator's output matches today's behavior exactly.

**Architecture:** Math layer first (extend `prediction.js` with 5 exported multiplier constants and apply them inside `predictEndGlucose`). UI layer second (add 6 useState hooks + 4 module constants + 5 JSX blocks to `PreWorkoutGlucoseCalculator.jsx`, wire the new inputs into the existing `prediction` useMemo). Two tasks, each fully self-contained.

**Tech Stack:** React 19 + Vite + TailwindCSS + react-router-dom 7. Vitest already configured.

**Spec source-of-truth:** `docs/superpowers/specs/2026-05-13-workout-fueling-calc-personalization-design.md`

**Phases:**
- **Task 1** — Math layer (TDD: 13 new unit tests + multiplier constants + `predictEndGlucose` extension). After this, all 54 unit tests pass (41 existing + 13 new).
- **Task 2** — UI layer (state + JSX + reset + useMemo wiring). Verified via `npm run build` + browser visual QA at the end.

---

## File Structure

```
src/features/calculators/
├── PreWorkoutGlucoseCalculator.jsx       # MODIFIED (Task 2)
│                                         #   - 4 new module constants
│                                         #   - 6 new useState hooks
│                                         #   - prediction useMemo extended
│                                         #   - reset() extended
│                                         #   - 5 new JSX blocks inserted
│
└── pre-workout-glucose/
    ├── prediction.js                     # MODIFIED (Task 1)
    │                                     #   - 6 new multiplier-table exports
    │                                     #   - predictEndGlucose signature extended
    │                                     #   - 5 multipliers applied in compute
    └── prediction.test.js                # MODIFIED (Task 1)
                                          #   - 13 new test cases added
                                          #   - existing 10 tests unchanged
```

No new files. No file deletions. No URL changes.

---

## Task 1: Math layer (`prediction.js`)

Spec reference: §4 (Math Integration), §8.1 (New unit tests required).

**Files:**
- Modify: `src/features/calculators/pre-workout-glucose/prediction.js`
- Modify: `src/features/calculators/pre-workout-glucose/prediction.test.js`

This task adds the multiplier-table constants and applies them inside the existing `predictEndGlucose` function. All changes are backward-compatible: the 5 new function parameters are optional, and when omitted (or set to baseline values), multipliers default to 1.00 and output is identical to today's behavior.

TDD flow: write new tests first → observe failures → extend the implementation → all tests pass.

- [ ] **Step 1: Write the 13 new failing tests**

Open `src/features/calculators/pre-workout-glucose/prediction.test.js`. The file currently has 10 tests. Append the following new test code AFTER the existing tests but BEFORE the final closing of the test file. Do NOT modify or remove any existing tests.

Add these imports at the top of the file (add `SEX_IOB_MULTIPLIER`, etc. to the existing import):

```js
import {
  predictEndGlucose,
  SEX_IOB_MULTIPLIER,
  CYCLE_IOB_MULTIPLIER,
  TRAINING_BASE_MULTIPLIER,
  FASTED_BASE_MULTIPLIER,
  FASTED_IOB_MULTIPLIER,
  INSULIN_ADJ_IOB_MULTIPLIER,
} from './prediction'
```

Append the following describe blocks at the bottom of the file (after the existing describes but before the file ends):

```js
// ───────────────────────── PERSONALIZATION MULTIPLIERS ─────────────────────────

describe('Multiplier table exports', () => {
  it('SEX_IOB_MULTIPLIER has male=1.00 and female=1.10', () => {
    expect(SEX_IOB_MULTIPLIER.male).toBe(1.00)
    expect(SEX_IOB_MULTIPLIER.female).toBe(1.10)
  })
  it('CYCLE_IOB_MULTIPLIER values: follicular > midCycle = unknown > luteal', () => {
    expect(CYCLE_IOB_MULTIPLIER.follicular).toBe(1.15)
    expect(CYCLE_IOB_MULTIPLIER.midCycle).toBe(1.10)
    expect(CYCLE_IOB_MULTIPLIER.unknown).toBe(1.10)
    expect(CYCLE_IOB_MULTIPLIER.luteal).toBe(1.00)
  })
  it('TRAINING_BASE_MULTIPLIER decreases with fitness', () => {
    expect(TRAINING_BASE_MULTIPLIER.untrained).toBe(1.15)
    expect(TRAINING_BASE_MULTIPLIER.recreational).toBe(1.00)
    expect(TRAINING_BASE_MULTIPLIER.trained).toBe(0.85)
    expect(TRAINING_BASE_MULTIPLIER.highlyTrained).toBe(0.75)
  })
  it('FASTED_BASE_MULTIPLIER: fasted=1.10, fed=1.00', () => {
    expect(FASTED_BASE_MULTIPLIER.fasted).toBe(1.10)
    expect(FASTED_BASE_MULTIPLIER.fed).toBe(1.00)
  })
  it('FASTED_IOB_MULTIPLIER: fasted=0.90, fed=1.00', () => {
    expect(FASTED_IOB_MULTIPLIER.fasted).toBe(0.90)
    expect(FASTED_IOB_MULTIPLIER.fed).toBe(1.00)
  })
  it('INSULIN_ADJ_IOB_MULTIPLIER decreases as adjustment increases', () => {
    expect(INSULIN_ADJ_IOB_MULTIPLIER.none).toBe(1.00)
    expect(INSULIN_ADJ_IOB_MULTIPLIER.modest).toBe(0.85)
    expect(INSULIN_ADJ_IOB_MULTIPLIER.significant).toBe(0.70)
  })
})

// Helper for personalization tests — based on baseInput from existing tests
// but with explicit IOB so iob_contribution is non-zero (otherwise IOB multipliers
// have no visible effect).
const personalizationInput = {
  startMmol: 7.0,
  trendArrow: 'flat',
  workoutType: 'aerobic',
  intensity: 5,
  durationMin: 45,
  iobUnits: 2.0,  // non-zero so IOB-multiplier effects are visible
  recentCarbs: { grams: 0, minutesAgo: 0 },
  bodyweightKg: 70,
  timeOfDay: 'midday',
}

describe('predictEndGlucose — Sex multiplier', () => {
  it('female produces a more amplified IOB drop than male (same inputs)', () => {
    const male   = predictEndGlucose({ ...personalizationInput, sex: 'male'   })
    const female = predictEndGlucose({ ...personalizationInput, sex: 'female' })
    // Both should drop (aerobic + IOB), but female should drop MORE
    expect(female.endMmol).toBeLessThan(male.endMmol)
  })
  it('omitting sex matches sex=male (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const male    = predictEndGlucose({ ...personalizationInput, sex: 'male' })
    expect(omitted.endMmol).toBeCloseTo(male.endMmol, 5)
  })
})

describe('predictEndGlucose — Cycle phase multiplier', () => {
  it('female + follicular drops more than female + luteal (same inputs)', () => {
    const follicular = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'follicular' })
    const luteal     = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'luteal'     })
    expect(follicular.endMmol).toBeLessThan(luteal.endMmol)
  })
  it('male + any cyclePhase value is ignored (no effect)', () => {
    const a = predictEndGlucose({ ...personalizationInput, sex: 'male', cyclePhase: 'follicular' })
    const b = predictEndGlucose({ ...personalizationInput, sex: 'male', cyclePhase: 'luteal'     })
    const c = predictEndGlucose({ ...personalizationInput, sex: 'male' })
    expect(a.endMmol).toBeCloseTo(c.endMmol, 5)
    expect(b.endMmol).toBeCloseTo(c.endMmol, 5)
  })
  it('female + unknown matches female + midCycle (safe midpoint default)', () => {
    const unknown  = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'unknown'  })
    const midCycle = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'midCycle' })
    expect(unknown.endMmol).toBeCloseTo(midCycle.endMmol, 5)
  })
})

describe('predictEndGlucose — Training status multiplier', () => {
  it('highlyTrained produces a smaller drop than untrained (same workout)', () => {
    const highlyTrained = predictEndGlucose({ ...personalizationInput, trainingStatus: 'highlyTrained' })
    const untrained     = predictEndGlucose({ ...personalizationInput, trainingStatus: 'untrained'     })
    expect(highlyTrained.endMmol).toBeGreaterThan(untrained.endMmol)
  })
  it('omitting trainingStatus matches trainingStatus=recreational (backward compatibility)', () => {
    const omitted      = predictEndGlucose(personalizationInput)
    const recreational = predictEndGlucose({ ...personalizationInput, trainingStatus: 'recreational' })
    expect(omitted.endMmol).toBeCloseTo(recreational.endMmol, 5)
  })
})

describe('predictEndGlucose — Fasted/Fed multiplier', () => {
  it('fasted produces a larger drop than fed', () => {
    const fasted = predictEndGlucose({ ...personalizationInput, fastedFed: 'fasted' })
    const fed    = predictEndGlucose({ ...personalizationInput, fastedFed: 'fed'    })
    expect(fasted.endMmol).toBeLessThan(fed.endMmol)
  })
  it('omitting fastedFed matches fastedFed=fed (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const fed     = predictEndGlucose({ ...personalizationInput, fastedFed: 'fed' })
    expect(omitted.endMmol).toBeCloseTo(fed.endMmol, 5)
  })
})

describe('predictEndGlucose — Insulin adjustment multiplier', () => {
  it('significant reduction produces a smaller IOB-driven drop than none', () => {
    const significant = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'significant' })
    const none        = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'none'        })
    expect(significant.endMmol).toBeGreaterThan(none.endMmol)
  })
  it('omitting insulinAdjustment matches insulinAdjustment=none (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const none    = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'none' })
    expect(omitted.endMmol).toBeCloseTo(none.endMmol, 5)
  })
})

describe('predictEndGlucose — Compound multiplier sanity', () => {
  it('best-case scenario (female + follicular + highlyTrained + fed + significant) produces a noticeably milder drop than worst-case (male + untrained + fasted + none)', () => {
    const bestCase = predictEndGlucose({
      ...personalizationInput,
      sex: 'female', cyclePhase: 'follicular',
      trainingStatus: 'highlyTrained',
      fastedFed: 'fed',
      insulinAdjustment: 'significant',
    })
    const worstCase = predictEndGlucose({
      ...personalizationInput,
      sex: 'male',
      trainingStatus: 'untrained',
      fastedFed: 'fasted',
      insulinAdjustment: 'none',
    })
    // bestCase has more counterregulatory protection → smaller drop → higher endMmol
    expect(bestCase.endMmol).toBeGreaterThan(worstCase.endMmol)
    // The spread should be meaningful, not just a rounding artifact
    expect(bestCase.endMmol - worstCase.endMmol).toBeGreaterThan(1.0)  // at least 1 mmol/L difference
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test src/features/calculators/pre-workout-glucose/prediction.test.js`

Expected: failures pointing to the missing multiplier-table exports (`SEX_IOB_MULTIPLIER is not defined` or similar). The existing 10 tests should still pass; the 13 new ones should fail.

- [ ] **Step 3: Add the 6 multiplier-table exports to `prediction.js`**

Open `src/features/calculators/pre-workout-glucose/prediction.js`. Find the existing const declarations near the top (after the file's leading comment, before `BASE_RATE_PER_MIN`). Add these 6 new EXPORTED constants right BEFORE the existing `BASE_RATE_PER_MIN` declaration:

```js
// ───────────── PERSONALIZATION MULTIPLIERS ─────────────
// Coefficients are starting values drawn from Riddell 2017 /
// Yardley 2018 / EXTOD / Goldfarb cycle-phase literature. Conservative
// midpoints within published ranges; subject to feedback-based refinement.

export const SEX_IOB_MULTIPLIER = {
  male:   1.00,  // baseline
  female: 1.10,  // ~10% more insulin sensitive at baseline
}

export const CYCLE_IOB_MULTIPLIER = {
  follicular: 1.15,  // most insulin sensitive (low estrogen + progesterone)
  midCycle:   1.10,  // near-ovulation, intermediate
  luteal:     1.00,  // least sensitive (high progesterone)
  unknown:    1.10,  // safe midpoint default
}

export const TRAINING_BASE_MULTIPLIER = {
  untrained:     1.15,
  recreational:  1.00,  // baseline
  trained:       0.85,
  highlyTrained: 0.75,
}

export const FASTED_BASE_MULTIPLIER = {
  fasted: 1.10,  // larger glucose drop (lower glycogen, less substrate)
  fed:    1.00,  // baseline
}

export const FASTED_IOB_MULTIPLIER = {
  fasted: 0.90,  // catecholamines partially offset IOB
  fed:    1.00,  // baseline
}

export const INSULIN_ADJ_IOB_MULTIPLIER = {
  none:        1.00,  // baseline
  modest:      0.85,  // 25–50% reduction
  significant: 0.70,  // 50–80% reduction
}
```

- [ ] **Step 4: Extend the `predictEndGlucose` function signature and apply multipliers**

Find the existing `predictEndGlucose` function. The current signature destructures 9 inputs:

```js
export function predictEndGlucose({
  startMmol,
  trendArrow,
  workoutType,
  intensity,
  durationMin,
  iobUnits,
  recentCarbs,
  bodyweightKg,
  timeOfDay,
}) {
```

Replace with this extended signature that adds 5 new optional params:

```js
export function predictEndGlucose({
  startMmol,
  trendArrow,
  workoutType,
  intensity,
  durationMin,
  iobUnits,
  recentCarbs,
  bodyweightKg,
  timeOfDay,
  // NEW personalization inputs — all optional. If omitted, multipliers default
  // to 1.00 and the function output matches its pre-personalization behavior.
  sex,
  cyclePhase,
  trainingStatus,
  fastedFed,
  insulinAdjustment,
}) {
```

Then, inside the function body, find the existing `baseDelta` and `iobDelta` calculations. They currently look like this (approximately):

```js
  // 1. Base rate from workout type × intensity over duration
  const basePerMin = BASE_RATE_PER_MIN[workoutType][intensityKey]
  const baseDelta = basePerMin * durationMin
  // ...

  // 2. IOB contribution (amplified by workout type, scaled by intensity)
  const iobAmp = IOB_AMPLIFIER[workoutType]
  const iScaler = INTENSITY_SCALER[intensityKey]
  const iobDelta = -iobUnits * 1.8 * (durationMin / 60) * iobAmp * iScaler
```

ABOVE the existing `baseDelta` calculation, add this multiplier-resolution block:

```js
  // Resolve personalization multipliers. Each defaults to 1.00 if its input
  // is omitted, so this preserves backward compatibility for callers that
  // don't supply the new inputs.
  const sexMult        = SEX_IOB_MULTIPLIER[sex] ?? 1.00
  const cycleMult      = sex === 'female' ? (CYCLE_IOB_MULTIPLIER[cyclePhase] ?? 1.10) : 1.00
  const trainingMult   = TRAINING_BASE_MULTIPLIER[trainingStatus] ?? 1.00
  const fastedBaseMult = FASTED_BASE_MULTIPLIER[fastedFed] ?? 1.00
  const fastedIobMult  = FASTED_IOB_MULTIPLIER[fastedFed] ?? 1.00
  const insulinAdjMult = INSULIN_ADJ_IOB_MULTIPLIER[insulinAdjustment] ?? 1.00
```

Then update the `baseDelta` line to multiply by `trainingMult` and `fastedBaseMult`:

```js
  // 1. Base rate from workout type × intensity over duration
  const basePerMin = BASE_RATE_PER_MIN[workoutType][intensityKey]
  const baseDelta = basePerMin * durationMin * trainingMult * fastedBaseMult
```

And update the `iobDelta` line to multiply by `sexMult`, `cycleMult`, `fastedIobMult`, and `insulinAdjMult`:

```js
  // 2. IOB contribution (amplified by workout type, scaled by intensity)
  const iobAmp = IOB_AMPLIFIER[workoutType]
  const iScaler = INTENSITY_SCALER[intensityKey]
  const iobDelta = -iobUnits * 1.8 * (durationMin / 60) * iobAmp * iScaler
                   * sexMult * cycleMult * fastedIobMult * insulinAdjMult
```

The other three deltas (`trendDelta`, `carbDelta`, `todDelta`) are NOT affected by personalization and stay exactly as they are.

The breakdown labels in the `breakdown.push(...)` calls also stay unchanged for now — the user-facing breakdown card still lists the same components.

- [ ] **Step 5: Run the test suite to confirm all 23 prediction tests pass**

Run: `npm test src/features/calculators/pre-workout-glucose/prediction.test.js`

Expected output: `Tests  23 passed (23)`. Both the 10 existing tests and the 13 new tests should pass.

- [ ] **Step 6: Run the full project test suite to confirm no regressions elsewhere**

Run: `npm test`

Expected output: total test count grows by 13 (from 104 to 117). All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/prediction.js src/features/calculators/pre-workout-glucose/prediction.test.js
git commit -m "feat(workout-fueling): add personalization multipliers to prediction logic"
```

---

## Task 2: UI layer (`PreWorkoutGlucoseCalculator.jsx`)

Spec reference: §3 (input formats + defaults), §5 (form layout), §6 (UI JSX), §7.1 (architecture).

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

This task adds the 4 new module constants, 6 useState hooks, updates the `prediction` useMemo to pass new inputs, updates `reset()`, and inserts 5 new JSX blocks into the form at their spec-defined positions.

There are no new unit tests — visual verification only via `npm run build` + the existing test suite (which Task 1 already validated).

- [ ] **Step 1: Add 4 new module-level constants**

Open `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`. Find the existing module-level constants block (currently `WORKOUT_TYPES`, `TRENDS`, `TIME_OF_DAY`, `HR_ZONES`, `INTENSITY_RPE_FROM_BAND`). Append these 4 new constants AFTER `INTENSITY_RPE_FROM_BAND` and BEFORE the `export default function PreWorkoutGlucoseCalculator()` line:

```js
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
```

(Note: Fasted/Fed has only 2 options and is defined inline in the JSX rather than as a module constant — see Step 6.)

- [ ] **Step 2: Add 6 new useState hooks**

Find the existing useState block at the top of the component body. The Workout state group currently looks like this:

```js
  // Workout
  const [workoutType, setWorkoutType] = useState('aerobic')
  const [intensity, setIntensity] = useState(5)
  const [hrZone, setHrZone] = useState('Z3')
  const [duration, setDuration] = useState('')
```

LEAVE all existing useState declarations in place. ADD these 6 new useState hooks immediately AFTER the existing Workout state group (after `setDuration`):

```js
  // Personalization (added 2026-05-13)
  const [sex,               setSex]               = useState('male')
  const [cyclePhase,        setCyclePhase]        = useState('unknown')
  const [cycleExpanded,     setCycleExpanded]     = useState(false)
  const [trainingStatus,    setTrainingStatus]    = useState('recreational')
  const [fastedFed,         setFastedFed]         = useState('fed')
  const [insulinAdjustment, setInsulinAdjustment] = useState('none')
```

- [ ] **Step 3: Update the `prediction` useMemo to pass the new inputs**

Find the existing `prediction` useMemo. The current call to `predictEndGlucose` looks approximately like this:

```js
  const prediction = useMemo(() => {
    const sg = parseFloat(startGlucose)
    const dur = parseFloat(duration)
    const wt = parseFloat(weight)
    const iob = parseFloat(effectiveIob) || 0
    if (!sg || !dur || !wt) return null

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
    })
  }, [startGlucose, glucoseUnit, trendArrow, workoutType, intensity, hrZone, duration, effectiveIob, hasRecentCarbs, recentGrams, recentMinutesAgo, weight, weightUnit, timeOfDay])
```

Update the function call to pass the 5 new inputs, and update the dependency array to include the new state vars. Replace the entire useMemo with:

```js
  const prediction = useMemo(() => {
    const sg = parseFloat(startGlucose)
    const dur = parseFloat(duration)
    const wt = parseFloat(weight)
    const iob = parseFloat(effectiveIob) || 0
    if (!sg || !dur || !wt) return null

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
```

Five new keys passed to `predictEndGlucose` (sex, cyclePhase, trainingStatus, fastedFed, insulinAdjustment), and five new entries appended to the dependency array in the same order.

- [ ] **Step 4: Update the `reset()` function**

Find the existing `reset()` function. It currently looks like:

```js
  const reset = () => {
    setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
    setIntensity(5); setHrZone('Z3'); setDuration(''); setIobUnits('')
    setIobHelperOpen(false); setLastBolus(''); setMinutesSinceBolus('')
    setHasRecentCarbs(false); setRecentGrams(''); setRecentMinutesAgo('')
    setWeight('')
  }
```

Replace with:

```js
  const reset = () => {
    setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
    setIntensity(5); setHrZone('Z3'); setDuration(''); setIobUnits('')
    setIobHelperOpen(false); setLastBolus(''); setMinutesSinceBolus('')
    setHasRecentCarbs(false); setRecentGrams(''); setRecentMinutesAgo('')
    setWeight('')
    // Personalization defaults
    setSex('male'); setCyclePhase('unknown'); setCycleExpanded(false)
    setTrainingStatus('recreational'); setFastedFed('fed'); setInsulinAdjustment('none')
  }
```

6 new setters added at the end. All other lines unchanged.

- [ ] **Step 5: Add the Sex toggle + Cycle expander JSX at the TOP of the form**

Find the form's outer container — the section that opens with `<section className="da-container section-padding">` and `<div className="max-w-3xl mx-auto space-y-6">` — and locate the FIRST input block inside the input card (it's the Starting Glucose block, beginning with `{/* Starting glucose */}` or similar comment).

Insert this new block IMMEDIATELY BEFORE the Starting Glucose block, so the Sex toggle becomes the FIRST input the user sees:

```jsx
  {/* Sex */}
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
```

- [ ] **Step 6: Add the Training Status block AFTER Workout Type**

Find the existing Workout Type block in the JSX — it has a `{/* Workout type */}` comment and renders 4 tiles using `WORKOUT_TYPES.map(...)`.

Insert this new block IMMEDIATELY AFTER the Workout Type block's closing `</div>` and BEFORE the next existing block (which is the conditional Intensity/HR Zone block beginning `{workoutType === 'aerobic' ? (`):

```jsx
  {/* Training status */}
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
```

- [ ] **Step 7: Add the Pre-Workout Insulin Adjustment block AFTER the IOB block**

Find the existing IOB block in the JSX. It contains the main IOB number input AND the "Help me calculate it" expandable helper. The whole block ends with a closing `</div>` AFTER the helper panel.

Insert this new block IMMEDIATELY AFTER the IOB block's closing `</div>` and BEFORE the next existing block (which is the Recent Carbs block):

```jsx
  {/* Pre-workout insulin adjustment */}
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
```

- [ ] **Step 8: Add the Fasted/Fed block AFTER the Recent Carbs block**

Find the existing Recent Carbs block — it has the checkbox label "Have you eaten any carbs recently?" and the conditional grams/minutes inputs.

Insert this new block IMMEDIATELY AFTER the Recent Carbs block's closing `</div>` and BEFORE the next existing block (which is the Body Weight block):

```jsx
  {/* Fasted / Fed */}
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
```

- [ ] **Step 9: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 10: Run full test suite to confirm no regressions**

Run: `npm test`
Expected: `Tests  117 passed (117)` — same count as the end of Task 1 (no UI tests were added).

- [ ] **Step 11: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): add 5 personalization inputs to UI (sex, cycle, training, fasted/fed, insulin adj)"
```

---

# Wrap-up

After both tasks complete, do manual visual QA in the browser:

1. Navigate to http://localhost:3000/calculators/pre-workout-glucose
2. Confirm the **Sex toggle** is the FIRST input visible in the form. Default selection: Male.
3. Click "Female" → the small **"+ Refine for menstrual cycle phase (optional)"** link should appear directly below.
4. Click the link → cycle phase 2×2 grid expands, showing 4 options. "Don't know / N/A" is the default selection. Click each phase to confirm selection toggles work.
5. Switch sex back to Male → the cycle expander and its content disappear entirely.
6. Confirm the **Training Status** 4-button tile grid appears directly after the Workout Type tiles. Default: Recreational.
7. Confirm the **Pre-Workout Insulin Adjustment** 3-button selector appears directly after the IOB block (after the "Help me calculate it" helper). Default: None.
8. Confirm the **Meal State (Fasted/Fed)** 2-button selector appears directly after the Recent Carbs block. Default: Fed.
9. Fill in all required inputs (starting glucose, duration, body weight, etc.) so a prediction renders.
10. Confirm the prediction displays with all defaults (Male / Recreational / Fed / None). Note the predicted end-glucose value.
11. Switch to "Highly Trained" → confirm the predicted end-glucose value INCREASES (smaller drop because trained athletes are more efficient).
12. Switch back to "Recreational", then switch Fasted/Fed to "Fasted" → confirm the predicted end-glucose DECREASES (larger drop because fasted state amplifies workout drop).
13. Switch Insulin Adjustment to "Significant" → confirm the predicted end-glucose INCREASES (less IOB effect).
14. Switch sex to "Female", expand cycle, pick "Follicular" → confirm the predicted end-glucose DECREASES (more amplified IOB drop for follicular phase).
15. Click "Reset" → all 6 new state vars should reset to their defaults (Male / unknown / collapsed / Recreational / Fed / None).
16. Switch workout type between Aerobic / Anaerobic / Mixed / Strength → confirm HR Zone / RPE slider toggling still works correctly (no regression on the rename + HR Zone feature shipped earlier).

If all steps pass, the personalization rollout is complete.

---

*End of plan.*
