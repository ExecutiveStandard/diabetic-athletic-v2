# Two New Calculator Lead Magnets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two new interactive lead-magnet calculators on `/free-resources` — a Pre-Workout Glucose Target Predictor and a Meal Frequency & Macro Distributor — both matching the existing 4-calculator pattern (no email gate, client-side, brand-consistent).

**Architecture:** Each calculator is a single React component file in `src/features/calculators/` (matching existing pattern) with pure-logic helpers extracted into a sibling subdirectory (`pre-workout-glucose/` and `meal-frequency/`) so the math can be unit-tested in isolation. All state is local React state — no Zustand, no Firestore in v1. Vitest is added for unit testing.

**Tech Stack:** React 19 + Vite + TailwindCSS + React Router (already configured). Adding: Vitest + @testing-library/react + jsdom.

**Spec source-of-truth:** `docs/superpowers/specs/2026-05-11-two-new-calculators-design.md`

**Phases:**
- **Phase 0** — Test infrastructure (Vitest)
- **Phase 1** — Pre-Workout Glucose Target Predictor (independently shippable after this phase)
- **Phase 2** — Meal Frequency & Macro Distributor (independently shippable after this phase)

---

## File Structure

```
src/features/calculators/
├── PreWorkoutGlucoseCalculator.jsx       # NEW — Phase 1 component
├── MealFrequencyCalculator.jsx           # NEW — Phase 2 component
├── pre-workout-glucose/                  # NEW — Phase 1 pure-logic helpers
│   ├── units.js
│   ├── units.test.js
│   ├── riskBands.js
│   ├── riskBands.test.js
│   ├── carbRecommendation.js
│   ├── carbRecommendation.test.js
│   ├── iobDecay.js
│   ├── iobDecay.test.js
│   ├── prediction.js
│   └── prediction.test.js
├── meal-frequency/                       # NEW — Phase 2 pure-logic helpers
│   ├── slotAssignment.js
│   ├── slotAssignment.test.js
│   ├── distribution.js                   # peri-weighted macro distribution
│   ├── distribution.test.js
│   ├── mealCount.js                      # defaults + smart bump suggestion
│   ├── mealCount.test.js
│   ├── planner.js                        # orchestrator
│   └── planner.test.js
├── CalorieCalculator.jsx                 # existing — untouched
├── CardioCalculator.jsx                  # existing — untouched
├── InsulinCalculator.jsx                 # existing — untouched
└── ProteinCalculator.jsx                 # existing — untouched

src/pages/
└── FreeResourcesPage.jsx                 # MODIFIED — append 2 calculators to array

src/App.jsx                               # MODIFIED — add 2 routes

vite.config.js                            # MODIFIED — add test config
package.json                              # MODIFIED — add vitest scripts + devDeps
```

---

# Phase 0 — Test Infrastructure

## Task 0.1: Install Vitest and configure

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/test-setup.js`

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: 5 packages added to `devDependencies` in `package.json`. No vulnerabilities reported.

- [ ] **Step 2: Add test scripts to `package.json`**

In `package.json`, add to the `scripts` block (alongside existing `dev`, `build`, `preview`):

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 3: Update `vite.config.js` with test config**

Replace the contents of `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    strictPort: false
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    css: false,
  },
})
```

- [ ] **Step 4: Create test-setup file**

Create `src/test-setup.js` with:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add a smoke test to verify Vitest works**

Create `src/test-setup.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run the smoke test**

Run: `npm test`
Expected: `✓ Vitest setup > runs tests`, 1 passed.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js src/test-setup.js src/test-setup.test.js
git commit -m "test: add Vitest + React Testing Library setup"
```

---

# Phase 1 — Pre-Workout Glucose Target Predictor

> After this phase, `/calculators/pre-workout-glucose` is live and the calculator is the 5th card on `/free-resources`.

## Task 1.1: Unit conversions (`units.js`)

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/units.js`
- Create: `src/features/calculators/pre-workout-glucose/units.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/pre-workout-glucose/units.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mmolToMgdl, mgdlToMmol, formatGlucose } from './units'

describe('mmolToMgdl', () => {
  it('converts 5.5 mmol/L to 99 mg/dL', () => {
    expect(mmolToMgdl(5.5)).toBe(99)
  })
  it('converts 10.0 mmol/L to 180 mg/dL', () => {
    expect(mmolToMgdl(10.0)).toBe(180)
  })
  it('rounds to nearest integer', () => {
    expect(mmolToMgdl(7.1)).toBe(128)
  })
})

describe('mgdlToMmol', () => {
  it('converts 100 mg/dL to 5.6 mmol/L', () => {
    expect(mgdlToMmol(100)).toBeCloseTo(5.6, 1)
  })
  it('converts 180 mg/dL to 10.0 mmol/L', () => {
    expect(mgdlToMmol(180)).toBeCloseTo(10.0, 1)
  })
})

describe('formatGlucose', () => {
  it('formats mmol/L to 1 decimal', () => {
    expect(formatGlucose(5.55, 'mmol')).toBe('5.6')
  })
  it('formats mg/dL as integer', () => {
    expect(formatGlucose(99.7, 'mgdl')).toBe('100')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/features/calculators/pre-workout-glucose/units.test.js`
Expected: FAIL — "Cannot find module './units'"

- [ ] **Step 3: Implement the module**

Create `src/features/calculators/pre-workout-glucose/units.js`:

```js
// 1 mmol/L = 18 mg/dL (standard conversion factor)
export function mmolToMgdl(mmol) {
  return Math.round(mmol * 18)
}

export function mgdlToMmol(mgdl) {
  return mgdl / 18
}

export function formatGlucose(value, unit) {
  if (unit === 'mgdl') return Math.round(value).toString()
  return value.toFixed(1)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/features/calculators/pre-workout-glucose/units.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/units.js src/features/calculators/pre-workout-glucose/units.test.js
git commit -m "feat(pre-workout-glucose): add glucose unit conversion helpers"
```

---

## Task 1.2: Risk bands (`riskBands.js`)

Spec reference: §3.3

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/riskBands.js`
- Create: `src/features/calculators/pre-workout-glucose/riskBands.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/pre-workout-glucose/riskBands.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { bandFor, BANDS } from './riskBands'

describe('bandFor (mmol/L input)', () => {
  it('returns severe-hypo for glucose < 3.3', () => {
    expect(bandFor(3.0).id).toBe('severe-hypo')
  })
  it('returns hypo-risk for 3.3–4.5', () => {
    expect(bandFor(4.0).id).toBe('hypo-risk')
  })
  it('returns ideal for 4.5–9.0', () => {
    expect(bandFor(6.0).id).toBe('ideal')
  })
  it('returns acceptable-hyper for 9.0–13.9', () => {
    expect(bandFor(11.0).id).toBe('acceptable-hyper')
  })
  it('returns hyper-risk for 13.9–16.7', () => {
    expect(bandFor(15.0).id).toBe('hyper-risk')
  })
  it('returns ketone-danger for > 16.7', () => {
    expect(bandFor(18.0).id).toBe('ketone-danger')
  })
  it('boundary: 3.3 is hypo-risk (not severe-hypo)', () => {
    expect(bandFor(3.3).id).toBe('hypo-risk')
  })
  it('boundary: 4.5 is ideal', () => {
    expect(bandFor(4.5).id).toBe('ideal')
  })
})

describe('BANDS', () => {
  it('exports all 6 bands', () => {
    expect(Object.keys(BANDS).length).toBe(6)
  })
  it('each band has a color and action', () => {
    Object.values(BANDS).forEach((band) => {
      expect(band.color).toBeTruthy()
      expect(band.action).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/features/calculators/pre-workout-glucose/riskBands.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `src/features/calculators/pre-workout-glucose/riskBands.js`:

```js
// All thresholds in mmol/L. Boundaries are inclusive on the lower end.
export const BANDS = {
  'severe-hypo': {
    id: 'severe-hypo',
    label: 'Severe Hypo',
    color: '#E74C3C', // red
    range: { min: -Infinity, max: 3.3 },
    action: 'DO NOT START — treat low first',
  },
  'hypo-risk': {
    id: 'hypo-risk',
    label: 'Hypo Risk',
    color: '#F39C12', // orange
    range: { min: 3.3, max: 4.5 },
    action: 'Consume 15–30g fast carbs now and recheck in 15 min',
  },
  ideal: {
    id: 'ideal',
    label: 'Ideal',
    color: '#46C0ED', // brand cyan
    range: { min: 4.5, max: 9.0 },
    action: 'Cleared to start',
  },
  'acceptable-hyper': {
    id: 'acceptable-hyper',
    label: 'Acceptable Hyper',
    color: '#FCC826', // brand gold
    range: { min: 9.0, max: 13.9 },
    action: 'OK to start — recheck at 30 min',
  },
  'hyper-risk': {
    id: 'hyper-risk',
    label: 'Hyper Risk',
    color: '#F39C12',
    range: { min: 13.9, max: 16.7 },
    action: 'Consider correcting before starting',
  },
  'ketone-danger': {
    id: 'ketone-danger',
    label: 'Danger — Check Ketones',
    color: '#E74C3C',
    range: { min: 16.7, max: Infinity },
    action: 'Check ketones — postpone if ketones present',
  },
}

export function bandFor(glucoseMmol) {
  for (const band of Object.values(BANDS)) {
    if (glucoseMmol >= band.range.min && glucoseMmol < band.range.max) {
      return band
    }
  }
  return BANDS['ketone-danger']
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test src/features/calculators/pre-workout-glucose/riskBands.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/riskBands.js src/features/calculators/pre-workout-glucose/riskBands.test.js
git commit -m "feat(pre-workout-glucose): add risk band classification"
```

---

## Task 1.3: Carb recommendation logic (`carbRecommendation.js`)

Spec reference: §3.4

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/carbRecommendation.js`
- Create: `src/features/calculators/pre-workout-glucose/carbRecommendation.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/pre-workout-glucose/carbRecommendation.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { gramsNeeded } from './carbRecommendation'

describe('gramsNeeded', () => {
  it('returns 0 when predicted is already at or above 4.5 mmol/L', () => {
    expect(gramsNeeded(5.0, 70)).toBe(0)
    expect(gramsNeeded(4.5, 70)).toBe(0)
  })
  it('recommends carbs for hypo-risk prediction (4.0 mmol/L, 70kg)', () => {
    // target = 5.5; gap = 1.5 mmol/L; 1.5 × 5 × (70/70) = 7.5 → clamped to 10
    expect(gramsNeeded(4.0, 70)).toBe(10)
  })
  it('recommends more carbs for lower prediction (3.0 mmol/L, 70kg)', () => {
    // target = 5.5; gap = 2.5; 2.5 × 5 × 1 = 12.5 → rounded to 15
    expect(gramsNeeded(3.0, 70)).toBe(15)
  })
  it('scales with body weight (3.0 mmol/L, 100kg)', () => {
    // gap = 2.5; 2.5 × 5 × (100/70) = 17.86 → round to 20
    expect(gramsNeeded(3.0, 100)).toBe(20)
  })
  it('clamps minimum to 10g', () => {
    expect(gramsNeeded(4.4, 70)).toBeGreaterThanOrEqual(10)
  })
  it('clamps maximum to 60g', () => {
    expect(gramsNeeded(1.0, 120)).toBeLessThanOrEqual(60)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test src/features/calculators/pre-workout-glucose/carbRecommendation.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/calculators/pre-workout-glucose/carbRecommendation.js`:

```js
const TARGET_MMOL = 5.5
const REFERENCE_WEIGHT_KG = 70
const MIN_GRAMS = 10
const MAX_GRAMS = 60

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

export function gramsNeeded(predictedMmol, bodyweightKg) {
  if (predictedMmol >= 4.5) return 0
  const gap = TARGET_MMOL - predictedMmol
  const weightFactor = bodyweightKg / REFERENCE_WEIGHT_KG
  const raw = gap * 5 * weightFactor
  const rounded = roundTo5(raw)
  return Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, rounded))
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test src/features/calculators/pre-workout-glucose/carbRecommendation.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/carbRecommendation.js src/features/calculators/pre-workout-glucose/carbRecommendation.test.js
git commit -m "feat(pre-workout-glucose): add carb recommendation logic"
```

---

## Task 1.4: IOB linear decay helper (`iobDecay.js`)

Spec reference: §3.1.1

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/iobDecay.js`
- Create: `src/features/calculators/pre-workout-glucose/iobDecay.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/pre-workout-glucose/iobDecay.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeIob, DIA_MINUTES } from './iobDecay'

describe('DIA_MINUTES', () => {
  it('rapid is 240 min', () => {
    expect(DIA_MINUTES.rapid).toBe(240)
  })
  it('ultra is 210 min', () => {
    expect(DIA_MINUTES.ultra).toBe(210)
  })
})

describe('computeIob', () => {
  it('returns full bolus at 0 minutes elapsed', () => {
    expect(computeIob(5, 0, 'rapid')).toBe(5)
  })
  it('returns 0 when elapsed >= DIA (rapid, 240+ min)', () => {
    expect(computeIob(5, 240, 'rapid')).toBe(0)
    expect(computeIob(5, 300, 'rapid')).toBe(0)
  })
  it('returns half at half DIA (rapid, 120 min)', () => {
    expect(computeIob(5, 120, 'rapid')).toBeCloseTo(2.5, 2)
  })
  it('returns 25% at 75% DIA (rapid, 180 min)', () => {
    expect(computeIob(5, 180, 'rapid')).toBeCloseTo(1.25, 2)
  })
  it('uses ultra-rapid DIA when type=ultra', () => {
    // 105 min = 50% of 210 → half remaining
    expect(computeIob(4, 105, 'ultra')).toBeCloseTo(2.0, 2)
  })
  it('clamps negative elapsed to 0', () => {
    expect(computeIob(5, -30, 'rapid')).toBe(5)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/pre-workout-glucose/iobDecay.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/pre-workout-glucose/iobDecay.js`:

```js
export const DIA_MINUTES = {
  rapid: 240,
  ultra: 210,
}

export function computeIob(bolusUnits, elapsedMinutes, insulinType) {
  const dia = DIA_MINUTES[insulinType] || DIA_MINUTES.rapid
  const elapsed = Math.max(0, elapsedMinutes)
  if (elapsed >= dia) return 0
  return bolusUnits * (1 - elapsed / dia)
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/pre-workout-glucose/iobDecay.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/iobDecay.js src/features/calculators/pre-workout-glucose/iobDecay.test.js
git commit -m "feat(pre-workout-glucose): add IOB linear decay helper"
```

---

## Task 1.5: Prediction core (`prediction.js`)

Spec reference: §3.2 (formula). This is the largest pure-logic module.

**Files:**
- Create: `src/features/calculators/pre-workout-glucose/prediction.js`
- Create: `src/features/calculators/pre-workout-glucose/prediction.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/pre-workout-glucose/prediction.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { predictEndGlucose } from './prediction'

// Helper: standard input shape
const baseInput = {
  startMmol: 7.0,
  trendArrow: 'flat',          // ↑↑ / up / flat / down / ↓↓
  workoutType: 'aerobic',      // aerobic / anaerobic / mixed / strength
  intensity: 5,                // 1-10 RPE
  durationMin: 45,
  iobUnits: 0,
  recentCarbs: { grams: 0, minutesAgo: 0 },
  bodyweightKg: 70,
  timeOfDay: 'midday',         // morning / midday / evening
}

describe('predictEndGlucose — basic aerobic scenarios', () => {
  it('moderate aerobic, no IOB, flat trend, no recent carbs → drops glucose', () => {
    const result = predictEndGlucose({ ...baseInput, workoutType: 'aerobic', intensity: 5, durationMin: 45 })
    // base_rate(aerobic, mod) = -0.060; over 45 min = -2.7 mmol/L
    // No other contributions → end = 7.0 + (-2.7) = 4.3
    expect(result.endMmol).toBeCloseTo(4.3, 1)
    expect(result.deltaMmol).toBeCloseTo(-2.7, 1)
  })

  it('hard aerobic with IOB amplifies drop', () => {
    const result = predictEndGlucose({
      ...baseInput,
      workoutType: 'aerobic',
      intensity: 7,
      durationMin: 60,
      iobUnits: 1.0,
    })
    // Combined effect (base aerobic drop + IOB amplification) should produce
    // an end-glucose well below the starting glucose.
    expect(result.endMmol).toBeLessThan(baseInput.startMmol)
    expect(result.deltaMmol).toBeLessThan(-3.0)
  })
})

describe('predictEndGlucose — anaerobic scenarios', () => {
  it('hard anaerobic raises glucose', () => {
    const result = predictEndGlucose({
      ...baseInput,
      workoutType: 'anaerobic',
      intensity: 8,
      durationMin: 30,
    })
    // base_rate(anaerobic, hard) = +0.040; 30 min × 0.040 = +1.2
    expect(result.deltaMmol).toBeGreaterThan(0.5)
  })
})

describe('predictEndGlucose — CGM trend contribution', () => {
  it('falling-fast arrow drops further', () => {
    const flat = predictEndGlucose({ ...baseInput })
    const falling = predictEndGlucose({ ...baseInput, trendArrow: 'doubleDown' })
    expect(falling.endMmol).toBeLessThan(flat.endMmol)
  })
  it('rising-fast arrow drops less', () => {
    const flat = predictEndGlucose({ ...baseInput })
    const rising = predictEndGlucose({ ...baseInput, trendArrow: 'doubleUp' })
    expect(rising.endMmol).toBeGreaterThan(flat.endMmol)
  })
})

describe('predictEndGlucose — recent carb contribution', () => {
  it('recent carbs offset some glucose drop', () => {
    const noCarbs = predictEndGlucose({ ...baseInput })
    const withCarbs = predictEndGlucose({
      ...baseInput,
      recentCarbs: { grams: 30, minutesAgo: 15 },
    })
    expect(withCarbs.endMmol).toBeGreaterThan(noCarbs.endMmol)
  })
  it('carbs older than 90 min contribute nothing', () => {
    const a = predictEndGlucose({ ...baseInput })
    const b = predictEndGlucose({ ...baseInput, recentCarbs: { grams: 30, minutesAgo: 120 } })
    expect(b.endMmol).toBeCloseTo(a.endMmol, 1)
  })
})

describe('predictEndGlucose — output shape', () => {
  it('returns endMmol, deltaMmol, and a non-empty breakdown', () => {
    const result = predictEndGlucose(baseInput)
    expect(typeof result.endMmol).toBe('number')
    expect(typeof result.deltaMmol).toBe('number')
    expect(Array.isArray(result.breakdown)).toBe(true)
    expect(result.breakdown.length).toBeGreaterThan(0)
  })
  it('breakdown items have label and delta', () => {
    const result = predictEndGlucose(baseInput)
    result.breakdown.forEach((item) => {
      expect(item.label).toBeTruthy()
      expect(typeof item.delta).toBe('number')
    })
  })
  it('clamps endMmol to [1.5, 30.0]', () => {
    const veryLow = predictEndGlucose({
      ...baseInput,
      startMmol: 3.0,
      workoutType: 'aerobic',
      intensity: 10,
      durationMin: 180,
      iobUnits: 5,
    })
    expect(veryLow.endMmol).toBeGreaterThanOrEqual(1.5)
  })
})
```

- [ ] **Step 2: Verify all tests fail**

Run: `npm test src/features/calculators/pre-workout-glucose/prediction.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/calculators/pre-workout-glucose/prediction.js`:

```js
// All coefficients are v1 starting values drawn from Riddell 2017 / EXTOD / ADA.
// They are expected to be refined based on real-world feedback.

const BASE_RATE_PER_MIN = {
  aerobic:   { easy: -0.025, moderate: -0.060, hard: -0.080, veryHard: -0.090 },
  anaerobic: { easy:  0.000, moderate:  0.015, hard:  0.040, veryHard:  0.060 },
  mixed:     { easy: -0.015, moderate: -0.040, hard: -0.050, veryHard: -0.045 },
  strength:  { easy: -0.005, moderate:  0.005, hard:  0.020, veryHard:  0.030 },
}

const IOB_AMPLIFIER = {
  aerobic:   2.5,
  mixed:     1.8,
  strength:  1.5,
  anaerobic: 1.0,
}

const INTENSITY_SCALER = {
  easy: 0.7, moderate: 1.0, hard: 1.2, veryHard: 1.3,
}

const TREND_PER_MIN = {
  doubleUp:    +0.067,
  up:          +0.033,
  flat:         0.000,
  down:        -0.033,
  doubleDown:  -0.067,
}

const TYPE_CARB_UTILIZATION = {
  aerobic:   0.6,
  mixed:     0.7,
  strength:  0.85,
  anaerobic: 0.95,
}

const TIME_OF_DAY_PER_MIN = {
  morning:  +0.010,
  midday:    0.000,
  evening:  -0.005,
}

function intensityBand(rpe) {
  if (rpe <= 3) return 'easy'
  if (rpe <= 6) return 'moderate'
  if (rpe <= 8) return 'hard'
  return 'veryHard'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function predictEndGlucose(input) {
  const {
    startMmol,
    trendArrow,
    workoutType,
    intensity,
    durationMin,
    iobUnits,
    recentCarbs,
    bodyweightKg,
    timeOfDay,
  } = input

  const intensityKey = intensityBand(intensity)
  const breakdown = []

  // 1. Base rate from workout type × intensity over duration
  const basePerMin = BASE_RATE_PER_MIN[workoutType][intensityKey]
  const baseDelta = basePerMin * durationMin
  breakdown.push({
    label: `${durationMin}min ${workoutType} at ${intensityKey} intensity`,
    delta: baseDelta,
    reasoning: 'Glucose-rate response per minute of this workout type × intensity',
  })

  // 2. IOB contribution (amplified by workout type, scaled by intensity)
  const iobAmp = IOB_AMPLIFIER[workoutType]
  const iScaler = INTENSITY_SCALER[intensityKey]
  const iobDelta = -iobUnits * 1.8 * (durationMin / 60) * iobAmp * iScaler
  if (iobUnits > 0) {
    breakdown.push({
      label: `${iobUnits}u IOB during ${workoutType}`,
      delta: iobDelta,
      reasoning: 'Active insulin amplified by exercise-driven uptake',
    })
  }

  // 3. CGM trend projection (capped at 60 min of projection)
  const projMin = Math.min(durationMin, 60)
  const trendDelta = (TREND_PER_MIN[trendArrow] || 0) * projMin
  if (trendDelta !== 0) {
    breakdown.push({
      label: `CGM trend (${trendArrow})`,
      delta: trendDelta,
      reasoning: 'Projects current arrow direction across early workout window',
    })
  }

  // 4. Recent-carb contribution (decays over 90 min)
  let carbDelta = 0
  if (recentCarbs && recentCarbs.grams > 0 && recentCarbs.minutesAgo < 90) {
    const availFrac = Math.max(0, 1 - recentCarbs.minutesAgo / 90)
    const utilization = TYPE_CARB_UTILIZATION[workoutType]
    carbDelta = recentCarbs.grams * 0.15 * availFrac * utilization
    breakdown.push({
      label: `${recentCarbs.grams}g carbs ${recentCarbs.minutesAgo}min ago`,
      delta: carbDelta,
      reasoning: 'Residual glucose available from recent intake',
    })
  }

  // 5. Time of day factor
  const todPerMin = TIME_OF_DAY_PER_MIN[timeOfDay] || 0
  const todDelta = todPerMin * durationMin
  if (todDelta !== 0) {
    breakdown.push({
      label: `${timeOfDay} circadian factor`,
      delta: todDelta,
      reasoning: timeOfDay === 'morning'
        ? 'Dawn-phenomenon counter-regulatory hormones'
        : 'End-of-day insulin sensitivity drift',
    })
  }

  const deltaMmol = baseDelta + iobDelta + trendDelta + carbDelta + todDelta
  const endMmol = clamp(startMmol + deltaMmol, 1.5, 30.0)

  // Sort breakdown by absolute contribution (largest impact first)
  breakdown.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return { endMmol, deltaMmol, breakdown }
}
```

- [ ] **Step 4: Run tests, all pass**

Run: `npm test src/features/calculators/pre-workout-glucose/prediction.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/pre-workout-glucose/prediction.js src/features/calculators/pre-workout-glucose/prediction.test.js
git commit -m "feat(pre-workout-glucose): add core prediction logic"
```

---

## Task 1.6: Calculator component — page shell + all inputs

Spec reference: §3.1 (9 inputs).

This task is UI-heavy. There's no test (visual). Verify in browser at the end.

**Files:**
- Create: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

- [ ] **Step 1: Create the component skeleton**

Create `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`:

```jsx
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
          {/* INPUTS — implemented in steps 2-9 below */}

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

function PredictionResults({ prediction, bodyweightKg, glucoseUnit }) {
  // Implemented in Task 1.7
  return null
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Pre-Workout Glucose Predictor uses literature-based modeling to estimate likely glucose response to exercise in people with type 1 diabetes. Individual responses vary substantially. Always check your glucose before, during, and after exercise. Always carry fast-acting carbs. Never adjust insulin doses based solely on this tool. Consult your endocrinologist before making changes to your exercise or insulin routine.</p>
    </div>
  )
}
```

- [ ] **Step 2: Add the form inputs (replace the `{/* INPUTS */}` comment)**

In `PreWorkoutGlucoseCalculator.jsx`, replace the `{/* INPUTS — implemented in steps 2-9 below */}` placeholder with the full inputs block:

```jsx
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
```

- [ ] **Step 3: Visual verify**

The dev server reloads automatically. Open http://localhost:3000/calculators/pre-workout-glucose in browser (route added in Task 1.10) OR navigate by editing App.jsx temporarily.

For now: just verify no syntax errors. Run: `npm run build` — Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(pre-workout-glucose): add page shell and all 9 input controls"
```

---

## Task 1.7: Result cards

Spec reference: §3.5

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

- [ ] **Step 1: Replace the `PredictionResults` placeholder component**

In `PreWorkoutGlucoseCalculator.jsx`, replace the placeholder `PredictionResults` function with:

```jsx
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
```

- [ ] **Step 2: Visual verify**

Run: `npm run build`
Expected: build succeeds, no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(pre-workout-glucose): add 5 result cards (headline, recommendation, breakdown, tips, post-workout)"
```

---

## Task 1.8: Wire route + FreeResources card + visual QA

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/FreeResourcesPage.jsx`

- [ ] **Step 1: Add the route to `App.jsx`**

In `src/App.jsx`, find the calculators routes block and add the new route. Add the import at the top with the other calculator imports:

```jsx
import PreWorkoutGlucoseCalculator from './features/calculators/PreWorkoutGlucoseCalculator'
```

And the route inside `<Routes>`:

```jsx
<Route path="/calculators/pre-workout-glucose" element={<PreWorkoutGlucoseCalculator />} />
```

- [ ] **Step 2: Add the card to `FreeResourcesPage.jsx`**

In `src/pages/FreeResourcesPage.jsx`, append a new entry to the `calculators` array (after the cardio entry):

```js
{
  slug: 'pre-workout-glucose',
  name: 'Pre-Workout Glucose Predictor',
  tagline: 'Predict end-glucose before you train',
  description: 'Plug in your starting glucose, CGM trend, IOB, and the workout you\'re about to do. Get a literature-grounded prediction of where your glucose will land and whether you need to fuel up first. Built on Riddell consensus + EXTOD guidelines.',
  badge: 'NEW',
},
```

Also update the hero paragraph copy. Replace:

```
Four free, fully-functional calculators...
```

with:

```
Five free, fully-functional calculators...
```

- [ ] **Step 3: Visual QA in browser**

Run: `npm run dev` (if not already running).
Navigate to:
- http://localhost:3000/free-resources — verify 5 cards render, "Pre-Workout Glucose Predictor" card is present with "NEW" badge
- Click into the new card → http://localhost:3000/calculators/pre-workout-glucose
- Verify all 9 inputs render
- Enter test values: 6.0 mmol/L, → trend, Aerobic, intensity 5, 45 min duration, 1.0u IOB, no recent carbs, 75kg, Midday
- Verify the result cards appear with: predicted end-glucose around 3.x mmol/L (hypo-risk band), carb recommendation showing, breakdown listing the contributions
- Test the IOB helper expandable: enter 4u, 60 min, Rapid → main field auto-populates to ~3.0
- Test unit toggle (mmol ↔ mg/dL) doesn't break the layout

- [ ] **Step 4: Final commit**

```bash
git add src/App.jsx src/pages/FreeResourcesPage.jsx
git commit -m "feat(pre-workout-glucose): wire route + add to Free Resources page"
```

**Phase 1 complete.** `/calculators/pre-workout-glucose` is live, 5 calcs on `/free-resources`.

---

# Phase 2 — Meal Frequency & Macro Distributor

> After this phase, `/calculators/meal-frequency` is live and the calculator is the 6th card on `/free-resources`.

## Task 2.1: Slot assignment (`slotAssignment.js`)

Spec reference: Appendix A. Pure data lookup that returns the chronologically-ordered slot labels plus pre/post indices for a given `(N, training_time)` combo.

**Files:**
- Create: `src/features/calculators/meal-frequency/slotAssignment.js`
- Create: `src/features/calculators/meal-frequency/slotAssignment.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/slotAssignment.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getTrainingDayLayout, getRestDayLayout } from './slotAssignment'

describe('getTrainingDayLayout — N=4 (sheet default)', () => {
  it('morning → [Pre, Post, Lunch, Dinner], preIdx=0 postIdx=1', () => {
    const r = getTrainingDayLayout(4, 'morning')
    expect(r.labels).toEqual(['Pre-Workout', 'Post-Workout', 'Lunch', 'Dinner'])
    expect(r.preIdx).toBe(0)
    expect(r.postIdx).toBe(1)
  })
  it('afternoon → [Breakfast, Pre, Post, Dinner], preIdx=1 postIdx=2', () => {
    const r = getTrainingDayLayout(4, 'afternoon')
    expect(r.labels).toEqual(['Breakfast', 'Pre-Workout', 'Post-Workout', 'Dinner'])
    expect(r.preIdx).toBe(1)
    expect(r.postIdx).toBe(2)
  })
  it('evening → [Breakfast, Lunch, Pre, Post], preIdx=2 postIdx=3', () => {
    const r = getTrainingDayLayout(4, 'evening')
    expect(r.labels).toEqual(['Breakfast', 'Lunch', 'Pre-Workout', 'Post-Workout'])
    expect(r.preIdx).toBe(2)
    expect(r.postIdx).toBe(3)
  })
})

describe('getTrainingDayLayout — other N values', () => {
  it('N=3 morning → 3 slots, preIdx=0 postIdx=1', () => {
    const r = getTrainingDayLayout(3, 'morning')
    expect(r.labels.length).toBe(3)
    expect(r.preIdx).toBe(0)
    expect(r.postIdx).toBe(1)
  })
  it('N=5 evening → preIdx=3 postIdx=4', () => {
    const r = getTrainingDayLayout(5, 'evening')
    expect(r.labels.length).toBe(5)
    expect(r.preIdx).toBe(3)
    expect(r.postIdx).toBe(4)
  })
  it('N=6 afternoon → preIdx=2 postIdx=3', () => {
    const r = getTrainingDayLayout(6, 'afternoon')
    expect(r.labels.length).toBe(6)
    expect(r.preIdx).toBe(2)
    expect(r.postIdx).toBe(3)
  })
  it('N=7 evening → preIdx=4 postIdx=5', () => {
    const r = getTrainingDayLayout(7, 'evening')
    expect(r.labels.length).toBe(7)
    expect(r.preIdx).toBe(4)
    expect(r.postIdx).toBe(5)
  })
  it('Pre and Post are always adjacent', () => {
    for (const N of [3, 4, 5, 6, 7]) {
      for (const t of ['morning', 'afternoon', 'evening']) {
        const r = getTrainingDayLayout(N, t)
        expect(r.postIdx - r.preIdx).toBe(1)
      }
    }
  })
})

describe('getRestDayLayout', () => {
  it('N=3 → Breakfast, Lunch, Dinner', () => {
    expect(getRestDayLayout(3)).toEqual(['Breakfast', 'Lunch', 'Dinner'])
  })
  it('N=4 → Breakfast, Lunch, Snack, Dinner', () => {
    expect(getRestDayLayout(4)).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner'])
  })
  it('N=5 → 5 chronological labels', () => {
    expect(getRestDayLayout(5).length).toBe(5)
  })
  it('N=7 → 7 chronological labels', () => {
    expect(getRestDayLayout(7).length).toBe(7)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/slotAssignment.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/slotAssignment.js`:

```js
// Chronological slot labels for training day by (N, training_time).
// Per spec Appendix A — derived from Nicholas's master sheet (Macro Timing tab).
const TRAINING_LAYOUTS = {
  morning: {
    3: ['Pre-Workout', 'Post-Workout', 'Dinner'],
    4: ['Pre-Workout', 'Post-Workout', 'Lunch', 'Dinner'],
    5: ['Pre-Workout', 'Post-Workout', 'Lunch', 'Snack', 'Dinner'],
    6: ['Pre-Workout', 'Post-Workout', 'Snack', 'Lunch', 'Snack', 'Dinner'],
    7: ['Pre-Workout', 'Post-Workout', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack'],
  },
  afternoon: {
    3: ['Breakfast', 'Pre-Workout', 'Post-Workout'],
    4: ['Breakfast', 'Pre-Workout', 'Post-Workout', 'Dinner'],
    5: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Dinner'],
    6: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Snack', 'Dinner'],
    7: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Snack', 'Dinner', 'Late Snack'],
  },
  evening: {
    3: ['Breakfast', 'Pre-Workout', 'Post-Workout'],
    4: ['Breakfast', 'Lunch', 'Pre-Workout', 'Post-Workout'],
    5: ['Breakfast', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout'],
    6: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout'],
    7: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout', 'Late Snack'],
  },
}

const REST_LAYOUTS = {
  3: ['Breakfast', 'Lunch', 'Dinner'],
  4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
  5: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner'],
  6: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack'],
  7: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack', 'Bedtime Snack'],
}

export function getTrainingDayLayout(N, trainingTime) {
  const labels = TRAINING_LAYOUTS[trainingTime]?.[N]
  if (!labels) {
    throw new Error(`No training-day layout for N=${N} time=${trainingTime}`)
  }
  const preIdx = labels.indexOf('Pre-Workout')
  const postIdx = labels.indexOf('Post-Workout')
  return { labels: [...labels], preIdx, postIdx }
}

export function getRestDayLayout(N) {
  const labels = REST_LAYOUTS[N]
  if (!labels) throw new Error(`No rest-day layout for N=${N}`)
  return [...labels]
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/slotAssignment.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/slotAssignment.js src/features/calculators/meal-frequency/slotAssignment.test.js
git commit -m "feat(meal-frequency): add chronological slot layout per (N, training_time)"
```

---

## Task 2.2: Meal count helper (`mealCount.js`)

Spec reference: §4.3. Defaults + smart-bump suggestion when high carb totals would force any meal over 45g.

**Files:**
- Create: `src/features/calculators/meal-frequency/mealCount.js`
- Create: `src/features/calculators/meal-frequency/mealCount.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/mealCount.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { defaultMealCount, suggestMealCount, DEFAULTS } from './mealCount'

describe('DEFAULTS', () => {
  it('training default is 4', () => {
    expect(DEFAULTS.training).toBe(4)
  })
  it('rest default is 3', () => {
    expect(DEFAULTS.rest).toBe(3)
  })
})

describe('defaultMealCount', () => {
  it('training day → 4', () => {
    expect(defaultMealCount('training')).toBe(4)
  })
  it('rest day → 3', () => {
    expect(defaultMealCount('rest')).toBe(3)
  })
})

describe('suggestMealCount — training day', () => {
  it('low carbs (100g) at default N=4 → no bump needed', () => {
    // Regular meal carbs at N=4, 0.65 weight: 0.35 × 100 / 2 = 17.5g (≤45g)
    expect(suggestMealCount({ dayType: 'training', dailyCarbs: 100, carbWeight: 0.65 })).toEqual({
      N: 4, reason: 'default', peri: 32.5, regular: 17.5,
    })
  })
  it('moderate carbs (200g) at default N=4 → no bump needed', () => {
    // Regular: 0.35 × 200 / 2 = 35g (≤45g). Peri: 0.65 × 200 / 2 = 65g (over 45 but THIS is the peri-weight problem)
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 200, carbWeight: 0.65 })
    expect(r.peri).toBeCloseTo(65, 1)
    expect(r.regular).toBeCloseTo(35, 1)
    expect(r.peri).toBeGreaterThan(45)
    expect(r.suggestReducePeriWeight).toBe(true)
  })
  it('high carbs (300g) at N=4 → suggest bump for regulars', () => {
    // Regular at N=4: 0.35 × 300 / 2 = 52.5g (over 45)
    // Bump to N=5: 0.35 × 300 / 3 = 35g (ok)
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 300, carbWeight: 0.65 })
    expect(r.N).toBeGreaterThanOrEqual(5)
    expect(r.regular).toBeLessThanOrEqual(45)
  })
  it('caps suggestion at N=7 even if math wants higher', () => {
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 1000, carbWeight: 0.65 })
    expect(r.N).toBeLessThanOrEqual(7)
  })
})

describe('suggestMealCount — rest day', () => {
  it('low carbs (100g) at default N=3 → no bump', () => {
    // 100 / 3 = 33.3g (≤45g)
    const r = suggestMealCount({ dayType: 'rest', dailyCarbs: 100 })
    expect(r.N).toBe(3)
    expect(r.perMeal).toBeCloseTo(33.3, 1)
  })
  it('high carbs (200g) at N=3 → suggest bump', () => {
    // 200 / 3 = 66.7g (over 45)
    // Bump to N=5: 200/5 = 40g (ok)
    const r = suggestMealCount({ dayType: 'rest', dailyCarbs: 200 })
    expect(r.N).toBeGreaterThanOrEqual(5)
    expect(r.perMeal).toBeLessThanOrEqual(45)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/mealCount.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/mealCount.js`:

```js
export const DEFAULTS = {
  training: 4,
  rest: 3,
}

export const TARGET_CARB_CEILING = 45  // top of dosing-accuracy sweet spot

export function defaultMealCount(dayType) {
  return dayType === 'training' ? DEFAULTS.training : DEFAULTS.rest
}

function computeTrainingMeals(dailyCarbs, carbWeight, N) {
  const peri = (carbWeight * dailyCarbs) / 2
  const regular = ((1 - carbWeight) * dailyCarbs) / Math.max(1, N - 2)
  return { peri, regular }
}

export function suggestMealCount({ dayType, dailyCarbs, carbWeight }) {
  if (dayType === 'rest') {
    let N = DEFAULTS.rest
    while (dailyCarbs / N > TARGET_CARB_CEILING && N < 7) {
      N += 1
    }
    return {
      N,
      perMeal: dailyCarbs / N,
      reason: N === DEFAULTS.rest ? 'default' : 'bumped-for-carb-ceiling',
    }
  }

  // Training day
  let N = DEFAULTS.training
  while (true) {
    const { peri, regular } = computeTrainingMeals(dailyCarbs, carbWeight, N)
    if (regular <= TARGET_CARB_CEILING || N >= 7) {
      const result = {
        N,
        peri,
        regular,
        reason: N === DEFAULTS.training ? 'default' : 'bumped-for-regular-carb-ceiling',
      }
      if (peri > TARGET_CARB_CEILING) {
        result.suggestReducePeriWeight = true
      }
      return result
    }
    N += 1
  }
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/mealCount.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/mealCount.js src/features/calculators/meal-frequency/mealCount.test.js
git commit -m "feat(meal-frequency): add meal-count defaults + smart bump suggestion"
```

---

## Task 2.3: Peri-weighted distribution (`distribution.js`)

Spec reference: §4.4 (training day) + §4.5 (rest day). Pure math — no slot positioning, no labeling.

**Files:**
- Create: `src/features/calculators/meal-frequency/distribution.js`
- Create: `src/features/calculators/meal-frequency/distribution.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/distribution.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { distributeTrainingDay, distributeRestDay, caloriesFromMacros } from './distribution'

describe('caloriesFromMacros', () => {
  it('25g P, 32.5g C, 7.5g F = 297.5 cal', () => {
    expect(caloriesFromMacros({ protein: 25, carbs: 32.5, fat: 7.5 })).toBeCloseTo(297.5, 1)
  })
  it('25g P, 17.5g C, 42.5g F = 552.5 cal', () => {
    expect(caloriesFromMacros({ protein: 25, carbs: 17.5, fat: 42.5 })).toBeCloseTo(552.5, 1)
  })
})

describe('distributeTrainingDay — matches Nicholas master sheet example', () => {
  // 1700 cal / 100g P / 100g C / 100g F / 30g fiber, N=4, weights 0.65 / 0.15
  const input = {
    protein: 100, carbs: 100, fat: 100, fiber: 30,
    N: 4, carbWeight: 0.65, fatWeight: 0.15,
  }

  it('produces peri and regular macro buckets matching the sheet', () => {
    const r = distributeTrainingDay(input)
    expect(r.peri.protein).toBeCloseTo(25, 1)
    expect(r.peri.carbs).toBeCloseTo(32.5, 1)
    expect(r.peri.fat).toBeCloseTo(7.5, 1)
    expect(r.peri.fiber).toBeCloseTo(7.5, 1)
    expect(r.peri.calories).toBeCloseTo(297.5, 1)

    expect(r.regular.protein).toBeCloseTo(25, 1)
    expect(r.regular.carbs).toBeCloseTo(17.5, 1)
    expect(r.regular.fat).toBeCloseTo(42.5, 1)
    expect(r.regular.fiber).toBeCloseTo(7.5, 1)
    expect(r.regular.calories).toBeCloseTo(552.5, 1)
  })

  it('preserves daily totals across 2 peri + 2 regular meals', () => {
    const r = distributeTrainingDay(input)
    const totalP = 2 * r.peri.protein + 2 * r.regular.protein
    const totalC = 2 * r.peri.carbs + 2 * r.regular.carbs
    const totalF = 2 * r.peri.fat + 2 * r.regular.fat
    const totalFib = 2 * r.peri.fiber + 2 * r.regular.fiber
    expect(totalP).toBeCloseTo(100, 1)
    expect(totalC).toBeCloseTo(100, 1)
    expect(totalF).toBeCloseTo(100, 1)
    expect(totalFib).toBeCloseTo(30, 1)
  })
})

describe('distributeTrainingDay — N=5', () => {
  it('preserves daily totals with 2 peri + 3 regulars', () => {
    const r = distributeTrainingDay({
      protein: 150, carbs: 200, fat: 80, fiber: 35,
      N: 5, carbWeight: 0.65, fatWeight: 0.15,
    })
    const totalP = 2 * r.peri.protein + 3 * r.regular.protein
    const totalC = 2 * r.peri.carbs + 3 * r.regular.carbs
    const totalF = 2 * r.peri.fat + 3 * r.regular.fat
    expect(totalP).toBeCloseTo(150, 1)
    expect(totalC).toBeCloseTo(200, 1)
    expect(totalF).toBeCloseTo(80, 1)
  })
})

describe('distributeRestDay — matches Nicholas master sheet example', () => {
  // 1700 cal / 100g P / 100g C / 100g F / 30g fiber, N=3
  it('N=3 → each meal = 33.3g of every macro and 566.67 cal', () => {
    const r = distributeRestDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30, N: 3,
    })
    expect(r.protein).toBeCloseTo(33.33, 1)
    expect(r.carbs).toBeCloseTo(33.33, 1)
    expect(r.fat).toBeCloseTo(33.33, 1)
    expect(r.fiber).toBeCloseTo(10, 1)
    expect(r.calories).toBeCloseTo(566.67, 1)
  })
})

describe('distributeTrainingDay — extreme weights', () => {
  it('carbWeight=0.5 → peri and regulars get equal carb amounts at N=4', () => {
    const r = distributeTrainingDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30,
      N: 4, carbWeight: 0.5, fatWeight: 0.5,
    })
    expect(r.peri.carbs).toBeCloseTo(r.regular.carbs, 1)
    expect(r.peri.fat).toBeCloseTo(r.regular.fat, 1)
  })
  it('fatWeight=0 → peri meals have zero fat', () => {
    const r = distributeTrainingDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30,
      N: 4, carbWeight: 0.65, fatWeight: 0,
    })
    expect(r.peri.fat).toBe(0)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/distribution.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/distribution.js`:

```js
export function caloriesFromMacros({ protein, carbs, fat }) {
  return (protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9
}

export function distributeTrainingDay({ protein, carbs, fat, fiber, N, carbWeight, fatWeight }) {
  const regulars = Math.max(1, N - 2)

  // CARBS — weighted toward peri
  const periCarbs    = (carbWeight * carbs) / 2
  const regularCarbs = ((1 - carbWeight) * carbs) / regulars

  // FAT — weighted away from peri
  const periFat    = (fatWeight * fat) / 2
  const regularFat = ((1 - fatWeight) * fat) / regulars

  // PROTEIN & FIBER — equal across all N meals
  const equalProtein = protein / N
  const equalFiber   = fiber / N

  const peri = {
    protein:  equalProtein,
    carbs:    periCarbs,
    fat:      periFat,
    fiber:    equalFiber,
    calories: caloriesFromMacros({ protein: equalProtein, carbs: periCarbs, fat: periFat }),
  }

  const regular = {
    protein:  equalProtein,
    carbs:    regularCarbs,
    fat:      regularFat,
    fiber:    equalFiber,
    calories: caloriesFromMacros({ protein: equalProtein, carbs: regularCarbs, fat: regularFat }),
  }

  return { peri, regular }
}

export function distributeRestDay({ protein, carbs, fat, fiber, N }) {
  const p = protein / N
  const c = carbs / N
  const f = fat / N
  const fib = fiber / N
  return {
    protein: p,
    carbs:   c,
    fat:     f,
    fiber:   fib,
    calories: caloriesFromMacros({ protein: p, carbs: c, fat: f }),
  }
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/distribution.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/distribution.js src/features/calculators/meal-frequency/distribution.test.js
git commit -m "feat(meal-frequency): add peri-weighted macro distribution (sheet-verified)"
```

---

## Task 2.4: Planner orchestrator (`planner.js`)

Spec reference: §4.3 - §4.6. Combines slot assignment + distribution + meal count helper into a single `buildDayPlan(input)` function that returns the final meal array.

**Files:**
- Create: `src/features/calculators/meal-frequency/planner.js`
- Create: `src/features/calculators/meal-frequency/planner.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/planner.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildDayPlan } from './planner'

const sheetExample = {
  calories: 1700, protein: 100, carbs: 100, fat: 100, fiber: 30,
  N: 4, carbWeight: 0.65, fatWeight: 0.15,
}

describe('buildDayPlan — non-training (rest) day', () => {
  it('N=3 rest day matches sheet (566.67 cal × 3)', () => {
    const { meals } = buildDayPlan({ ...sheetExample, N: 3, dayType: 'rest' })
    expect(meals.length).toBe(3)
    meals.forEach((m) => {
      expect(m.calories).toBeCloseTo(566.67, 1)
      expect(m.protein).toBeCloseTo(33.33, 1)
      expect(m.carbs).toBeCloseTo(33.33, 1)
      expect(m.fat).toBeCloseTo(33.33, 1)
      expect(m.fiber).toBeCloseTo(10, 1)
      expect(m.role).toBe('regular')
    })
  })
  it('assigns chronological labels for rest day', () => {
    const { meals } = buildDayPlan({ ...sheetExample, N: 3, dayType: 'rest' })
    expect(meals[0].name).toBe('Breakfast')
    expect(meals[1].name).toBe('Lunch')
    expect(meals[2].name).toBe('Dinner')
  })
})

describe('buildDayPlan — training day matches sheet (N=4, evening)', () => {
  const input = { ...sheetExample, dayType: 'training', trainingTime: 'evening' }

  it('produces 4 meals in correct order', () => {
    const { meals } = buildDayPlan(input)
    expect(meals.length).toBe(4)
    expect(meals[0].name).toBe('Breakfast')
    expect(meals[1].name).toBe('Lunch')
    expect(meals[2].name).toBe('Pre-Workout')
    expect(meals[3].name).toBe('Post-Workout')
  })

  it('Pre-Workout meal macros match sheet (297.5 cal / 25P / 32.5C / 7.5F / 7.5fib)', () => {
    const { meals } = buildDayPlan(input)
    const pre = meals[2]
    expect(pre.calories).toBeCloseTo(297.5, 1)
    expect(pre.protein).toBeCloseTo(25, 1)
    expect(pre.carbs).toBeCloseTo(32.5, 1)
    expect(pre.fat).toBeCloseTo(7.5, 1)
    expect(pre.fiber).toBeCloseTo(7.5, 1)
    expect(pre.role).toBe('peri')
    expect(pre.carbsType).toBe('simple')
  })

  it('Post-Workout meal macros match sheet (297.5 cal / 25P / 32.5C / 7.5F)', () => {
    const { meals } = buildDayPlan(input)
    const post = meals[3]
    expect(post.calories).toBeCloseTo(297.5, 1)
    expect(post.carbs).toBeCloseTo(32.5, 1)
    expect(post.role).toBe('peri')
    expect(post.carbsType).toBe('complex')
  })

  it('Regular meals match sheet (552.5 cal / 25P / 17.5C / 42.5F)', () => {
    const { meals } = buildDayPlan(input)
    const reg1 = meals[0]
    const reg2 = meals[1]
    for (const r of [reg1, reg2]) {
      expect(r.calories).toBeCloseTo(552.5, 1)
      expect(r.carbs).toBeCloseTo(17.5, 1)
      expect(r.fat).toBeCloseTo(42.5, 1)
      expect(r.role).toBe('regular')
      expect(r.carbsType).toBe('mixed')
    }
  })

  it('daily totals match sheet exactly', () => {
    const { meals } = buildDayPlan(input)
    const sum = (k) => meals.reduce((s, m) => s + m[k], 0)
    expect(sum('calories')).toBeCloseTo(1700, 1)
    expect(sum('protein')).toBeCloseTo(100, 1)
    expect(sum('carbs')).toBeCloseTo(100, 1)
    expect(sum('fat')).toBeCloseTo(100, 1)
    expect(sum('fiber')).toBeCloseTo(30, 1)
  })
})

describe('buildDayPlan — slot ordering by training time', () => {
  it('morning training places Pre/Post first', () => {
    const { meals } = buildDayPlan({ ...sheetExample, dayType: 'training', trainingTime: 'morning' })
    expect(meals[0].name).toBe('Pre-Workout')
    expect(meals[1].name).toBe('Post-Workout')
  })
  it('afternoon training places Pre/Post in slots 2-3', () => {
    const { meals } = buildDayPlan({ ...sheetExample, dayType: 'training', trainingTime: 'afternoon' })
    expect(meals[1].name).toBe('Pre-Workout')
    expect(meals[2].name).toBe('Post-Workout')
  })
})

describe('buildDayPlan — warning flags', () => {
  it('flags meals with > 50g carbs', () => {
    // N=3 rest day with 300g carbs → 100g/meal > 50g
    const { meals } = buildDayPlan({
      ...sheetExample, carbs: 300, N: 3, dayType: 'rest',
    })
    meals.forEach((m) => expect(m.warnOverFifty).toBe(true))
  })
  it('does not flag meals at or below 50g', () => {
    const { meals } = buildDayPlan({
      ...sheetExample, carbs: 100, N: 3, dayType: 'rest',
    })
    meals.forEach((m) => expect(m.warnOverFifty).toBe(false))
  })
})

describe('buildDayPlan — macro-calorie consistency', () => {
  it('returns macroCalorieDelta showing the discrepancy', () => {
    // Macros imply: 100*4 + 100*4 + 100*9 = 1700 (matches stated calories)
    const r = buildDayPlan({ ...sheetExample, dayType: 'rest' })
    expect(Math.abs(r.macroCalorieDelta)).toBeLessThan(10)
  })
  it('flags consistency warning when delta exceeds 10%', () => {
    // Stated 1700 cal but macros imply 1300 cal (76g P, 76g C, 76g F)
    const r = buildDayPlan({
      calories: 1700, protein: 76, carbs: 76, fat: 76, fiber: 25,
      N: 3, dayType: 'rest',
    })
    expect(r.macroConsistencyWarning).toBe(true)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/planner.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/planner.js`:

```js
import { getTrainingDayLayout, getRestDayLayout } from './slotAssignment'
import { distributeTrainingDay, distributeRestDay, caloriesFromMacros } from './distribution'

const CARB_WARN_THRESHOLD = 50

function checkMacroConsistency(stated, macros) {
  const implied = caloriesFromMacros(macros)
  const delta = implied - stated
  return {
    macroCalorieDelta: delta,
    macroConsistencyWarning: Math.abs(delta) / Math.max(1, stated) > 0.10,
  }
}

export function buildDayPlan(input) {
  const {
    calories, protein, carbs, fat, fiber,
    N, dayType, trainingTime, carbWeight = 0.65, fatWeight = 0.15,
  } = input

  const consistency = checkMacroConsistency(calories, { protein, carbs, fat })

  if (dayType === 'rest') {
    const labels = getRestDayLayout(N)
    const per = distributeRestDay({ protein, carbs, fat, fiber, N })
    const meals = labels.map((name, i) => ({
      idx: i,
      name,
      role: 'regular',
      carbsType: 'mixed',
      protein:  per.protein,
      carbs:    per.carbs,
      fat:      per.fat,
      fiber:    per.fiber,
      calories: per.calories,
      warnOverFifty: per.carbs > CARB_WARN_THRESHOLD,
    }))
    return { meals, ...consistency }
  }

  // Training day
  const layout = getTrainingDayLayout(N, trainingTime)
  const dist = distributeTrainingDay({ protein, carbs, fat, fiber, N, carbWeight, fatWeight })

  const meals = layout.labels.map((name, i) => {
    const isPre  = i === layout.preIdx
    const isPost = i === layout.postIdx
    const isPeri = isPre || isPost
    const macros = isPeri ? dist.peri : dist.regular
    return {
      idx: i,
      name,
      role: isPeri ? 'peri' : 'regular',
      carbsType: isPre ? 'simple' : isPost ? 'complex' : 'mixed',
      protein:  macros.protein,
      carbs:    macros.carbs,
      fat:      macros.fat,
      fiber:    macros.fiber,
      calories: macros.calories,
      warnOverFifty: macros.carbs > CARB_WARN_THRESHOLD,
    }
  })

  return { meals, ...consistency }
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/planner.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/planner.js src/features/calculators/meal-frequency/planner.test.js
git commit -m "feat(meal-frequency): add planner orchestrator combining slots + distribution"
```

---

## Task 2.5: Calculator component — page shell + inputs

Spec reference: §4.2. **Note the difference from the original Task 2.5**: the pre-workout-timing 3-button input is REMOVED. Two new inputs replace it: peri-workout carb weight slider + peri-workout fat weight slider.

**Files:**
- Create: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Create the component**

Create `src/features/calculators/MealFrequencyCalculator.jsx`:

```jsx
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { buildDayPlan } from './meal-frequency/planner'
import { defaultMealCount, suggestMealCount } from './meal-frequency/mealCount'

const TRAINING_TIMES = [
  { id: 'morning',   label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening' },
]

export default function MealFrequencyCalculator() {
  const [calories, setCalories] = useState('')
  const [protein,  setProtein]  = useState('')
  const [fat,      setFat]      = useState('')
  const [carbs,    setCarbs]    = useState('')
  const [fiber,    setFiber]    = useState('25')

  const [dayType,      setDayType]      = useState('rest')
  const [trainingTime, setTrainingTime] = useState('afternoon')
  const [carbWeight,   setCarbWeight]   = useState(0.65)
  const [fatWeight,    setFatWeight]    = useState(0.15)

  const [mealCount,    setMealCount]    = useState(defaultMealCount('rest'))
  const [userOverrodeN, setUserOverrodeN] = useState(false)

  const carbsNum = parseFloat(carbs) || 0

  // Re-suggest meal count when dayType / carbs / carbWeight change — UNLESS user has overridden
  const suggestion = useMemo(() => {
    if (carbsNum <= 0) return null
    return suggestMealCount({ dayType, dailyCarbs: carbsNum, carbWeight })
  }, [dayType, carbsNum, carbWeight])

  useEffect(() => {
    if (suggestion && !userOverrodeN) setMealCount(suggestion.N)
  }, [suggestion, userOverrodeN])

  // Reset override flag when daytype changes (fresh start)
  useEffect(() => {
    setUserOverrodeN(false)
    setMealCount(defaultMealCount(dayType))
  }, [dayType])

  const plan = useMemo(() => {
    if (!protein || !fat || !carbs || !fiber) return null
    return buildDayPlan({
      calories: parseFloat(calories) || 0,
      protein:  parseFloat(protein),
      fat:      parseFloat(fat),
      carbs:    parseFloat(carbs),
      fiber:    parseFloat(fiber),
      N: mealCount,
      dayType,
      trainingTime,
      carbWeight,
      fatWeight,
    })
  }, [calories, protein, fat, carbs, fiber, mealCount, dayType, trainingTime, carbWeight, fatWeight])

  const overrideMealCount = (n) => {
    setUserOverrodeN(true)
    setMealCount(n)
  }

  const reset = () => {
    setCalories(''); setProtein(''); setFat(''); setCarbs(''); setFiber('25')
    setDayType('rest'); setCarbWeight(0.65); setFatWeight(0.15)
    setUserOverrodeN(false); setMealCount(defaultMealCount('rest'))
  }

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <section className="bg-da-darker relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="da-container relative z-10 py-20 md:py-28 text-center">
          <Link to="/free-resources" className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4 inline-block">
            ← Back to Free Resources
          </Link>
          <p className="text-da-gold uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">🍽 Meal Frequency Planner</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight text-white mb-6">
            Meal Frequency <span className="text-da-cyan">Planner</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Turn your daily macros into a structured eating plan — peri-workout-weighted, dosing-accurate, and built from Nicholas's coaching system.
          </p>
        </div>
      </section>

      <section className="da-container section-padding">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-da-card rounded-2xl p-6 md:p-8 space-y-6">

            {/* Daily totals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ['Calories', calories, setCalories, 'kcal'],
                ['Protein',  protein,  setProtein,  'g'],
                ['Fat',      fat,      setFat,      'g'],
                ['Carbs',    carbs,    setCarbs,    'g'],
                ['Fiber',    fiber,    setFiber,    'g'],
              ].map(([label, val, set, unit]) => (
                <div key={label}>
                  <label className="block text-da-cyan uppercase tracking-wider text-[10px] font-bold mb-1">{label}</label>
                  <div className="relative">
                    <input type="number" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} placeholder="0"
                      className="w-full bg-da-dark border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {plan?.macroConsistencyWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-200">
                ⚠️ Your stated macros don't match your stated calories (off by {Math.round(plan.macroCalorieDelta)} kcal). The plan uses your macros — double-check your numbers.
              </div>
            )}

            {/* Day type */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Day Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[['rest', 'Rest Day'], ['training', 'Training Day']].map(([d, lbl]) => (
                  <button key={d} type="button" onClick={() => setDayType(d)}
                    className={`py-3 rounded-lg ${dayType === d ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Training-day extra inputs */}
            {dayType === 'training' && (
              <>
                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Training Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRAINING_TIMES.map((t) => (
                      <button key={t.id} type="button" onClick={() => setTrainingTime(t.id)}
                        className={`py-3 rounded-lg ${trainingTime === t.id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">
                    Peri-Workout Carb Weight — {Math.round(carbWeight * 100)}%
                  </label>
                  <p className="text-xs text-white/40 mb-2">Fraction of daily carbs in the pre + post workout meals combined. Sheet default: 65%.</p>
                  <input type="range" min="0.40" max="0.80" step="0.05" value={carbWeight}
                    onChange={(e) => setCarbWeight(parseFloat(e.target.value))}
                    className="w-full accent-da-cyan" />
                </div>

                <div>
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">
                    Peri-Workout Fat Weight — {Math.round(fatWeight * 100)}%
                  </label>
                  <p className="text-xs text-white/40 mb-2">Fraction of daily fat in pre + post combined. Lower keeps peri meals light. Sheet default: 15%.</p>
                  <input type="range" min="0.10" max="0.30" step="0.05" value={fatWeight}
                    onChange={(e) => setFatWeight(parseFloat(e.target.value))}
                    className="w-full accent-da-cyan" />
                </div>
              </>
            )}

            {/* Meal count */}
            {carbsNum > 0 && (
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Meal Count</label>
                {suggestion && (
                  <p className="text-xs text-white/50 mb-2">
                    Suggested: <strong className="text-da-cyan">{suggestion.N} meals</strong>
                    {dayType === 'training'
                      ? ` (peri ~${suggestion.peri.toFixed(1)}g carbs, regular ~${suggestion.regular.toFixed(1)}g carbs)`
                      : ` (each meal ~${suggestion.perMeal.toFixed(1)}g carbs)`
                    }
                  </p>
                )}
                {suggestion?.suggestReducePeriWeight && (
                  <p className="text-xs text-yellow-300 mb-2">
                    ⚠️ Peri-workout meals alone would exceed 45g carbs. Consider lowering the carb weight above.
                  </p>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <button key={n} type="button" onClick={() => overrideMealCount(n)}
                      className={`py-3 rounded-lg ${mealCount === n ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {plan && <MealTimeline plan={plan} dayType={dayType} />}

          <EducationalCards />

          <div className="text-center pt-4">
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>

          <Disclaimer />
        </div>
      </section>
    </div>
  )
}

function MealTimeline({ plan, dayType }) {
  // Implemented in Task 2.6
  return null
}

function EducationalCards() {
  // Implemented in Task 2.7
  return null
}

function Disclaimer() {
  return (
    <div className="border-l-2 border-da-gold/50 pl-4 py-3 text-xs text-white/50 leading-relaxed mt-12">
      <p className="text-da-gold/80 font-bold uppercase tracking-wider mb-2">⚠️ Educational tool — not medical advice</p>
      <p>The Meal Frequency Planner produces structural eating templates based on Nicholas's coaching system. Individual macro needs, insulin responses, and meal tolerances vary widely. The 35–45g carbs-per-meal range is a heuristic, not a prescription. Always check glucose around meals. Consult your endocrinologist or registered dietitian before significant dietary changes.</p>
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(meal-frequency): add page shell + inputs (peri-weight sliders, day type, training time, smart meal count)"
```

---

## Task 2.6: Meal timeline rendering

Spec reference: §4.7 card 3

**Files:**
- Modify: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Replace the `MealTimeline` placeholder**

In `MealFrequencyCalculator.jsx`, replace the `MealTimeline` placeholder function with:

```jsx
function MealTimeline({ plan, dayType }) {
  return (
    <div className="space-y-3">
      <div className="bg-da-card rounded-2xl p-6">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-1">{dayType === 'training' ? 'Training Day' : 'Rest Day'} Meal Plan</p>
        <p className="text-white/40 text-sm">Daily totals stay constant across day types — only the structure shifts.</p>
      </div>

      {plan.meals.map((meal) => {
        const isPre  = meal.name === 'Pre-Workout'
        const isPost = meal.name === 'Post-Workout'
        const accentColor = isPre ? '#46C0ED' : isPost ? '#FCC826' : null
        const accentIcon = isPre ? '⚡' : isPost ? '💪' : null

        return (
          <div key={meal.idx}
            className="bg-da-card rounded-2xl p-5 md:p-6"
            style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                {meal.role === 'peri' && (
                  <p className="uppercase tracking-wider text-xs font-bold mb-1" style={{ color: accentColor }}>
                    {accentIcon} Peri-Workout
                  </p>
                )}
                <h3 className="text-xl font-black text-white uppercase tracking-wide">{meal.name}</h3>
                <p className="text-xs text-white/40 mt-1">Carbs type: <span className="text-white/60 capitalize">{meal.carbsType}</span></p>
              </div>
              {meal.warnOverFifty && (
                <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                  ⚠️ &gt;50g carbs
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {[
                ['Calories', meal.calories.toFixed(0), 'kcal'],
                ['Protein',  meal.protein.toFixed(1),  'g'],
                ['Carbs',    meal.carbs.toFixed(1),    'g'],
                ['Fat',      meal.fat.toFixed(1),      'g'],
                ['Fiber',    meal.fiber.toFixed(1),    'g'],
              ].map(([label, val, unit]) => (
                <div key={label} className="bg-da-dark/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
                  <p className="text-white font-bold">{val}<span className="text-white/40 text-xs ml-0.5">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(meal-frequency): render meal timeline cards with peri/regular labels"
```

---

## Task 2.7: Educational cards + coaching notes

Spec reference: §4.7 cards 4–6, §4.7.1

**Files:**
- Modify: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Replace `EducationalCards` placeholder**

In `MealFrequencyCalculator.jsx`, replace the `EducationalCards` placeholder:

```jsx
function EducationalCards() {
  return (
    <div className="space-y-4">
      {/* Three-Hour Rule */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">🕒 The Three-Hour Rule</p>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>The <strong className="text-white">timing</strong> of your pre-workout meal changes how you should <strong className="text-white">dose insulin</strong> for it (even though the meal's macros stay the same in this plan).</p>
          <p><strong className="text-white">A meal 3+ hours before training</strong> can be dosed normally — most short-acting insulin has a ~4-hour action window, so by the time you train you'll have roughly 25% of that bolus still on board. Great for strength work; minimal hypo risk for endurance.</p>
          <p><strong className="text-white">A meal within 1 hour of training</strong> is best dosed at roughly 25% of your usual amount (a 75% reduction). The remaining 75% would otherwise stack with exercise-driven glucose drops.</p>
          <p>
            <Link to="/calculators/magic-ratio" className="text-da-cyan underline font-bold">
              → Use the Magic Ratio Calculator to calibrate your insulin-to-carb ratio
            </Link>
          </p>
        </div>
      </div>

      {/* Post-workout insulin sensitivity */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-gold">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-3">💉 Post-Workout Insulin Sensitivity</p>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>You're significantly more insulin-sensitive <strong className="text-white">during and after</strong> training — for up to 24 hours, peaking 4–6 hours after exercise.</p>
          <p>Most people benefit from reducing the post-workout meal bolus by <strong className="text-white">50–75%</strong> of their normal insulin-to-carb ratio. Recheck glucose at 30 min and 2 hours post-meal to verify.</p>
          <p>
            <Link to="/calculators/magic-ratio" className="text-da-gold underline font-bold">
              → Recalibrate around training with the Magic Ratio Calculator
            </Link>
          </p>
        </div>
      </div>

      {/* Coaching notes */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Coach's Notes</p>
        <ul className="space-y-2 text-sm text-white/70">
          <li>💧 <strong className="text-white">Eat in a relaxed state.</strong> Suit meals to your life schedule, not the other way around.</li>
          <li>⚠️ <strong className="text-white">Carbs used to treat hypos count.</strong> Adjust meals down on days you've had to treat lows.</li>
          <li>🎯 <strong className="text-white">This is a template, not a rule.</strong> Shift meal timing as needed — daily totals are what matter.</li>
          <li>🍎 <strong className="text-white">Pre-workout = simple carbs, post-workout = complex carbs.</strong> Same macro amounts, different carb types for utilization and replenishment.</li>
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(meal-frequency): add educational cards (Three-Hour Rule, post-workout sensitivity, coach notes)"
```

---

## Task 2.8: Wire route + FreeResources card + visual QA

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/FreeResourcesPage.jsx`

- [ ] **Step 1: Add the route**

In `src/App.jsx`, add the import at the top:

```jsx
import MealFrequencyCalculator from './features/calculators/MealFrequencyCalculator'
```

And the route inside `<Routes>`:

```jsx
<Route path="/calculators/meal-frequency" element={<MealFrequencyCalculator />} />
```

- [ ] **Step 2: Add the FreeResources card**

In `src/pages/FreeResourcesPage.jsx`, append to the `calculators` array (after the pre-workout-glucose entry from Task 1.8):

```js
{
  slug: 'meal-frequency',
  name: 'Meal Frequency Planner',
  tagline: 'Structure your day around dosing accuracy',
  description: 'Plug in your daily macros — get a structured eating plan with peri-workout-weighted distribution (65% carbs to pre/post by default), built from Nicholas\'s actual coaching system. Adapts to training time and respects the 35-45g carbs-per-meal dosing rule.',
  badge: 'NEW',
},
```

Update the hero copy from `Five free` to `Six free` (you set this in Task 1.8).

- [ ] **Step 3: Visual QA in browser**

Run: `npm run dev` (if not already running).

Test scenarios:

**Sheet-match check:**
- Navigate to http://localhost:3000/calculators/meal-frequency
- Enter: **1700 cal / 100g P / 100g C / 100g F / 25g fiber** (fiber tweaked from sheet's 30g to our default)
- Day type: **Training Day**, Training time: **Evening**
- Verify carb weight slider shows 65%, fat weight shows 15% (defaults)
- Verify meal count shows **4** (default)
- Verify the 4 meal cards show:
  - **Breakfast** — Cal 552.5, P 25, C 17.5, F 42.5, fiber 6.25
  - **Lunch** — same as Breakfast
  - **Pre-Workout** ⚡ — Cal 297.5, P 25, C 32.5, F 7.5, fiber 6.25
  - **Post-Workout** 💪 — Cal 297.5, P 25, C 32.5, F 7.5, fiber 6.25
- (Note: fiber per meal = 25/4 = 6.25 since we use 25g default, not the sheet's 30g)

**Slot ordering check:**
- Switch Training Time to **Morning** → meals should reorder: Pre, Post, Lunch, Dinner
- Switch to **Afternoon** → Breakfast, Pre, Post, Dinner

**Smart-bump check:**
- Reset to Training Day, set carbs to **300g** (other macros: 150P / 80F / 25fiber, calories whatever)
- Verify suggestion bumps meal count to **5** (or higher) with reasoning copy
- Verify no 50g warning flags on regular meals

**Peri-weight warning check:**
- Set carbs to **150g**, leave carb weight at 65% → peri = 48.75g per meal (over 45)
- Verify the "Peri-workout meals alone would exceed 45g carbs. Consider lowering the carb weight above." secondary suggestion appears

**Rest-day check:**
- Switch Day Type to **Rest Day**
- Verify N defaults to **3**
- With 100g carbs: Breakfast, Lunch, Dinner — each at 33.3g carbs
- With 200g carbs: suggestion bumps to **5** meals

**Consistency check:**
- Enter calories=2000, P=100, C=100, F=100 → macros imply 1700 cal, off by 300 (>10%)
- Verify yellow consistency warning appears

**Cross-tool link check:**
- Click "Use the Magic Ratio Calculator" link → navigates to `/calculators/magic-ratio`

**Free Resources check:**
- Navigate to http://localhost:3000/free-resources
- Verify 6 cards render with "Meal Frequency Planner" labeled NEW

- [ ] **Step 4: Final commit**

```bash
git add src/App.jsx src/pages/FreeResourcesPage.jsx
git commit -m "feat(meal-frequency): wire route + add to Free Resources page"
```

**Phase 2 complete.** `/calculators/meal-frequency` is live, 6 calcs on `/free-resources`, math sheet-verified.


---

# Wrap-up

After both phases complete, run the full test suite once more to verify no regressions:

```bash
npm test
```

Expected: all tests pass across `pre-workout-glucose/` and `meal-frequency/` modules — roughly 80 unit tests total (40 for each calculator).

Then do a final cross-browser / mobile-width visual pass:
- Desktop (1440×900): 6-card grid, 2 columns
- Tablet (768×1024): 6-card grid, 2 columns
- Mobile (375×812): 6-card grid, 1 column; calculator inputs stack; meal-timeline cards stack 5-col macros into 2-col

If everything looks right, the lead-magnet expansion is done. Open questions deferred to v1.1 are tracked in §7 of the spec.

---

*End of plan.*
