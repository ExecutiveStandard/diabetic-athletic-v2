# Workout Fueling — Rescue + Activity Fuel Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Implement the rescue + activity-fuel split in the existing Workout Fueling Calculator. `buildFuelPlan()` gains separate `rescue` and `activityFuel` fields in its return shape (replacing the conflated `preWorkout`); `FuelPlanResults.jsx` renders them as Step 1 / Step 2 / Step 3 with a total-carbs summary.

**Architecture:** Two tasks. Task 1 modifies the pure `fuelPlan.js` module via TDD (update tests first, then the math, then the existing calculator's consumer to use the new shape). Task 2 rewrites `FuelPlanResults.jsx` to render the three-step output and total.

**Tech Stack:** React 19 + Vite + Vitest + TailwindCSS. No new dependencies.

**Spec source-of-truth:** [`docs/superpowers/specs/2026-05-22-workout-fueling-rescue-fuel-split-design.md`](../specs/2026-05-22-workout-fueling-rescue-fuel-split-design.md)

---

## File Structure

```
src/features/calculators/
├── PreWorkoutGlucoseCalculator.jsx       # No changes — consumer continues to pass same args to buildFuelPlan
│
└── pre-workout-glucose/
    ├── fuelPlan.js                        # MODIFIED (Task 1) — new return shape
    ├── fuelPlan.test.js                   # MODIFIED (Task 1) — tests for new shape
    └── FuelPlanResults.jsx                # MODIFIED (Task 2) — three-step rendering
```

---

## Task 1: `fuelPlan.js` — split `preWorkout` into `rescue` + `activityFuel`, add `totalGrams`

Spec reference: §3, §6, §7

**Files:**
- Modify: `src/features/calculators/pre-workout-glucose/fuelPlan.js`
- Modify: `src/features/calculators/pre-workout-glucose/fuelPlan.test.js`

This is TDD: update the tests first (they will fail), then the implementation (they will pass).

- [ ] **Step 1: Update existing tests + add new tests for the new return shape**

Replace the entirety of `src/features/calculators/pre-workout-glucose/fuelPlan.test.js` with the content below. The new tests assert the new return shape (`rescue`, `activityFuel`, `totalGrams`) and remove all references to the old `preWorkout` field.

```js
import { describe, it, expect } from 'vitest'
import { buildFuelPlan } from './fuelPlan'

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

describe('buildFuelPlan — return shape', () => {
  it('returns rescue, activityFuel, topUps, totalGrams + the existing fields', () => {
    const r = plan()
    expect(r).toHaveProperty('status')
    expect(r).toHaveProperty('rescue')
    expect(r).toHaveProperty('activityFuel')
    expect(r).toHaveProperty('topUps')
    expect(r).toHaveProperty('totalGrams')
    expect(r).toHaveProperty('predictedEndWithoutFuel')
    expect(r).toHaveProperty('predictedEndWithFuel')
    expect(r).toHaveProperty('iobNote')
    expect(r).toHaveProperty('warning')
    expect(r).not.toHaveProperty('preWorkout')
  })
})

describe('buildFuelPlan — safety branches', () => {
  it('BG < 5 → delay status, no rescue, no fuel, no top-ups', () => {
    const r = plan({ startGlucoseMmol: 4.5 })
    expect(r.status).toBe('delay')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.totalGrams).toBe(0)
    expect(r.warning).toContain("Don't start your workout yet")
  })

  it('BG > 15 → high-bg-warning status, no rescue, no fuel, no top-ups', () => {
    const r = plan({ startGlucoseMmol: 16.0 })
    expect(r.status).toBe('high-bg-warning')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.totalGrams).toBe(0)
    expect(r.warning).toContain('ketones')
  })

  it('BG exactly 5.0 → fuel status (boundary on safe side)', () => {
    const r = plan({ startGlucoseMmol: 5.0, predictedEndMmol: 3.5 })
    expect(r.status).toBe('fuel')
  })
})

describe('buildFuelPlan — rescue dose (BG < 6)', () => {
  it('BG 4.9, 70kg → ~10g rescue', () => {
    const r = plan({ startGlucoseMmol: 4.9, bodyweightKg: 70 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.rescue.grams).toBeLessThanOrEqual(15)
  })

  it('BG 4.9, 87kg → ~15g rescue (heavier user, scaled up)', () => {
    const r = plan({ startGlucoseMmol: 4.9, bodyweightKg: 87 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.rescue.grams).toBeLessThanOrEqual(20)
  })

  it('BG 5.5, 70kg → ~5g rescue (smaller gap)', () => {
    const r = plan({ startGlucoseMmol: 5.5, bodyweightKg: 70 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBe(5)
  })

  it('BG 6.0 → no rescue (boundary, healthy range)', () => {
    const r = plan({ startGlucoseMmol: 6.0 })
    expect(r.rescue).toBeNull()
  })

  it('BG 7.5 → no rescue (clearly healthy)', () => {
    const r = plan({ startGlucoseMmol: 7.5 })
    expect(r.rescue).toBeNull()
  })

  it('rescue carries a note mentioning recheck in 15 min', () => {
    const r = plan({ startGlucoseMmol: 4.9 })
    expect(r.rescue.note).toContain('15 min')
  })
})

describe('buildFuelPlan — activity fuel (aerobic)', () => {
  it('70kg, 20 min aerobic → ~10g activity fuel', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 20, bodyweightKg: 70 })
    expect(r.activityFuel).not.toBeNull()
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(5)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(10)
  })

  it('70kg, 40 min aerobic → ~20g activity fuel', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 40, bodyweightKg: 70 })
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(15)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(25)
  })

  it('87kg, 40 min aerobic → ~25g activity fuel', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 40, bodyweightKg: 87 })
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(20)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(30)
  })

  it('70kg, 10 min aerobic → 5g floor (very short session still recommends small dose)', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 10, bodyweightKg: 70 })
    expect(r.activityFuel).not.toBeNull()
    expect(r.activityFuel.grams).toBe(5)
  })

  it('activity fuel capped at 40g per single pre-workout dose', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 90, bodyweightKg: 100 })
    expect(r.activityFuel.grams).toBeLessThanOrEqual(40)
  })

  it('activity fuel has timingText "10-15 min before"', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 40 })
    expect(r.activityFuel.timingText.toLowerCase()).toContain('before')
  })
})

describe('buildFuelPlan — activity fuel (mixed)', () => {
  it('mixed activityFuel is ~60% of aerobic at same duration/weight', () => {
    const aerobic = plan({ startGlucoseMmol: 7.0, durationMinutes: 60, activityType: 'aerobic', bodyweightKg: 70 })
    const mixed = plan({ startGlucoseMmol: 7.0, durationMinutes: 60, activityType: 'mixed', bodyweightKg: 70 })
    expect(mixed.activityFuel.grams).toBeLessThan(aerobic.activityFuel.grams)
    expect(mixed.activityFuel.grams).toBeGreaterThanOrEqual(15)
    expect(mixed.activityFuel.grams).toBeLessThanOrEqual(25)
  })

  it('mixed minimum dose floor is 5g for short sessions', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 15, activityType: 'mixed', bodyweightKg: 70 })
    expect(r.activityFuel.grams).toBe(5)
  })
})

describe('buildFuelPlan — anaerobic + strength', () => {
  it('anaerobic at healthy BG → no rescue, no activity fuel, no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.status).toBe('no-fuel')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.totalGrams).toBe(0)
  })

  it('anaerobic at low BG (5.0) → rescue only, no activity fuel', () => {
    const r = plan({ startGlucoseMmol: 5.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.status).toBe('fuel')
    expect(r.rescue).not.toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('strength at healthy BG → no rescue, no activity fuel, no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'strength', durationMinutes: 30 })
    expect(r.status).toBe('no-fuel')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('strength at low BG (5.0) → rescue only, no activity fuel', () => {
    const r = plan({ startGlucoseMmol: 5.0, activityType: 'strength', durationMinutes: 30 })
    expect(r.status).toBe('fuel')
    expect(r.rescue).not.toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('anaerobic never gets mid-workout top-ups even at 90+ min', () => {
    const r = plan({ activityType: 'anaerobic', durationMinutes: 120, startGlucoseMmol: 7.0 })
    expect(r.topUps).toEqual([])
  })
})

describe('buildFuelPlan — top-ups', () => {
  it('60 min aerobic → 0 top-ups (boundary)', () => {
    const r = plan({ durationMinutes: 60, activityType: 'aerobic' })
    expect(r.topUps).toEqual([])
  })

  it('90 min aerobic → 1 top-up at 30 min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(1)
    expect(r.topUps[0].atMinutes).toBe(30)
  })

  it('120 min aerobic → 2 top-ups at 30 + 60 min', () => {
    const r = plan({ durationMinutes: 120, activityType: 'aerobic' })
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60])
  })

  it('150 min aerobic → 3 top-ups at 30, 60, 90 min', () => {
    const r = plan({ durationMinutes: 150, activityType: 'aerobic' })
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60, 90])
  })

  it('mixed sessions also get top-ups for > 60 min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'mixed' })
    expect(r.topUps.length).toBe(1)
  })
})

describe('buildFuelPlan — totalGrams', () => {
  it('totalGrams = rescue + activityFuel + sum of top-ups', () => {
    const r = plan({ startGlucoseMmol: 4.9, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    const expected = (r.rescue?.grams || 0) + (r.activityFuel?.grams || 0) + r.topUps.reduce((s, t) => s + t.grams, 0)
    expect(r.totalGrams).toBe(expected)
  })

  it('totalGrams is 0 for no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.totalGrams).toBe(0)
  })

  it('totalGrams covers a complete worked example (BG 4.9, aerobic 40 min, 87kg)', () => {
    const r = plan({ startGlucoseMmol: 4.9, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(20)
    expect(r.totalGrams).toBe(r.rescue.grams + r.activityFuel.grams)
  })
})

describe('buildFuelPlan — predictedEnd projection', () => {
  it('predictedEndWithFuel matches predictedEndWithoutFuel when no fuel recommended', () => {
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, activityType: 'aerobic', durationMinutes: 30, bodyweightKg: 70 })
    if (r.status === 'no-fuel') {
      expect(r.predictedEndWithFuel).toBe(r.predictedEndWithoutFuel)
    }
  })

  it('predictedEndWithFuel is higher than predictedEndWithoutFuel when fuel was recommended', () => {
    const r = plan({ startGlucoseMmol: 4.9, predictedEndMmol: 2.3, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    expect(r.predictedEndWithFuel).toBeGreaterThan(r.predictedEndWithoutFuel)
  })
})

describe('buildFuelPlan — IOB note', () => {
  it('iobNote present when iobUnits > 0', () => {
    const r = plan({ iobUnits: 1.5 })
    expect(r.iobNote).toContain('1.5')
  })

  it('iobNote is null when iobUnits is 0', () => {
    const r = plan({ iobUnits: 0 })
    expect(r.iobNote).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — they should fail (new shape not implemented yet)**

Run: `npm run test -- fuelPlan.test.js`
Expected: many failures complaining about `r.rescue` and `r.activityFuel` being undefined.

- [ ] **Step 3: Update `fuelPlan.js` to produce the new shape**

Replace the entirety of `src/features/calculators/pre-workout-glucose/fuelPlan.js` with this exact content:

```js
// Builds a fuel plan from the prediction inputs + the prediction engine's
// end-glucose output. Pure function — no React, no state, no side effects.
//
// Output shape splits the recommendation into:
//   rescue      — carbs needed NOW to bring BG into safe pre-workout range
//   activityFuel — carbs needed to power the workout itself
//   topUps      — mid-workout top-ups for sessions > 60 min
//   totalGrams  — sum of all of the above
//
// Spec: docs/superpowers/specs/2026-05-22-workout-fueling-rescue-fuel-split-design.md
// Tests: ./fuelPlan.test.js

const TARGET_RESCUE_MMOL = 7.0
const RESCUE_FLOOR_MMOL = 6.0
const SAFETY_FLOOR_MMOL = 5.0
const SAFETY_CEILING_MMOL = 15.0
const ANAEROBIC_FLOOR_MMOL = 6.0
const REFERENCE_WEIGHT_KG = 70

const RESCUE_MIN_G = 5
const RESCUE_MAX_G = 25
const ACTIVITY_FUEL_MIN_G = 5
const ACTIVITY_FUEL_MAX_G = 40
const TOP_UP_MIN_G = 10
const TOP_UP_MAX_G = 40

const ACTIVITY_FUEL_PER_KG_PER_HOUR = 0.4
const MIXED_ACTIVITY_MULTIPLIER = 0.6
const TOP_UP_PER_KG_PER_INTERVAL = 0.3
const TOP_UP_INTERVAL_MIN = 30

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function gramsToCloseGap(gapMmol, weightKg) {
  if (gapMmol <= 0) return 0
  return 5 * gapMmol * (weightKg / REFERENCE_WEIGHT_KG)
}

function buildRescue(startGlucoseMmol, weightKg) {
  if (startGlucoseMmol >= RESCUE_FLOOR_MMOL) return null
  const gap = TARGET_RESCUE_MMOL - startGlucoseMmol
  const raw = gramsToCloseGap(gap, weightKg)
  const grams = clamp(roundTo5(raw), RESCUE_MIN_G, RESCUE_MAX_G)
  return {
    grams,
    note: `Recheck in 15 min. Wait until you're at 6.5 mmol/L or higher before starting.`,
  }
}

function buildActivityFuel(activityType, durationMinutes, weightKg) {
  if (activityType === 'anaerobic' || activityType === 'strength') return null
  if (!durationMinutes || durationMinutes <= 0) return null

  const base = ACTIVITY_FUEL_PER_KG_PER_HOUR * weightKg * (durationMinutes / 60)
  const adjusted = activityType === 'mixed' ? base * MIXED_ACTIVITY_MULTIPLIER : base
  const grams = clamp(roundTo5(adjusted), ACTIVITY_FUEL_MIN_G, ACTIVITY_FUEL_MAX_G)
  return {
    grams,
    timingText: '10–15 min before you start',
  }
}

function buildTopUps(durationMinutes, weightKg, activityType) {
  if (activityType === 'anaerobic' || activityType === 'strength') return []
  if (durationMinutes <= 60) return []

  const perTopUpRaw = TOP_UP_PER_KG_PER_INTERVAL * weightKg
  const perTopUp = clamp(roundTo5(perTopUpRaw), TOP_UP_MIN_G, TOP_UP_MAX_G)

  const topUps = []
  for (let t = TOP_UP_INTERVAL_MIN; t <= durationMinutes - 60; t += TOP_UP_INTERVAL_MIN) {
    topUps.push({ atMinutes: t, grams: perTopUp })
  }
  return topUps
}

function buildIobNote(iobUnits) {
  if (!iobUnits || iobUnits <= 0) return null
  const formatted = Number(iobUnits).toFixed(1).replace(/\.0$/, '')
  return `You have ~${formatted}u of active insulin from a recent bolus. For future workouts at this time of day, consider reducing your pre-meal bolus by ~50% to lower hypo risk during exercise.`
}

function computeTotal(rescue, activityFuel, topUps) {
  const r = rescue?.grams || 0
  const f = activityFuel?.grams || 0
  const t = topUps.reduce((s, tu) => s + tu.grams, 0)
  return r + f + t
}

export function buildFuelPlan({
  startGlucoseMmol,
  predictedEndMmol,
  activityType,
  durationMinutes,
  bodyweightKg,
  iobUnits,
}) {
  const iobNote = buildIobNote(iobUnits)

  if (startGlucoseMmol < SAFETY_FLOOR_MMOL) {
    return {
      status: 'delay',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote,
      warning:
        "Don't start your workout yet. Your BG is below 5 mmol/L. Eat 15-20g of fast-acting carbs, wait 15 minutes, then recheck. Begin only once your BG is above 5 mmol/L.",
    }
  }

  if (startGlucoseMmol > SAFETY_CEILING_MMOL) {
    return {
      status: 'high-bg-warning',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote,
      warning:
        'Check for ketones before starting. Your BG is above 15 mmol/L. If ketones are present, follow your diabetes team\'s guidance — don\'t exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session.',
    }
  }

  const rescue = buildRescue(startGlucoseMmol, bodyweightKg)
  const activityFuel = buildActivityFuel(activityType, durationMinutes, bodyweightKg)
  const topUps = buildTopUps(durationMinutes, bodyweightKg, activityType)
  const totalGrams = computeTotal(rescue, activityFuel, topUps)

  // Predicted-end projection: model what BG will be at workout end if user
  // follows the activityFuel + topUps plan. The rescue dose just brings them
  // to start in range; it doesn't change the trajectory through the workout.
  const liftPerGram = (1 / 5) * (REFERENCE_WEIGHT_KG / bodyweightKg)
  const activeFuelGrams = (activityFuel?.grams || 0) + topUps.reduce((s, t) => s + t.grams, 0)
  const predictedEndWithFuel = predictedEndMmol + activeFuelGrams * liftPerGram

  if (totalGrams === 0) {
    return {
      status: 'no-fuel',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel,
      iobNote,
      warning: null,
    }
  }

  return {
    status: 'fuel',
    rescue,
    activityFuel,
    topUps,
    totalGrams,
    predictedEndWithoutFuel: predictedEndMmol,
    predictedEndWithFuel,
    iobNote,
    warning: null,
  }
}
```

- [ ] **Step 4: Run tests — they should now pass**

Run: `npm run test -- fuelPlan.test.js`
Expected: all tests pass (~30 tests). If any fail, fix the implementation, not the tests.

- [ ] **Step 5: Update `PreWorkoutGlucoseCalculator.jsx` consumer**

The component currently reads `fuelPlan?.preWorkout?.grams || 0`. That field no longer exists. Search the file for any references to `fuelPlan.preWorkout` and replace them. The cleanest path is to remove the local consumer entirely — `FuelPlanResults` now takes the whole `fuelPlan` object and reads what it needs.

Specifically:
- Find any line like `const carbs = fuelPlan?.preWorkout?.grams || 0` and delete it (it's likely unused after the refactor).
- The `<FuelPlanResults fuelPlan={fuelPlan} prediction={prediction} glucoseUnit={glucoseUnit} activityType={workoutType} />` call site stays the same — props are unchanged.

- [ ] **Step 6: Build + full test verify**

Run from worktree root:
```bash
npm run build
npm run test
```
Expected: Build clean. All tests pass (the new fuelPlan.test.js suite plus the existing 100+ tests in other modules).

- [ ] **Step 7: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/fuelPlan.js src/features/calculators/pre-workout-glucose/fuelPlan.test.js src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): split preWorkout into rescue + activityFuel + total

buildFuelPlan() return shape changes:
  - preWorkout (single dose) → REMOVED
  - rescue: carbs to bring BG into safe pre-workout range when start
    is below 6 mmol/L. Formula: 5g × (7.0 - startBG) × (weight/70),
    clamped 5-25g. null when BG already healthy.
  - activityFuel: carbs to power the workout itself. Formula:
    0.4 × weight × (duration_min / 60) for aerobic, ×0.6 for mixed,
    null for anaerobic + strength. Minimum 5g floor so very short
    sessions still get a small dose. Clamped 5-40g.
  - totalGrams: sum of rescue + activityFuel + all top-ups.

Anaerobic + strength only get rescue (no activity fuel) and never
get mid-workout top-ups, matching existing physiology branches.

FuelPlanResults UI consumes the new shape in Task 2 of this plan.
Test suite rewritten to cover the three-step output and total."
```

---

## Task 2: `FuelPlanResults.jsx` — render the three-step output + total

Spec reference: §3 (output structure), §8 (UI layout)

**Files:**
- Modify: `src/features/calculators/pre-workout-glucose/FuelPlanResults.jsx`

Replace the existing hero block content with a three-step rendering. Steps 1, 2, 3 each render only when their corresponding field is non-null/non-empty. A total-carbs summary line appears at the bottom when at least one component fires.

- [ ] **Step 1: Update `FuelPlanResults.jsx`**

Open `src/features/calculators/pre-workout-glucose/FuelPlanResults.jsx`. Find the normal-branch hero block. Replace the inner content with the three-step structure below. (Keep the safety branch and the panels BELOW the hero — comparison row, IOB note, Why, During, Post-Workout brief — exactly as they are.)

The hero block's `{fuelPlan.status === 'no-fuel' ? ... : ...}` ternary changes. Replace it with:

```jsx
        {fuelPlan.status === 'no-fuel' ? (
          <>
            <p className="text-2xl md:text-3xl font-black text-white mb-2">
              ✅ No pre-workout fuel needed
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              {{
                aerobic: "Your BG is in a good starting range. You should be able to complete your aerobic session without pre-workout fuel — recheck at 20 minutes if you feel low, and have 15g of fast carbs on hand just in case.",
                mixed: "Your BG is in a good starting range. Mixed sessions can swing in either direction — recheck at the halfway point and top up with 10–15g if you've dropped to 5 mmol/L or lower.",
                anaerobic: "Your BG is in a good starting range. Anaerobic work can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.",
                strength: "Your BG is in a good starting range. Strength training can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.",
              }[activityType] || "Your BG is in a good starting range. Recheck at 20 minutes if you feel low, and have 15g of fast carbs on hand just in case."}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            {/* STEP 1 — Rescue */}
            {fuelPlan.rescue && (
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  💉 Eat <span className="text-da-cyan">{fuelPlan.rescue.grams}g</span> of fast carbs now
                </p>
                <p className="text-white/70 text-sm mt-1">{fuelPlan.rescue.note}</p>
                <p className="text-white/50 text-xs italic mt-2">
                  Don't know your insulin ratios yet?{' '}
                  <Link to="/calculators/magic-ratio" className="text-da-cyan underline">
                    Use the Magic Ratio Calculator
                  </Link>{' '}
                  to find them — they'll personalize this even further.
                </p>
              </div>
            )}

            {/* STEP 2 — Activity fuel */}
            {fuelPlan.activityFuel && (
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  💪{' '}
                  {fuelPlan.rescue ? 'Once you\'re in range, eat ' : 'Eat '}
                  <span className="text-da-cyan">{fuelPlan.activityFuel.grams}g</span>
                  {fuelPlan.rescue ? ' to fuel the workout itself' : ` of fast-acting carbs ${fuelPlan.activityFuel.timingText} to fuel the workout`}
                </p>
                <p className="text-white/60 text-sm italic mt-1">
                  Glucose tabs, juice, dextrose, banana, sports drink — anything that absorbs fast.
                </p>
              </div>
            )}

            {/* STEP 3 — Top-ups during workout */}
            {fuelPlan.topUps.length > 0 && (
              <div className="space-y-1">
                {fuelPlan.topUps.map((t, i) => (
                  <p key={i} className="text-lg text-white/90">
                    🔁 At {t.atMinutes} min: <span className="text-da-cyan font-bold">{t.grams}g</span> top-up
                  </p>
                ))}
                <p className="text-white/60 text-sm italic mt-1">
                  Carry your top-ups with you — gels and chews are easier mid-workout.
                </p>
              </div>
            )}

            {/* TOTAL — only shown when at least one component fired */}
            {fuelPlan.totalGrams > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-white/90 font-bold">
                  Total carbs for this workout: <span className="text-da-cyan">{fuelPlan.totalGrams}g</span>
                  {(() => {
                    const parts = []
                    if (fuelPlan.rescue) parts.push(`${fuelPlan.rescue.grams}g rescue`)
                    if (fuelPlan.activityFuel) parts.push(`${fuelPlan.activityFuel.grams}g activity fuel`)
                    if (fuelPlan.topUps.length > 0) {
                      const topUpSum = fuelPlan.topUps.reduce((s, t) => s + t.grams, 0)
                      parts.push(`${topUpSum}g in top-ups`)
                    }
                    return parts.length > 1 ? ` (${parts.join(' + ')})` : ''
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
```

The rest of `FuelPlanResults.jsx` (safety branch above, comparison row + Why + During + Post-Workout below) stays unchanged.

- [ ] **Step 2: Build verify**

Run from worktree root: `npm run build`
Expected: clean build.

- [ ] **Step 3: Test verify**

Run: `npm run test`
Expected: all tests still pass (no test changes needed for this UI-only task).

- [ ] **Step 4: Manual browser check (recommended)**

Run `npm run dev`. Test the worked example from the spec:
- BG 4.9, aerobic, 40 min, 87kg, IOB 0
- Expected hero: Step 1 rescue (10-15g), Step 2 activity fuel (~25g), Total ~35-40g

Also try:
- BG 7.0, aerobic, 20 min, 70kg → no rescue, ~10g activity fuel, total 10g
- BG 5.5, aerobic, 40 min, 70kg → 5g rescue, ~20g activity fuel, total 25g
- BG 7.0, anaerobic, 30 min, 70kg → "✅ No pre-workout fuel needed"
- BG 6.5, aerobic, 90 min, 70kg → activity fuel + 1 top-up at 30 min

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/FuelPlanResults.jsx
git commit -m "feat(workout-fueling): render rescue + activity-fuel + total in three steps

FuelPlanResults' hero block now renders up to three distinct steps:

  1. 💉 Eat Xg of fast carbs now (rescue) — only when starting BG
     was low enough to need a top-up to safe range. Includes a small
     note pointing users without established insulin ratios to the
     Magic Ratio Calculator.

  2. 💪 Once you're in range, eat Yg to fuel the workout itself
     (activity fuel) — always for aerobic/mixed, skipped for
     anaerobic/strength.

  3. 🔁 At M min: Zg top-up (one row per top-up) — for sessions
     longer than 60 min.

Plus a Total carbs summary line at the bottom that shows the sum
and a breakdown (e.g. '40g (15g rescue + 25g activity fuel)').

Implements rescue+fuel split spec §3 and §8."
```

---

# Wrap-up

After both tasks complete:

1. `npm run test` — all tests pass
2. `npm run build` — clean
3. Visual QA in browser using the 5 scenarios from Task 2 Step 4
4. Push to GitHub → Cloudflare auto-rebuild → smoke-check the preview URL

---

*End of plan.*
