# Workout Fueling Calculator Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Workout Fueling Calculator's math + UI so its primary output is a fuel plan (how many grams, when) that gets users to a 7.0–8.0 mmol/L target by workout end — with activity-type-aware branches, safety guardrails for low/high BG, and a Beginner/Advanced input split that keeps the lead-magnet experience accessible.

**Architecture:** Three sequential tasks. Task 1 introduces the pure `fuelPlan.js` module (TDD: tests first), wires it into the existing calculator (replacing `carbRecommendation.js`), and deletes the obsolete module. Task 2 reorganizes the calculator inputs into a Beginner/Advanced split with a mode toggle. Task 3 replaces the existing `PredictionResults` component with a new `FuelPlanResults` component that makes the fuel plan the hero output.

**Tech Stack:** React 19 + Vite + TailwindCSS + Vitest. No new dependencies. Pure JS for `fuelPlan.js` (no React).

**Spec source-of-truth:** [`docs/superpowers/specs/2026-05-17-workout-fueling-redesign-design.md`](../specs/2026-05-17-workout-fueling-redesign-design.md)

---

## File Structure

```
src/features/calculators/
├── PreWorkoutGlucoseCalculator.jsx       # MODIFY (Task 1 + 2 + 3)
│                                          #   Task 1: import buildFuelPlan, swap call site
│                                          #   Task 2: mode toggle + Advanced StepCard
│                                          #   Task 3: swap PredictionResults → FuelPlanResults
│
└── pre-workout-glucose/
    ├── fuelPlan.js                        # CREATE (Task 1)
    ├── fuelPlan.test.js                   # CREATE (Task 1)
    ├── carbRecommendation.js              # DELETE (Task 1)
    ├── carbRecommendation.test.js         # DELETE (Task 1)
    └── (prediction.js, iobDecay.js, etc.) # UNCHANGED
```

---

## Task 1: Build `fuelPlan.js` (TDD), wire into calculator, delete old `carbRecommendation`

Spec reference: §5 (math), §7.1 (function signature), §8 (test cases)

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/fuelPlan.js`
- Create: `src/features/calculators/pre-workout-glucose/fuelPlan.test.js`
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx` (replace import + call site)
- Delete: `src/features/calculators/pre-workout-glucose/carbRecommendation.js`
- Delete: `src/features/calculators/pre-workout-glucose/carbRecommendation.test.js`

This task introduces the new pure module with comprehensive tests using TDD, then swaps the existing calculator's call site from `gramsNeeded()` to `buildFuelPlan()` so the calculator continues to function (using the new math). The old `carbRecommendation.*` files are deleted.

After this task: the calculator still LOOKS the same (UI unchanged from Task 1's perspective) but its math is the new fuel-plan math. The intermediate UI behavior may look a bit odd because the existing UI was built around the old single-grams-number — that gets fully rebuilt in Task 3.

- [ ] **Step 1: Write the failing test file**

Create `src/features/calculators/pre-workout-glucose/fuelPlan.test.js` with this exact content:

```js
import { describe, it, expect } from 'vitest'
import { buildFuelPlan } from './fuelPlan'

// Helper for shorter test calls
function plan(overrides = {}) {
  return buildFuelPlan({
    startGlucoseMmol: 6.5,
    predictedEndMmol: 4.0,
    activityType: 'aerobic',
    durationMinutes: 45,
    bodyweightKg: 70,
    iobUnits: 0,
    ...overrides,
  })
}

describe('buildFuelPlan — safety branches', () => {
  it('returns status=delay when starting BG < 5 mmol/L', () => {
    const r = plan({ startGlucoseMmol: 4.5 })
    expect(r.status).toBe('delay')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.warning).toContain("Don't start your workout yet")
  })

  it('returns status=high-bg-warning when starting BG > 15 mmol/L', () => {
    const r = plan({ startGlucoseMmol: 16.0 })
    expect(r.status).toBe('high-bg-warning')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.warning).toContain('ketones')
  })

  it('BG exactly 5.0 → fuel status (boundary inclusive on safe side)', () => {
    const r = plan({ startGlucoseMmol: 5.0, predictedEndMmol: 3.5 })
    expect(r.status).toBe('fuel')
  })

  it('BG exactly 15.0 → fuel/no-fuel status (boundary inclusive on safe side)', () => {
    const r = plan({ startGlucoseMmol: 15.0, predictedEndMmol: 12.0 })
    expect(r.status).not.toBe('high-bg-warning')
  })
})

describe('buildFuelPlan — aerobic, no top-ups (≤60 min)', () => {
  it('70kg, BG 6.5, predicted end 4.0, 45min aerobic → ~18-20g pre-workout', () => {
    const r = plan({
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout).not.toBeNull()
    expect(r.preWorkout.grams).toBeGreaterThanOrEqual(15)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(20)
    expect(r.topUps).toEqual([])
  })

  it('70kg, BG 5.0, predicted end 3.0, 30min aerobic → ~12g pre-workout', () => {
    const r = plan({
      startGlucoseMmol: 5.0,
      predictedEndMmol: 3.0,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout.grams).toBeGreaterThanOrEqual(10)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(15)
  })

  it('70kg, BG 7.5, predicted end 7.5, 30min aerobic → no fuel needed (in target range)', () => {
    const r = plan({
      startGlucoseMmol: 7.5,
      predictedEndMmol: 7.5,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('no-fuel')
    expect(r.preWorkout).toBeNull()
  })
})

describe('buildFuelPlan — aerobic, with top-ups (>60 min)', () => {
  it('90min aerobic → 1 top-up at 30min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic' })
    expect(r.status).toBe('fuel')
    expect(r.topUps.length).toBe(1)
    expect(r.topUps[0].atMinutes).toBe(30)
  })

  it('120min aerobic → 2 top-ups at 30 and 60min', () => {
    const r = plan({ durationMinutes: 120, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(2)
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60])
  })

  it('150min aerobic → 3 top-ups at 30, 60, 90min', () => {
    const r = plan({ durationMinutes: 150, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(3)
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60, 90])
  })

  it('60min aerobic → 0 top-ups (boundary)', () => {
    const r = plan({ durationMinutes: 60, activityType: 'aerobic' })
    expect(r.topUps).toEqual([])
  })

  it('top-up grams scale with bodyweight: 70kg → ~20g per top-up', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic', bodyweightKg: 70 })
    expect(r.topUps[0].grams).toBeGreaterThanOrEqual(15)
    expect(r.topUps[0].grams).toBeLessThanOrEqual(25)
  })
})

describe('buildFuelPlan — anaerobic', () => {
  it('BG ≥ 6 mmol/L → no-fuel status, no top-ups', () => {
    const r = plan({
      startGlucoseMmol: 7.0,
      predictedEndMmol: 6.5,
      activityType: 'anaerobic',
      durationMinutes: 30,
    })
    expect(r.status).toBe('no-fuel')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
  })

  it('BG < 6 mmol/L → fuel status with protective top-up to bring BG to ~6', () => {
    const r = plan({
      startGlucoseMmol: 5.0,
      predictedEndMmol: 4.5,
      activityType: 'anaerobic',
      durationMinutes: 30,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout).not.toBeNull()
    expect(r.preWorkout.grams).toBeGreaterThan(0)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(15)
  })

  it('anaerobic never gets mid-workout top-ups even at 90+ min', () => {
    const r = plan({
      activityType: 'anaerobic',
      durationMinutes: 120,
      startGlucoseMmol: 7.0,
    })
    expect(r.topUps).toEqual([])
  })
})

describe('buildFuelPlan — mixed', () => {
  it('mixed dose is ~60% of equivalent aerobic dose', () => {
    const inputs = {
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
      durationMinutes: 60,
      bodyweightKg: 70,
    }
    const aerobic = plan({ ...inputs, activityType: 'aerobic' })
    const mixed = plan({ ...inputs, activityType: 'mixed' })
    expect(mixed.preWorkout.grams).toBeLessThan(aerobic.preWorkout.grams)
    expect(mixed.preWorkout.grams).toBeGreaterThanOrEqual(
      Math.round(aerobic.preWorkout.grams * 0.5 / 5) * 5,
    )
  })

  it('mixed sessions DO get mid-workout top-ups for sessions > 60 min', () => {
    const r = plan({
      activityType: 'mixed',
      durationMinutes: 90,
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
    })
    expect(r.topUps.length).toBe(1)
  })
})

describe('buildFuelPlan — bodyweight scaling', () => {
  it('50kg user needs less fuel than 70kg for same prediction', () => {
    const inputs = {
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    }
    const lighter = plan({ ...inputs, bodyweightKg: 50 })
    const ref = plan({ ...inputs, bodyweightKg: 70 })
    expect(lighter.preWorkout.grams).toBeLessThanOrEqual(ref.preWorkout.grams)
  })

  it('100kg user needs more fuel than 70kg for same prediction', () => {
    const inputs = {
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    }
    const heavier = plan({ ...inputs, bodyweightKg: 100 })
    const ref = plan({ ...inputs, bodyweightKg: 70 })
    expect(heavier.preWorkout.grams).toBeGreaterThanOrEqual(ref.preWorkout.grams)
  })
})

describe('buildFuelPlan — predictedEnd projection', () => {
  it('predictedEndWithoutFuel matches the input', () => {
    const r = plan({ predictedEndMmol: 4.0 })
    expect(r.predictedEndWithoutFuel).toBe(4.0)
  })

  it('predictedEndWithFuel is higher than predictedEndWithoutFuel when fuel is recommended', () => {
    const r = plan({
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    })
    expect(r.predictedEndWithFuel).toBeGreaterThan(r.predictedEndWithoutFuel)
  })

  it('predictedEndWithFuel equals predictedEndWithoutFuel when no fuel is recommended', () => {
    const r = plan({
      startGlucoseMmol: 7.5,
      predictedEndMmol: 7.5,
      activityType: 'aerobic',
      durationMinutes: 30,
    })
    expect(r.predictedEndWithFuel).toBe(r.predictedEndWithoutFuel)
  })
})

describe('buildFuelPlan — IOB note', () => {
  it('returns iobNote when iobUnits > 0', () => {
    const r = plan({ iobUnits: 1.5 })
    expect(r.iobNote).toContain('1.5')
    expect(r.iobNote).toContain('active insulin')
  })

  it('iobNote is null when iobUnits is 0', () => {
    const r = plan({ iobUnits: 0 })
    expect(r.iobNote).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- fuelPlan.test.js`
Expected: All tests FAIL with errors like "buildFuelPlan is not a function" or "Cannot find module './fuelPlan'".

- [ ] **Step 3: Create the fuelPlan.js implementation**

Create `src/features/calculators/pre-workout-glucose/fuelPlan.js` with this exact content:

```js
// Builds a fuel plan from the prediction inputs + the prediction engine's
// end-glucose output. Pure function — no React, no state, no side effects.
//
// Spec: docs/superpowers/specs/2026-05-17-workout-fueling-redesign-design.md
// Tests: ./fuelPlan.test.js

const TARGET_MID_MMOL = 7.5
const SAFETY_FLOOR_MMOL = 5.0
const SAFETY_CEILING_MMOL = 15.0
const ANAEROBIC_FLOOR_MMOL = 6.0
const REFERENCE_WEIGHT_KG = 70

const PRE_WORKOUT_MAX_G = 60
const TOP_UP_MIN_G = 10
const TOP_UP_MAX_G = 40

const MIXED_DOSE_MULTIPLIER = 0.6
const TOP_UP_PER_KG_PER_INTERVAL = 0.3   // g/kg per 30-min interval
const TOP_UP_INTERVAL_MIN = 30

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// 5g of fast carbs raises BG by ~1 mmol/L for a 70kg adult. Scales by weight.
function gramsToCloseGap(gapMmol, weightKg) {
  if (gapMmol <= 0) return 0
  const raw = 5 * gapMmol * (weightKg / REFERENCE_WEIGHT_KG)
  return clamp(roundTo5(raw), 0, PRE_WORKOUT_MAX_G)
}

function buildTopUps(durationMinutes, weightKg, activityType) {
  if (activityType === 'anaerobic') return []
  if (durationMinutes <= 60) return []

  const perTopUpRaw = TOP_UP_PER_KG_PER_INTERVAL * weightKg
  const perTopUp = clamp(roundTo5(perTopUpRaw), TOP_UP_MIN_G, TOP_UP_MAX_G)

  const topUps = []
  for (let t = TOP_UP_INTERVAL_MIN; t < durationMinutes; t += TOP_UP_INTERVAL_MIN) {
    topUps.push({ atMinutes: t, grams: perTopUp })
  }
  return topUps
}

function buildIobNote(iobUnits) {
  if (!iobUnits || iobUnits <= 0) return null
  const formatted = Number(iobUnits).toFixed(1).replace(/\.0$/, '')
  return `You have ~${formatted}u of active insulin from a recent bolus. For future workouts at this time of day, consider reducing your pre-meal bolus by ~50% to lower hypo risk during exercise.`
}

export function buildFuelPlan({
  startGlucoseMmol,
  predictedEndMmol,
  activityType,
  durationMinutes,
  bodyweightKg,
  iobUnits,
}) {
  // Safety branch: starting BG below safe floor
  if (startGlucoseMmol < SAFETY_FLOOR_MMOL) {
    return {
      status: 'delay',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote: buildIobNote(iobUnits),
      warning:
        "Don't start your workout yet. Your BG is below 5 mmol/L. Eat 15-20g of fast-acting carbs, wait 15 minutes, then recheck. Begin only once your BG is above 5 mmol/L.",
    }
  }

  // Safety branch: starting BG above safe ceiling
  if (startGlucoseMmol > SAFETY_CEILING_MMOL) {
    return {
      status: 'high-bg-warning',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote: buildIobNote(iobUnits),
      warning:
        'Check for ketones before starting. Your BG is above 15 mmol/L. If ketones are present, follow your diabetes team\'s guidance — don\'t exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session.',
    }
  }

  const iobNote = buildIobNote(iobUnits)

  // Compute the aerobic baseline gap-to-close
  const gap = TARGET_MID_MMOL - predictedEndMmol
  const aerobicGrams = gramsToCloseGap(gap, bodyweightKg)

  let preWorkoutGrams = 0

  if (activityType === 'aerobic') {
    preWorkoutGrams = aerobicGrams
  } else if (activityType === 'mixed') {
    preWorkoutGrams = clamp(
      roundTo5(aerobicGrams * MIXED_DOSE_MULTIPLIER),
      0,
      PRE_WORKOUT_MAX_G,
    )
  } else if (activityType === 'anaerobic') {
    // Anaerobic: 0g unless starting BG is below the anaerobic floor (6.0)
    if (startGlucoseMmol < ANAEROBIC_FLOOR_MMOL) {
      const protectiveGap = ANAEROBIC_FLOOR_MMOL - startGlucoseMmol
      preWorkoutGrams = gramsToCloseGap(protectiveGap, bodyweightKg)
    }
  }

  const topUps = buildTopUps(durationMinutes, bodyweightKg, activityType)

  // Project what BG will be at workout end if user follows the recommendation
  const liftPerGram = (1 / 5) * (REFERENCE_WEIGHT_KG / bodyweightKg)
  const predictedEndWithFuel = predictedEndMmol + preWorkoutGrams * liftPerGram

  if (preWorkoutGrams === 0 && topUps.length === 0) {
    return {
      status: 'no-fuel',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel,
      iobNote,
      warning: null,
    }
  }

  return {
    status: 'fuel',
    preWorkout:
      preWorkoutGrams > 0
        ? {
            grams: preWorkoutGrams,
            timingText: activityType === 'aerobic' ? '15 minutes before you start' : '10 minutes before you start',
          }
        : null,
    topUps,
    predictedEndWithoutFuel: predictedEndMmol,
    predictedEndWithFuel,
    iobNote,
    warning: null,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- fuelPlan.test.js`
Expected: All tests PASS. If any fail, fix the implementation (not the tests) until they pass.

- [ ] **Step 5: Update PreWorkoutGlucoseCalculator.jsx to use buildFuelPlan**

Open `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`. Find the import line that brings in `gramsNeeded` (around the top of the file). It looks like:

```jsx
import { gramsNeeded } from './pre-workout-glucose/carbRecommendation'
```

Replace it with:

```jsx
import { buildFuelPlan } from './pre-workout-glucose/fuelPlan'
```

Then find the call site inside the `PredictionResults` component (around line 466 in the current code):

```jsx
const carbs = gramsNeeded(prediction.endMmol, bodyweightKg || 70)
```

Replace with:

```jsx
const fuelPlan = buildFuelPlan({
  startGlucoseMmol: prediction.startMmol,
  predictedEndMmol: prediction.endMmol,
  activityType: workoutType,
  durationMinutes: parseFloat(prediction.durationMinutes) || 30,
  bodyweightKg: bodyweightKg || 70,
  iobUnits: parseFloat(prediction.iobUnits) || 0,
})
const carbs = fuelPlan.preWorkout?.grams || 0
```

(For this task, we're just keeping the existing UI working — the result UI still shows the same single-grams recommendation. Task 3 rebuilds the result UI to use the full `fuelPlan` object.)

If `prediction.startMmol`, `prediction.durationMinutes`, or `prediction.iobUnits` are not currently on the prediction object, the implementer should add them via a quick check in `prediction.js` — those values should already be passed in, just may need to be returned in the output. If this turns out to be more complex than a quick check, STOP and report DONE_WITH_CONCERNS so the controller can scope appropriately.

- [ ] **Step 6: Delete the obsolete `carbRecommendation` files**

Run from worktree root:

```bash
git rm src/features/calculators/pre-workout-glucose/carbRecommendation.js
git rm src/features/calculators/pre-workout-glucose/carbRecommendation.test.js
```

- [ ] **Step 7: Build + test verify**

Run from worktree root:

```bash
npm run build
npm run test
```

Expected: Build exits 0 with no errors. All tests pass (existing tests + new `fuelPlan.test.js`).

- [ ] **Step 8: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/fuelPlan.js src/features/calculators/pre-workout-glucose/fuelPlan.test.js src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): add fuelPlan module (TDD) + wire into calculator

Pure function buildFuelPlan() replaces the simpler gramsNeeded() of
carbRecommendation.js. Encodes activity-type branches (aerobic / mixed
/ anaerobic), safety floors (< 5 mmol/L = delay, > 15 mmol/L = ketone
warning), the 7.0-8.0 mmol/L target range, and during-workout top-ups
for sessions > 60 min.

The calculator's UI still uses the existing PredictionResults layout
for now — only the math source has changed. Task 3 of the redesign
plan rebuilds the result UI around the full fuel plan output.

Comprehensive fuelPlan.test.js covers safety branches, activity-type
math, scheduling, bodyweight scaling, and IOB note. carbRecommendation
and its test deleted (replaced)."
```

---

## Task 2: Add Beginner/Advanced mode toggle + reorganize inputs

Spec reference: §4 (input organization), §7.2 (UI changes)

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

Add a Beginner/Advanced mode toggle at the top of the form (same pattern as the Magic Ratio calculator's mode toggle). Existing 5 essential inputs stay always-visible. The 8 advanced inputs (HR zone, insulin type, pre-workout insulin adjustment, trend arrow, sex + cycle, training status, fasted/fed, time of day, recent carbs) collapse into a single conditional `<StepCard stepNumber="A" title="Advanced refinements (optional)">` that only renders when `mode === 'advanced'`.

- [ ] **Step 1: Add the `mode` state variable**

Open `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`. Find the existing useState declarations inside `PreWorkoutGlucoseCalculatorActual()` (around line 86). Add this new useState immediately after the function's opening brace, before any other useState:

```jsx
  // Mode toggle — Beginner (default) shows the 5 essentials only; Advanced
  // reveals HR zone, insulin type, adjustment, trend, sex, training status,
  // fasted/fed, time of day, recent carbs.
  const [mode, setMode] = useState('beginner')
```

- [ ] **Step 2: Update `reset()` to reset mode**

Find the existing `reset()` function in the component. Add `setMode('beginner')` to the start of the function body. If `reset()` does not currently exist (some calculators don't have one), skip this step.

- [ ] **Step 3: Add the Mode toggle JSX before the first StepCard**

Find the JSX inside the component's return statement. Locate the first `<StepCard stepNumber={1}` (or `stepNumber="1"`). Insert this new block IMMEDIATELY BEFORE it:

```jsx
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
```

- [ ] **Step 4: Wrap advanced inputs in a conditional Advanced StepCard**

Identify the advanced inputs in the current JSX. They are:
- HR zone selector (used when `workoutType === 'aerobic'`)
- Insulin type selector (rapid vs ultra-rapid)
- Pre-workout insulin adjustment selector (none/reduce/skip)
- Trend arrow selector
- Sex + cycle expander
- Training status selector
- Fasted/fed selector
- Time of day selector
- Recent carbs expander (`hasRecentCarbs` + the conditional inputs)

These currently live inline among the other inputs. They need to be moved into a single new `<StepCard>` that only renders when `mode === 'advanced'`.

**Approach (don't try to do this all in one massive edit):**

a. Find the existing JSX block for EACH advanced input listed above. Each is typically wrapped in a `<div>` or `<label>` with a clear comment or `<label>` text.

b. Cut all of them out of their current locations.

c. Insert a NEW `<StepCard>` block in their place (collectively) — positioned AFTER the existing "essential" StepCard(s) (the ones with `stepNumber={1}` etc) and BEFORE the prediction results render. The new block looks like:

```jsx
          {/* Advanced refinements — conditional on mode === 'advanced' */}
          {mode === 'advanced' && (
            <StepCard stepNumber="A" title="Advanced refinements (optional)">
              <p className="text-white/60 text-sm mb-4">
                The more we know about you, the more accurate your fuel plan. All fields below are optional — fill in what you know.
              </p>

              {/* PASTE all the advanced input JSX blocks here, in this order:
                  1. HR Zone (if workoutType === 'aerobic')
                  2. Insulin type
                  3. Pre-workout insulin adjustment
                  4. Trend arrow
                  5. Sex (+ cycle expander when Female)
                  6. Training status
                  7. Fasted vs Fed
                  8. Time of day
                  9. Recent carbs expander
              */}
            </StepCard>
          )}
```

d. Inside that StepCard, the order of input groups should match the order listed above. Preserve all the existing onClick handlers, state references, and styling — only the placement changes.

e. If you encounter ambiguity about whether a given input is "essential" vs "advanced," default to ADVANCED. The 5 essentials are explicit (BG, activity type, duration, weight, IOB) — anything else is advanced.

If the existing JSX structure makes this restructuring genuinely difficult (e.g., nested rendering or conditional logic that can't easily be lifted), STOP and report DONE_WITH_CONCERNS so the controller can advise.

- [ ] **Step 5: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 6: Manual browser sanity check (recommended)**

Run `npm run dev`. Open `/calculators/pre-workout-glucose`. Confirm:
- The Mode toggle appears at the top with Beginner selected
- In Beginner mode, only the 5 essentials are visible (BG, activity, duration, weight, IOB) — none of the advanced inputs
- Clicking Advanced reveals the "Advanced refinements (optional)" StepCard with all 8 advanced input groups visible
- Clicking back to Beginner hides the advanced StepCard
- The advanced inputs' state values are preserved across mode toggles
- The Reset button returns Mode to Beginner

- [ ] **Step 7: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): add Beginner/Advanced mode toggle + reorganize inputs

Same pattern as Magic Ratio. Beginner mode shows 5 essentials only
(starting BG, activity type, duration, weight, IOB). Advanced mode
reveals 8 refinements in a conditional StepCard: HR zone, insulin
type, pre-workout insulin adjustment, trend arrow, sex + cycle,
training status, fasted/fed, time of day, recent carbs.

No inputs removed — purely organizational. Reset returns to Beginner."
```

---

## Task 3: Replace `PredictionResults` with `FuelPlanResults` component

Spec reference: §6 (result UI layout), §6.2 (hero block content per status)

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

The current `PredictionResults` component leads with the predicted end-glucose number and buries the fuel recommendation. The new `FuelPlanResults` component flips that: the fuel plan is the hero, predicted glucose becomes supporting context.

- [ ] **Step 1: Delete the existing `PredictionResults` function**

In `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`, find and delete the entire `PredictionResults` function (currently around lines 466–537). Also delete the call site that renders `<PredictionResults ... />` (it'll error temporarily until Step 3 replaces it).

- [ ] **Step 2: Add the new `FuelPlanResults` component**

In the same file, at the position where `PredictionResults` used to live, add this new component:

```jsx
function FuelPlanResults({ fuelPlan, prediction, glucoseUnit }) {
  const display = (mmol) =>
    glucoseUnit === 'mmol'
      ? `${formatGlucose(mmol, 'mmol')} mmol/L`
      : `${formatGlucose(mmolToMgdl(mmol), 'mgdl')} mg/dL`

  // Safety branch — overrides everything
  if (fuelPlan.status === 'delay' || fuelPlan.status === 'high-bg-warning') {
    return (
      <div className="space-y-4">
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-yellow-400">
          <p className="text-yellow-400 uppercase tracking-wider text-xs font-bold mb-2">
            {fuelPlan.status === 'delay' ? '⚠️ Don\'t start your workout yet' : '⚠️ Check for ketones before starting'}
          </p>
          <p className="text-white text-base leading-relaxed">{fuelPlan.warning}</p>
        </div>
        {fuelPlan.iobNote && (
          <p className="text-white/50 italic text-sm">{fuelPlan.iobNote}</p>
        )}
      </div>
    )
  }

  // Normal output — fuel or no-fuel
  return (
    <div className="space-y-4">
      {/* HERO — Your Fuel Plan */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Your Fuel Plan</p>
        {fuelPlan.status === 'no-fuel' ? (
          <>
            <p className="text-2xl md:text-3xl font-black text-white mb-2">
              ✅ No pre-workout fuel needed
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              Your BG is in a good starting range. Anaerobic work can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            {fuelPlan.preWorkout && (
              <p className="text-xl md:text-2xl font-bold text-white">
                💪 Eat <span className="text-da-cyan">{fuelPlan.preWorkout.grams}g</span> of fast-acting carbs {fuelPlan.preWorkout.timingText}
              </p>
            )}
            {fuelPlan.topUps.map((t, i) => (
              <p key={i} className="text-lg text-white/90">
                🔁 At {t.atMinutes} min: <span className="text-da-cyan font-bold">{t.grams}g</span> top-up
              </p>
            ))}
            {fuelPlan.preWorkout && (
              <p className="text-white/60 text-sm italic mt-3">
                Glucose tabs, juice, dextrose, or sports drink work well. {fuelPlan.topUps.length > 0 && 'Carry your top-ups with you — gels and chews are easier mid-workout.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Comparison row */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">What This Fuel Plan Does</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Without this fuel</p>
            <p className="text-2xl font-black text-white">{display(fuelPlan.predictedEndWithoutFuel)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">With this fuel</p>
            <p className="text-2xl font-black text-da-cyan">{display(fuelPlan.predictedEndWithFuel)} ✓</p>
          </div>
        </div>
      </div>

      {/* IOB context note */}
      {fuelPlan.iobNote && (
        <p className="text-white/50 italic text-sm px-2">{fuelPlan.iobNote}</p>
      )}

      {/* Why */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Why</p>
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
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">During Your Workout</p>
        <p className="text-white/70">
          Recheck your BG at 20 minutes if you feel low. If you're trending fast in either direction, adjust on the fly — these numbers are calibrated starting points, not commandments.
        </p>
      </div>

      {/* Post-workout brief */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">Post-Workout Brief</p>
        <p className="text-white/70">
          📉 Watch for a delayed glucose drop 4–6 hours after finishing — glycogen replenishment continues even after the workout ends. Recheck at 1 hour and 4 hours after stopping. Your post-workout bolus needs may be reduced by 50–75%. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to recalibrate.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update the main component to render FuelPlanResults**

In `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`, find where `PredictionResults` was being called (it errored after Step 1's deletion). Replace the old call with:

```jsx
              <FuelPlanResults
                fuelPlan={fuelPlan}
                prediction={prediction}
                glucoseUnit={glucoseUnit}
              />
```

(`fuelPlan` was already computed in Task 1 Step 5 as part of the existing logic that calls `buildFuelPlan()`. If it's currently inside `PredictionResults`, lift it out into the parent component so `FuelPlanResults` receives it as a prop.)

- [ ] **Step 4: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 5: Manual browser sanity check (full flow)**

Run `npm run dev`. Open `/calculators/pre-workout-glucose` (in a fresh private/incognito window so the opt-in gate appears). Opt in, then test these scenarios:

| Scenario | Inputs | Expected output |
|---|---|---|
| Aerobic, in target range | BG 7.5, aerobic, 30 min, 70kg, 0 IOB | "✅ No pre-workout fuel needed" hero block |
| Aerobic, needs fuel | BG 6.0, aerobic, 45 min, 70kg, 0 IOB | "💪 Eat ~20g of fast-acting carbs 15 min before" hero |
| Aerobic, long session | BG 6.5, aerobic, 90 min, 70kg, 0 IOB | Pre-workout + 1 top-up at 30 min |
| Anaerobic, in range | BG 7.0, anaerobic, 30 min, 70kg, 0 IOB | "✅ No pre-workout fuel needed" with spike warning |
| Anaerobic, low start | BG 5.0, anaerobic, 30 min, 70kg, 0 IOB | "💪 Eat ~7g" protective top-up + spike warning |
| Mixed | BG 6.0, mixed, 60 min, 70kg, 0 IOB | "💪 Eat ~12g" (smaller than aerobic) |
| Safety: low BG | BG 4.5, aerobic, 30 min, 70kg, 0 IOB | Yellow warning panel "Don't start your workout yet" — no fuel plan shown |
| Safety: high BG | BG 16.0, aerobic, 30 min, 70kg, 0 IOB | Yellow warning panel "Check for ketones before starting" — no fuel plan shown |
| With IOB | BG 6.5, aerobic, 45 min, 70kg, 2 IOB | Normal fuel plan + italic IOB note below the comparison row |
| Beginner/Advanced toggle | Toggle modes | Mode toggle works, advanced inputs hide/show as expected |

- [ ] **Step 6: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): replace PredictionResults with FuelPlanResults

The result page now leads with the fuel plan (hero block: \"Eat Xg of
fast-acting carbs Y minutes before\") instead of with a predicted
end-glucose number. Predicted glucose becomes supporting context in
the Without-fuel/With-fuel comparison row.

Safety branches render dedicated yellow warning panels for:
  - Starting BG < 5 mmol/L (delay-and-rescue)
  - Starting BG > 15 mmol/L (ketone check)

These suppress the normal fuel plan and post-workout brief.

IOB context note appears when iobUnits > 0, sourced from the
buildFuelPlan output.

Completes the Workout Fueling redesign."
```

---

# Wrap-up

After all 3 tasks complete:

1. **Diff scope:** Only `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`, plus the new `fuelPlan.js` + `fuelPlan.test.js` and the deleted `carbRecommendation.js` + `carbRecommendation.test.js`. No other files.

2. **Test suite:** `npm run test` should show all tests passing, including the new ~20 cases in `fuelPlan.test.js`.

3. **Visual QA:** Walk through the 10 scenarios listed in Task 3 Step 5. Confirm each renders the right hero block, the right comparison row, and the right safety warnings where applicable. The Beginner/Advanced toggle should feel natural — Beginner is fast (5 inputs), Advanced is comprehensive.

4. **Magic Ratio integration:** Click the "Use the Magic Ratio Calculator" link in the post-workout brief. Confirm it navigates to `/calculators/magic-ratio` correctly.

5. **OptInGate still works:** Clear localStorage in DevTools, refresh, confirm the opt-in gate appears (the redesign happens inside `PreWorkoutGlucoseCalculatorActual`, which is wrapped by `OptInGate` in the existing default export — nothing should have changed there).

---

*End of plan.*
