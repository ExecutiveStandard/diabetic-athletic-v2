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
│   ├── compositionRules.js
│   ├── compositionRules.test.js
│   ├── redistribution.js
│   ├── redistribution.test.js
│   ├── planner.js
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
    expect(result.endMmol).toBeLessThan(result.deltaMmol + baseInput.startMmol)
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
            <Button variant="ghost" onClick={reset}>Reset</Button>
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

Spec reference: Appendix A. Pure data table + lookup.

**Files:**
- Create: `src/features/calculators/meal-frequency/slotAssignment.js`
- Create: `src/features/calculators/meal-frequency/slotAssignment.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/slotAssignment.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getSlots } from './slotAssignment'

describe('getSlots — morning training', () => {
  it('N=3 → PW=0, PoW=1', () => {
    expect(getSlots(3, 'morning')).toEqual({ preIdx: 0, postIdx: 1 })
  })
  it('N=5 → PW=0, PoW=1', () => {
    expect(getSlots(5, 'morning')).toEqual({ preIdx: 0, postIdx: 1 })
  })
  it('N=7 → PW=0, PoW=1', () => {
    expect(getSlots(7, 'morning')).toEqual({ preIdx: 0, postIdx: 1 })
  })
})

describe('getSlots — midday training', () => {
  it('N=3 → PW=1 (Lunch), PoW=2 (Supper)', () => {
    expect(getSlots(3, 'midday')).toEqual({ preIdx: 1, postIdx: 2 })
  })
  it('N=4 → PW=1 (Lunch), PoW=2 (Snack)', () => {
    expect(getSlots(4, 'midday')).toEqual({ preIdx: 1, postIdx: 2 })
  })
  it('N=5 → PW=1 (Mid-morning), PoW=2 (Lunch)', () => {
    expect(getSlots(5, 'midday')).toEqual({ preIdx: 1, postIdx: 2 })
  })
  it('N=6 → PW=2 (Lunch), PoW=3 (Afternoon Snack)', () => {
    expect(getSlots(6, 'midday')).toEqual({ preIdx: 2, postIdx: 3 })
  })
})

describe('getSlots — evening training', () => {
  it('N=3 → PW=1, PoW=2', () => {
    expect(getSlots(3, 'evening')).toEqual({ preIdx: 1, postIdx: 2 })
  })
  it('N=4 → PW=2, PoW=3', () => {
    expect(getSlots(4, 'evening')).toEqual({ preIdx: 2, postIdx: 3 })
  })
  it('N=5 → PW=3, PoW=4', () => {
    expect(getSlots(5, 'evening')).toEqual({ preIdx: 3, postIdx: 4 })
  })
  it('N=7 → PW=3, PoW=4', () => {
    expect(getSlots(7, 'evening')).toEqual({ preIdx: 3, postIdx: 4 })
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/slotAssignment.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/slotAssignment.js`:

```js
// Indices are 0-based and refer to the meal array produced for meal count N
// (see Appendix A of the spec for the rationale).
const TABLE = {
  morning: { 3: [0, 1], 4: [0, 1], 5: [0, 1], 6: [0, 1], 7: [0, 1] },
  midday:  { 3: [1, 2], 4: [1, 2], 5: [1, 2], 6: [2, 3], 7: [2, 3] },
  evening: { 3: [1, 2], 4: [2, 3], 5: [3, 4], 6: [3, 4], 7: [3, 4] },
}

export function getSlots(mealCount, trainingTime) {
  const pair = TABLE[trainingTime]?.[mealCount]
  if (!pair) throw new Error(`No slot assignment for N=${mealCount} time=${trainingTime}`)
  return { preIdx: pair[0], postIdx: pair[1] }
}
```

- [ ] **Step 4: Run tests, pass**

Run: `npm test src/features/calculators/meal-frequency/slotAssignment.test.js`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/slotAssignment.js src/features/calculators/meal-frequency/slotAssignment.test.js
git commit -m "feat(meal-frequency): add slot assignment table for training-day meal positions"
```

---

## Task 2.2: Composition rules (`compositionRules.js`)

Spec reference: §4.5.2

**Files:**
- Create: `src/features/calculators/meal-frequency/compositionRules.js`
- Create: `src/features/calculators/meal-frequency/compositionRules.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/compositionRules.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { preWorkoutComposition, PRE_TIMING } from './compositionRules'

describe('preWorkoutComposition', () => {
  it('3+ hours: equal fat, equal fiber, complex carbs', () => {
    expect(preWorkoutComposition(PRE_TIMING.OVER_3HR)).toEqual({
      carbsType: 'complex', fatShare: 1.0, fiberShare: 1.0,
    })
  })
  it('1-3 hours: half fat, half fiber, mostly complex', () => {
    expect(preWorkoutComposition(PRE_TIMING.ONE_TO_THREE_HR)).toEqual({
      carbsType: 'mostly-complex', fatShare: 0.5, fiberShare: 0.5,
    })
  })
  it('<1 hour: zero fat, zero fiber, simple carbs', () => {
    expect(preWorkoutComposition(PRE_TIMING.UNDER_1HR)).toEqual({
      carbsType: 'simple', fatShare: 0, fiberShare: 0,
    })
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/compositionRules.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/compositionRules.js`:

```js
export const PRE_TIMING = {
  OVER_3HR:        'over3hr',
  ONE_TO_THREE_HR: 'one-to-three',
  UNDER_1HR:       'under1hr',
}

const RULES = {
  [PRE_TIMING.OVER_3HR]:        { carbsType: 'complex',         fatShare: 1.0, fiberShare: 1.0 },
  [PRE_TIMING.ONE_TO_THREE_HR]: { carbsType: 'mostly-complex',  fatShare: 0.5, fiberShare: 0.5 },
  [PRE_TIMING.UNDER_1HR]:       { carbsType: 'simple',          fatShare: 0,   fiberShare: 0 },
}

export function preWorkoutComposition(timing) {
  return RULES[timing] || RULES[PRE_TIMING.OVER_3HR]
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/compositionRules.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/compositionRules.js src/features/calculators/meal-frequency/compositionRules.test.js
git commit -m "feat(meal-frequency): add pre-workout meal composition rules by timing"
```

---

## Task 2.3: Fat/fiber redistribution (`redistribution.js`)

Spec reference: §4.5.3

**Files:**
- Create: `src/features/calculators/meal-frequency/redistribution.js`
- Create: `src/features/calculators/meal-frequency/redistribution.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/redistribution.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { redistribute } from './redistribution'

describe('redistribute', () => {
  it('zero pre share: full redistribution to N-1 meals', () => {
    // perMealFat=14, N=5, preFatShare=0 → displaced=14, others get 14 + 14/4 = 17.5 each
    const result = redistribute({ perMealFat: 14, perMealFiber: 5, N: 5, preFatShare: 0, preFiberShare: 0 })
    expect(result.preFat).toBe(0)
    expect(result.preFiber).toBe(0)
    expect(result.otherFat).toBeCloseTo(17.5, 2)
    expect(result.otherFiber).toBeCloseTo(6.25, 2)
  })
  it('half pre share: half is displaced', () => {
    const result = redistribute({ perMealFat: 14, perMealFiber: 5, N: 5, preFatShare: 7, preFiberShare: 2.5 })
    expect(result.preFat).toBe(7)
    expect(result.otherFat).toBeCloseTo(14 + 7 / 4, 2) // 15.75
    expect(result.otherFiber).toBeCloseTo(5 + 2.5 / 4, 2) // 5.625
  })
  it('full pre share: no redistribution', () => {
    const result = redistribute({ perMealFat: 14, perMealFiber: 5, N: 5, preFatShare: 14, preFiberShare: 5 })
    expect(result.otherFat).toBe(14)
    expect(result.otherFiber).toBe(5)
  })
  it('preserves daily totals (fat)', () => {
    const result = redistribute({ perMealFat: 14, perMealFiber: 5, N: 5, preFatShare: 0, preFiberShare: 0 })
    const dailyTotal = result.preFat + result.otherFat * 4
    expect(dailyTotal).toBeCloseTo(70, 2) // 14 × 5 = 70
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/redistribution.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/redistribution.js`:

```js
export function redistribute({ perMealFat, perMealFiber, N, preFatShare, preFiberShare }) {
  const displacedFat   = perMealFat   - preFatShare
  const displacedFiber = perMealFiber - preFiberShare
  const others = N - 1
  return {
    preFat:     preFatShare,
    preFiber:   preFiberShare,
    otherFat:   perMealFat   + (others > 0 ? displacedFat   / others : 0),
    otherFiber: perMealFiber + (others > 0 ? displacedFiber / others : 0),
  }
}
```

- [ ] **Step 4: Tests pass**

Run: `npm test src/features/calculators/meal-frequency/redistribution.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/redistribution.js src/features/calculators/meal-frequency/redistribution.test.js
git commit -m "feat(meal-frequency): add fat/fiber redistribution math"
```

---

## Task 2.4: Planner core (`planner.js`)

Spec reference: §4.2 – §4.5

**Files:**
- Create: `src/features/calculators/meal-frequency/planner.js`
- Create: `src/features/calculators/meal-frequency/planner.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/meal-frequency/planner.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildDayPlan, suggestedMealCount, MEAL_NAMES } from './planner'

const baseInput = {
  calories: 2400,
  protein: 180,
  fat: 70,
  carbs: 240,
  fiber: 25,
  mealCount: 6,
  dayType: 'nonTraining',
}

describe('suggestedMealCount', () => {
  it('200g carbs → 5 meals', () => {
    expect(suggestedMealCount(200)).toBe(5)
  })
  it('240g carbs → 6 meals (ceil(240/40))', () => {
    expect(suggestedMealCount(240)).toBe(6)
  })
  it('100g carbs → clamped up to 3 (minimum)', () => {
    expect(suggestedMealCount(100)).toBe(3)
  })
  it('400g carbs → clamped down to 7 (maximum)', () => {
    expect(suggestedMealCount(400)).toBe(7)
  })
})

describe('MEAL_NAMES', () => {
  it('returns named meals for N=3, 5, 7', () => {
    expect(MEAL_NAMES[3]).toEqual(['Breakfast', 'Lunch', 'Supper'])
    expect(MEAL_NAMES[5].length).toBe(5)
    expect(MEAL_NAMES[7].length).toBe(7)
  })
})

describe('buildDayPlan — non-training day', () => {
  it('produces N meals with equal macro distribution', () => {
    const { meals } = buildDayPlan(baseInput)
    expect(meals.length).toBe(6)
    meals.forEach((m) => {
      expect(m.calories).toBeCloseTo(400, 1)
      expect(m.protein).toBeCloseTo(30, 1)
      expect(m.fat).toBeCloseTo(11.67, 1)
      expect(m.carbs).toBeCloseTo(40, 1)
      expect(m.fiber).toBeCloseTo(4.17, 1)
    })
  })
  it('totals sum to daily inputs', () => {
    const { meals } = buildDayPlan(baseInput)
    const sumCarbs = meals.reduce((s, m) => s + m.carbs, 0)
    expect(sumCarbs).toBeCloseTo(240, 1)
  })
  it('assigns natural meal names', () => {
    const { meals } = buildDayPlan({ ...baseInput, mealCount: 5 })
    expect(meals[0].name).toBe('Breakfast')
    expect(meals[4].name).toBe('Supper')
  })
  it('flags meals exceeding 50g carbs', () => {
    const { meals } = buildDayPlan({ ...baseInput, carbs: 320, mealCount: 5 }) // 64g/meal
    meals.forEach((m) => expect(m.warnOverFifty).toBe(true))
  })
})

describe('buildDayPlan — training day, evening, <1hr pre-workout', () => {
  const trainInput = {
    ...baseInput,
    dayType: 'training',
    trainingTime: 'evening',
    preWorkoutTiming: 'under1hr',
  }

  it('labels pre/post slots correctly', () => {
    const { meals } = buildDayPlan(trainInput)
    // N=6 evening → preIdx=3, postIdx=4
    expect(meals[3].label).toBe('Pre-Workout')
    expect(meals[4].label).toBe('Post-Workout')
  })

  it('pre-workout meal has 0 fat and 0 fiber for <1hr timing', () => {
    const { meals } = buildDayPlan(trainInput)
    expect(meals[3].fat).toBe(0)
    expect(meals[3].fiber).toBe(0)
  })

  it('pre-workout meal has simple carbs', () => {
    const { meals } = buildDayPlan(trainInput)
    expect(meals[3].carbsType).toBe('simple')
  })

  it('post-workout meal has complex carbs', () => {
    const { meals } = buildDayPlan(trainInput)
    expect(meals[4].carbsType).toBe('complex')
  })

  it('displaced fat redistributes — daily fat total preserved', () => {
    const { meals } = buildDayPlan(trainInput)
    const totalFat = meals.reduce((s, m) => s + m.fat, 0)
    expect(totalFat).toBeCloseTo(70, 1)
  })

  it('daily totals identical to non-training', () => {
    const train  = buildDayPlan(trainInput).meals
    const noTrain = buildDayPlan(baseInput).meals
    const sumFn = (key) => (arr) => arr.reduce((s, m) => s + m[key], 0)
    expect(sumFn('calories')(train)).toBeCloseTo(sumFn('calories')(noTrain), 1)
    expect(sumFn('carbs')(train)).toBeCloseTo(sumFn('carbs')(noTrain), 1)
    expect(sumFn('protein')(train)).toBeCloseTo(sumFn('protein')(noTrain), 1)
    expect(sumFn('fat')(train)).toBeCloseTo(sumFn('fat')(noTrain), 1)
    expect(sumFn('fiber')(train)).toBeCloseTo(sumFn('fiber')(noTrain), 1)
  })
})
```

- [ ] **Step 2: Verify failure**

Run: `npm test src/features/calculators/meal-frequency/planner.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/calculators/meal-frequency/planner.js`:

```js
import { getSlots } from './slotAssignment'
import { preWorkoutComposition, PRE_TIMING } from './compositionRules'
import { redistribute } from './redistribution'

export const MEAL_NAMES = {
  3: ['Breakfast', 'Lunch', 'Supper'],
  4: ['Breakfast', 'Lunch', 'Snack', 'Supper'],
  5: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Supper'],
  6: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Supper', 'Evening Snack'],
  7: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Supper', 'Evening Snack', 'Late Snack'],
}

export function suggestedMealCount(dailyCarbs) {
  const raw = Math.ceil(dailyCarbs / 40)
  return Math.max(3, Math.min(7, raw))
}

export function buildDayPlan(input) {
  const { calories, protein, fat, carbs, fiber, mealCount, dayType } = input
  const N = mealCount

  const perMealCalories = calories / N
  const perMealProtein  = protein  / N
  const perMealFat      = fat      / N
  const perMealCarbs    = carbs    / N
  const perMealFiber    = fiber    / N

  const names = MEAL_NAMES[N] || []
  const warnOverFifty = perMealCarbs > 50

  if (dayType === 'nonTraining') {
    const meals = Array.from({ length: N }, (_, i) => ({
      idx: i,
      name: names[i] || `Meal ${i + 1}`,
      label: null,
      carbsType: 'mixed',
      calories: perMealCalories,
      protein:  perMealProtein,
      fat:      perMealFat,
      carbs:    perMealCarbs,
      fiber:    perMealFiber,
      warnOverFifty,
    }))
    return { meals }
  }

  // Training day
  const { trainingTime, preWorkoutTiming } = input
  const { preIdx, postIdx } = getSlots(N, trainingTime)
  const comp = preWorkoutComposition(preWorkoutTiming)
  const preFatShare   = perMealFat   * comp.fatShare
  const preFiberShare = perMealFiber * comp.fiberShare
  const { otherFat, otherFiber } = redistribute({
    perMealFat, perMealFiber, N, preFatShare, preFiberShare,
  })

  const meals = Array.from({ length: N }, (_, i) => {
    const isPre = i === preIdx
    const isPost = i === postIdx
    return {
      idx: i,
      name: names[i] || `Meal ${i + 1}`,
      label: isPre ? 'Pre-Workout' : isPost ? 'Post-Workout' : null,
      carbsType: isPre ? comp.carbsType : isPost ? 'complex' : 'mixed',
      calories: perMealCalories,
      protein:  perMealProtein,
      fat:      isPre ? preFatShare   : otherFat,
      carbs:    perMealCarbs,
      fiber:    isPre ? preFiberShare : otherFiber,
      warnOverFifty,
    }
  })

  return { meals }
}
```

- [ ] **Step 4: Run tests, all pass**

Run: `npm test src/features/calculators/meal-frequency/planner.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/meal-frequency/planner.js src/features/calculators/meal-frequency/planner.test.js
git commit -m "feat(meal-frequency): add core day-plan builder with training/non-training modes"
```

---

## Task 2.5: Calculator component — page shell + inputs

Spec reference: §4.2

**Files:**
- Create: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Create the component**

Create `src/features/calculators/MealFrequencyCalculator.jsx`:

```jsx
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { buildDayPlan, suggestedMealCount } from './meal-frequency/planner'
import { PRE_TIMING } from './meal-frequency/compositionRules'

const TRAINING_TIMES = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday',  label: 'Midday' },
  { id: 'evening', label: 'Evening' },
]

const PRE_TIMINGS = [
  { id: PRE_TIMING.OVER_3HR,        label: '3+ hours before' },
  { id: PRE_TIMING.ONE_TO_THREE_HR, label: '1–3 hours before' },
  { id: PRE_TIMING.UNDER_1HR,       label: '<1 hour before' },
]

export default function MealFrequencyCalculator() {
  const [calories, setCalories] = useState('')
  const [protein,  setProtein]  = useState('')
  const [fat,      setFat]      = useState('')
  const [carbs,    setCarbs]    = useState('')
  const [fiber,    setFiber]    = useState('25')

  const [dayType,           setDayType]           = useState('nonTraining')
  const [trainingTime,      setTrainingTime]      = useState('midday')
  const [preWorkoutTiming,  setPreWorkoutTiming]  = useState(PRE_TIMING.ONE_TO_THREE_HR)

  const carbsNum = parseFloat(carbs) || 0
  const suggestedN = useMemo(() => suggestedMealCount(carbsNum), [carbsNum])
  const [mealCount, setMealCount] = useState(5)

  // Sync mealCount to suggestion when carbs change (only if user hasn't manually overridden recently — simplest: just sync)
  useMemo(() => {
    if (carbsNum > 0) setMealCount(suggestedN)
  }, [carbsNum, suggestedN])

  const plan = useMemo(() => {
    if (!calories || !protein || !fat || !carbs || !fiber) return null
    return buildDayPlan({
      calories: parseFloat(calories),
      protein:  parseFloat(protein),
      fat:      parseFloat(fat),
      carbs:    parseFloat(carbs),
      fiber:    parseFloat(fiber),
      mealCount,
      dayType,
      trainingTime,
      preWorkoutTiming,
    })
  }, [calories, protein, fat, carbs, fiber, mealCount, dayType, trainingTime, preWorkoutTiming])

  const reset = () => {
    setCalories(''); setProtein(''); setFat(''); setCarbs(''); setFiber('25')
    setDayType('nonTraining'); setMealCount(5)
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
            Turn your daily macros into a structured eating plan built around T1D dosing accuracy and the Three-Hour Rule.
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

            {/* Meal count */}
            {carbsNum > 0 && (
              <div>
                <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Meal Count</label>
                <p className="text-xs text-white/50 mb-2">
                  With <strong className="text-white">{carbsNum}g</strong> carbs, we recommend <strong className="text-da-cyan">{suggestedN} meals</strong> — keeps each meal at ~{(carbsNum / suggestedN).toFixed(0)}g carbs (within the 35–45g dosing range).
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[3, 4, 5, 6, 7].map((n) => (
                    <button key={n} type="button" onClick={() => setMealCount(n)}
                      className={`py-3 rounded-lg ${mealCount === n ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day type */}
            <div>
              <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Day Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['nonTraining', 'training'].map((d) => (
                  <button key={d} type="button" onClick={() => setDayType(d)}
                    className={`py-3 rounded-lg ${dayType === d ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                    {d === 'nonTraining' ? 'Non-Training Day' : 'Training Day'}
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
                  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Pre-Workout Meal Timing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRE_TIMINGS.map((t) => (
                      <button key={t.id} type="button" onClick={() => setPreWorkoutTiming(t.id)}
                        className={`py-3 rounded-lg text-sm ${preWorkoutTiming === t.id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-dark border border-white/10 text-white/60'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

          {plan && <MealTimeline plan={plan} dayType={dayType} />}

          <EducationalCards />

          <div className="text-center pt-4">
            <Button variant="ghost" onClick={reset}>Reset</Button>
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
      <p>The Meal Frequency Planner produces structural eating templates based on T1D dosing-accuracy principles. Individual macro needs, insulin responses, and meal tolerances vary widely. The 35–45g carbs-per-meal rule is a heuristic. Always check glucose around meals. Consult your endocrinologist or registered dietitian before significant dietary changes.</p>
    </div>
  )
}
```

- [ ] **Step 2: Visual verify (build only — no route yet)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(meal-frequency): add page shell and all inputs (day-type, training-time, pre-workout-timing)"
```

---

## Task 2.6: Meal timeline rendering

Spec reference: §4.6 cards 3–4

**Files:**
- Modify: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Replace `MealTimeline` placeholder with the real component**

In `MealFrequencyCalculator.jsx`, replace the `MealTimeline` placeholder:

```jsx
function MealTimeline({ plan, dayType }) {
  return (
    <div className="space-y-3">
      <div className="bg-da-card rounded-2xl p-6">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-1">{dayType === 'training' ? 'Training Day' : 'Non-Training Day'} Meal Plan</p>
        <p className="text-white/40 text-sm">Daily totals stay constant across day types — only the structure shifts.</p>
      </div>

      {plan.meals.map((meal) => {
        const isPre  = meal.label === 'Pre-Workout'
        const isPost = meal.label === 'Post-Workout'
        const accentColor = isPre ? '#46C0ED' : isPost ? '#FCC826' : null
        const accentIcon = isPre ? '⚡' : isPost ? '💪' : null

        return (
          <div key={meal.idx}
            className="bg-da-card rounded-2xl p-5 md:p-6"
            style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                {meal.label && (
                  <p className="uppercase tracking-wider text-xs font-bold mb-1" style={{ color: accentColor }}>
                    {accentIcon} {meal.label}
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
git commit -m "feat(meal-frequency): render meal timeline cards with pre/post-workout accents"
```

---

## Task 2.7: Educational cards + coaching notes

Spec reference: §4.6 cards 5–7, §4.7

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
          <p>The timing of your pre-workout meal changes how you should dose insulin for it.</p>
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
git commit -m "feat(meal-frequency): add educational cards (Three-Hour Rule, post-workout sensitivity, coaching notes)"
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
  description: 'Plug in your daily calorie and macro targets — get a structured eating plan that respects the 35-45g carbs-per-meal dosing rule. Generates non-training and training-day templates with pre/post-workout meals adapted to the Three-Hour Rule.',
  badge: 'NEW',
},
```

Update the hero copy from `Five free` to `Six free` (you set this in Task 1.8).

- [ ] **Step 3: Visual QA in browser**

Run: `npm run dev` (if not already running).

Test scenarios:
- http://localhost:3000/free-resources → verify 6 cards, "Meal Frequency Planner" card present
- Click into the new card → http://localhost:3000/calculators/meal-frequency
- Enter: 2400 cal, 180g protein, 70g fat, 240g carbs, 25g fiber
- Verify meal-count suggestion shows "6 meals" with reasoning copy
- Toggle to Training Day → verify training-time + pre-workout-timing inputs appear
- Select Evening + <1hr → verify meal timeline shows:
  - Pre-Workout meal (4th slot) with ⚡ icon, 0g fat, 0g fiber, simple carbs
  - Post-Workout meal (5th slot) with 💪 icon, complex carbs, regular fat/fiber
  - Other meals have boosted fat/fiber (redistribution working)
- Verify educational cards (Three-Hour Rule + Post-Workout + Coach's Notes) render
- Click "Use the Magic Ratio Calculator" link → confirms it navigates to `/calculators/magic-ratio`
- Test with low-carb input (carbs=100g, 4 meals) → verify per-meal carbs is 25g, no warning flag
- Test with high-carb input (carbs=320g, override to 5 meals) → verify warning flag on each meal

- [ ] **Step 4: Final commit**

```bash
git add src/App.jsx src/pages/FreeResourcesPage.jsx
git commit -m "feat(meal-frequency): wire route + add to Free Resources page"
```

**Phase 2 complete.** `/calculators/meal-frequency` is live, 6 calcs on `/free-resources`.

---

# Wrap-up

After both phases complete, run the full test suite once more to verify no regressions:

```bash
npm test
```

Expected: all tests pass across `pre-workout-glucose/` and `meal-frequency/` modules — roughly 60 unit tests total.

Then do a final cross-browser / mobile-width visual pass:
- Desktop (1440×900): 6-card grid, 2 columns
- Tablet (768×1024): 6-card grid, 2 columns
- Mobile (375×812): 6-card grid, 1 column; calculator inputs stack; meal-timeline cards stack 5-col macros into 2-col

If everything looks right, the lead-magnet expansion is done. Open questions deferred to v1.1 are tracked in §7 of the spec.

---

*End of plan.*
