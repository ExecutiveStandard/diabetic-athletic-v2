# TDEE Calculator — Macro Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing TDEE Calculator to output a daily macro breakdown (protein/fat/carbs/fiber) with adjustable sliders, and wire a cross-tool CTA that passes the macros to the Meal Frequency Planner via URL query params.

**Architecture:** New pure-logic `macros.js` module (Phil Graham DMF-based defaults + computation), consumed by `CalorieCalculator.jsx` via a new always-visible macro section that renders below the existing `goalCalories` card. Cross-tool wiring uses URL query params — no Zustand, no Firebase. `MealFrequencyCalculator.jsx` adds a `useSearchParams` read on mount to auto-fill when arrived at via the cross-tool CTA.

**Tech Stack:** React 19 + Vite + TailwindCSS + react-router-dom 7 (already configured). Vitest for unit tests (already set up).

**Spec source-of-truth:** `docs/superpowers/specs/2026-05-12-tdee-macro-extension-design.md`

**Phases:** 3 tasks, each independently testable. Order matters (Task 1 → Task 2 → Task 3) because Task 2 depends on Task 1's exports and Task 3 verifies the round-trip flow that Tasks 1+2 enable.

---

## File Structure

```
src/features/calculators/
├── CalorieCalculator.jsx                 # MODIFIED (Task 2) — adds macro state + section
├── MealFrequencyCalculator.jsx           # MODIFIED (Task 3) — useSearchParams + fiber default 25→30
├── calorie-tdee/                         # NEW (Task 1) — pure-logic helpers
│   ├── macros.js
│   └── macros.test.js
└── ... (other existing calcs unchanged)
```

---

## Task 1: Macros computation module (`macros.js`)

Spec reference: §3 (Formula) + §6.2 (`macros.js` public surface).

**Files:**
- Create: `src/features/calculators/calorie-tdee/macros.js`
- Create: `src/features/calculators/calorie-tdee/macros.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/features/calculators/calorie-tdee/macros.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  computeMacros,
  MACRO_DEFAULTS,
  FIBER_DEFAULT_G,
  SLIDER_RANGES,
} from './macros'

describe('MACRO_DEFAULTS', () => {
  it('has entries for all 3 goal IDs (loss, maintain, gain)', () => {
    expect(MACRO_DEFAULTS.loss).toEqual({ proteinPerKg: 1.8, fatPercent: 0.20 })
    expect(MACRO_DEFAULTS.maintain).toEqual({ proteinPerKg: 1.6, fatPercent: 0.25 })
    expect(MACRO_DEFAULTS.gain).toEqual({ proteinPerKg: 1.6, fatPercent: 0.25 })
  })
})

describe('FIBER_DEFAULT_G', () => {
  it('is 30 (Phil Graham / SCAN 2015 minimum)', () => {
    expect(FIBER_DEFAULT_G).toBe(30)
  })
})

describe('SLIDER_RANGES', () => {
  it('protein range is 1.2–2.5 g/kg with 0.1 step', () => {
    expect(SLIDER_RANGES.protein).toEqual({ min: 1.2, max: 2.5, step: 0.1 })
  })
  it('fat range is 15-35% with 1% step (stored as decimals)', () => {
    expect(SLIDER_RANGES.fat).toEqual({ min: 0.15, max: 0.35, step: 0.01 })
  })
  it('fiber range is 30-40g with 1g step', () => {
    expect(SLIDER_RANGES.fiber).toEqual({ min: 30, max: 40, step: 1 })
  })
})

describe('computeMacros — worked example (75kg male, fat loss, 2082 goalCal)', () => {
  const result = computeMacros({
    goalCalories: 2082,
    bodyweightKg: 75,
    proteinPerKg: 1.8,
    fatPercent: 0.20,
    fiberGrams: 30,
  })

  it('protein = 1.8 × 75 = 135g', () => {
    expect(result.protein).toBeCloseTo(135, 0)
  })
  it('fat = (0.20 × 2082) / 9 ≈ 46g', () => {
    expect(result.fat).toBeCloseTo(46, 0)
  })
  it('carbs = (2082 − 540 − 416) / 4 ≈ 282g', () => {
    expect(result.carbs).toBeCloseTo(282, 0)
  })
  it('fiber pass-through = 30g', () => {
    expect(result.fiber).toBe(30)
  })
  it('proteinCal = 540 kcal (135 × 4)', () => {
    expect(result.proteinCal).toBeCloseTo(540, 0)
  })
  it('fatCal = 416 kcal (46.3 × 9)', () => {
    expect(result.fatCal).toBeCloseTo(416, 0)
  })
  it('carbsCal = 1126 kcal (≈ 281.6 × 4)', () => {
    expect(result.carbsCal).toBeCloseTo(1126, 0)
  })
  it('percentages sum to ~100%', () => {
    const total = result.proteinPercent + result.fatPercent + result.carbsPercent
    expect(total).toBeCloseTo(100, 0)
  })
  it('carbsClampedToZero is false in normal case', () => {
    expect(result.carbsClampedToZero).toBe(false)
  })
})

describe('computeMacros — adjusted protein g/kg', () => {
  it('respects slider-adjusted proteinPerKg', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 80,
      proteinPerKg: 2.2,
      fatPercent: 0.25,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(176, 0)  // 2.2 × 80
  })
})

describe('computeMacros — adjusted fat %', () => {
  it('respects slider-adjusted fatPercent', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 70,
      proteinPerKg: 1.6,
      fatPercent: 0.35,
      fiberGrams: 30,
    })
    expect(r.fat).toBeCloseTo(78, 0)  // (0.35 × 2000) / 9 ≈ 77.8
  })
})

describe('computeMacros — guard rail (protein + fat exceed calories)', () => {
  it('clamps carbs to 0 and sets carbsClampedToZero flag', () => {
    // Pathological inputs: very high protein at very low cals
    const r = computeMacros({
      goalCalories: 800,
      bodyweightKg: 100,
      proteinPerKg: 2.5,   // 250g protein = 1000 kcal — already exceeds 800
      fatPercent: 0.30,
      fiberGrams: 30,
    })
    expect(r.carbs).toBe(0)
    expect(r.carbsClampedToZero).toBe(true)
  })
})

describe('computeMacros — boundary slider values', () => {
  it('lowest valid: protein 1.2 g/kg + fat 15%', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 70,
      proteinPerKg: 1.2,
      fatPercent: 0.15,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(84, 0)
    expect(r.fat).toBeCloseTo(33, 0)
    expect(r.carbsClampedToZero).toBe(false)
  })
  it('highest valid: protein 2.5 g/kg + fat 35%', () => {
    const r = computeMacros({
      goalCalories: 2500,
      bodyweightKg: 75,
      proteinPerKg: 2.5,
      fatPercent: 0.35,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(187.5, 0)
    expect(r.fat).toBeCloseTo(97, 0)
    expect(r.carbsClampedToZero).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/features/calculators/calorie-tdee/macros.test.js`
Expected: FAIL — "Cannot find module './macros'"

- [ ] **Step 3: Implement the module**

Create `src/features/calculators/calorie-tdee/macros.js`:

```js
// Goal-specific macro defaults — drawn from Phil Graham's
// Diabetic Muscle and Fitness Guide (Chapter 6).
// Goal IDs match CalorieCalculator.jsx's existing GOALS array.
export const MACRO_DEFAULTS = {
  loss:     { proteinPerKg: 1.8, fatPercent: 0.20 },
  maintain: { proteinPerKg: 1.6, fatPercent: 0.25 },
  gain:     { proteinPerKg: 1.6, fatPercent: 0.25 },
}

// Default fiber grams — Phil Graham cites SCAN 2015 minimum of 30g/day.
export const FIBER_DEFAULT_G = 30

// Slider bounds. fatPercent is stored as a decimal (0.15 = 15%).
export const SLIDER_RANGES = {
  protein: { min: 1.2,  max: 2.5,  step: 0.1  },
  fat:     { min: 0.15, max: 0.35, step: 0.01 },
  fiber:   { min: 30,   max: 40,   step: 1    },
}

const KCAL_PER_G_PROTEIN = 4
const KCAL_PER_G_CARBS   = 4
const KCAL_PER_G_FAT     = 9

export function computeMacros({
  goalCalories,
  bodyweightKg,
  proteinPerKg,
  fatPercent,
  fiberGrams,
}) {
  const protein    = bodyweightKg * proteinPerKg
  const fat        = (fatPercent * goalCalories) / KCAL_PER_G_FAT
  const proteinCal = protein * KCAL_PER_G_PROTEIN
  const fatCal     = fat * KCAL_PER_G_FAT

  const remainingCal = goalCalories - proteinCal - fatCal
  const carbsClampedToZero = remainingCal < 0
  const carbs = carbsClampedToZero ? 0 : remainingCal / KCAL_PER_G_CARBS
  const carbsCal = carbs * KCAL_PER_G_CARBS

  return {
    protein,
    carbs,
    fat,
    fiber: fiberGrams,
    proteinCal,
    carbsCal,
    fatCal,
    proteinPercent: (proteinCal / goalCalories) * 100,
    carbsPercent:   (carbsCal   / goalCalories) * 100,
    fatPercent:     (fatCal     / goalCalories) * 100,
    carbsClampedToZero,
  }
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npm test src/features/calculators/calorie-tdee/macros.test.js`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/calorie-tdee/macros.js src/features/calculators/calorie-tdee/macros.test.js
git commit -m "feat(calorie-tdee): add macro computation module"
```

---

## Task 2: Macro section in `CalorieCalculator.jsx`

Spec reference: §4 (UI Structure) + §6.3 (React component additions).

**Files:**
- Modify: `src/features/calculators/CalorieCalculator.jsx`

This task adds the macro state, computation, and the new UI section. There are no unit tests — visual verification only.

- [ ] **Step 1: Add imports at the top of the file**

In `src/features/calculators/CalorieCalculator.jsx`, find the existing import block (lines 1-3):

```js
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
```

Replace it with:

```js
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import {
  computeMacros,
  MACRO_DEFAULTS,
  FIBER_DEFAULT_G,
  SLIDER_RANGES,
} from './calorie-tdee/macros'
```

- [ ] **Step 2: Add macro state**

Inside the `PreWorkoutGlucoseCalculator`-style component body (find the line that says `const [goal, setGoal] = useState(null)` near line 45). Immediately AFTER that line, add the macro state:

```js
  // Macro state — initialized to null; set by useEffect when goal is picked.
  const [proteinPerKg, setProteinPerKg] = useState(null)
  const [fatPercent,   setFatPercent]   = useState(null)
  const [fiberGrams,   setFiberGrams]   = useState(FIBER_DEFAULT_G)
```

- [ ] **Step 3: Add the goal-change reset useEffect**

Find the existing `const goalCalories = useMemo(...)` block (around line 74). Immediately AFTER its closing `}, [tdee, goal])` line, add:

```js
  // When goal changes, reset protein/fat sliders to goal-specific defaults.
  // Fiber is not reset — user's slider position persists across goal changes.
  useEffect(() => {
    if (!goal) return
    const defaults = MACRO_DEFAULTS[goal.id]
    if (!defaults) return
    setProteinPerKg(defaults.proteinPerKg)
    setFatPercent(defaults.fatPercent)
  }, [goal])
```

- [ ] **Step 4: Add the macros useMemo**

Immediately AFTER the useEffect added in Step 3, add:

```js
  // Derived macros — recompute whenever any input changes.
  const macros = useMemo(() => {
    if (!goalCalories || !metric.weightKg || proteinPerKg == null) return null
    return computeMacros({
      goalCalories,
      bodyweightKg: metric.weightKg,
      proteinPerKg,
      fatPercent,
      fiberGrams,
    })
  }, [goalCalories, metric.weightKg, proteinPerKg, fatPercent, fiberGrams])

  // URL query string for cross-tool hand-off to the Meal Frequency Planner.
  const macroQueryString = useMemo(() => {
    if (!macros || !goalCalories) return ''
    const params = new URLSearchParams({
      calories: Math.round(goalCalories).toString(),
      protein:  Math.round(macros.protein).toString(),
      fat:      Math.round(macros.fat).toString(),
      carbs:    Math.round(macros.carbs).toString(),
      fiber:    Math.round(macros.fiber).toString(),
    })
    return `?${params.toString()}`
  }, [macros, goalCalories])
```

- [ ] **Step 5: Update the `reset()` function**

Find the existing `reset()` function (lines 79-83). Replace it with:

```js
  const reset = () => {
    setFirstName(''); setEmail(''); setAge(''); setWeight('')
    setHeightCm(''); setHeightFt(''); setHeightIn('')
    setActivity(null); setGoal(null)
    setProteinPerKg(null); setFatPercent(null); setFiberGrams(FIBER_DEFAULT_G)
  }
```

- [ ] **Step 6: Add the macro section JSX**

Find the closing `</section>` of "Step 6: Goal Calorie Result" (around line 339, the `</section>` just before the `<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">` action buttons).

Insert this new section IMMEDIATELY AFTER that closing `</section>` and BEFORE the action buttons div:

```jsx
          {/* ============== STEP 7: Macro Breakdown ============== */}
          {macros && (
            <section>
              <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-2">
                Your Daily Macro Targets
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Calibrated from Phil Graham's <em>Diabetic Muscle and Fitness Guide</em>. Adjust the sliders to fine-tune.
              </p>

              {/* Protein slider */}
              <div className="mb-5">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Protein — {proteinPerKg.toFixed(1)} g/kg = <span className="text-da-cyan">{Math.round(macros.protein)}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.protein.min}
                  max={SLIDER_RANGES.protein.max}
                  step={SLIDER_RANGES.protein.step}
                  value={proteinPerKg}
                  onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{SLIDER_RANGES.protein.min}</span>
                  <span>{SLIDER_RANGES.protein.max} g/kg</span>
                </div>
              </div>

              {/* Fat slider */}
              <div className="mb-5">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Fat — {Math.round(fatPercent * 100)}% of calories = <span className="text-da-cyan">{Math.round(macros.fat)}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.fat.min}
                  max={SLIDER_RANGES.fat.max}
                  step={SLIDER_RANGES.fat.step}
                  value={fatPercent}
                  onChange={(e) => setFatPercent(parseFloat(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{Math.round(SLIDER_RANGES.fat.min * 100)}%</span>
                  <span>{Math.round(SLIDER_RANGES.fat.max * 100)}%</span>
                </div>
              </div>

              {/* Fiber slider */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-bold mb-2">
                  Fiber — <span className="text-da-cyan">{fiberGrams}g/day</span>
                </label>
                <input
                  type="range"
                  min={SLIDER_RANGES.fiber.min}
                  max={SLIDER_RANGES.fiber.max}
                  step={SLIDER_RANGES.fiber.step}
                  value={fiberGrams}
                  onChange={(e) => setFiberGrams(parseInt(e.target.value))}
                  className="w-full accent-da-cyan"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{SLIDER_RANGES.fiber.min}g</span>
                  <span>{SLIDER_RANGES.fiber.max}g</span>
                </div>
                <p className="text-xs text-white/40 mt-2 italic">
                  Phil Graham / SCAN 2015 recommends a minimum 30g/day for general health. Slider goes up to 40g for aggressive-deficit cases where volume feeding via non-starchy vegetables increases fiber intake.
                </p>
              </div>

              {/* Result tiles or guard-rail warning */}
              {macros.carbsClampedToZero ? (
                <div className="bg-red-500/15 border border-red-500/40 rounded-lg p-4 text-red-200 text-sm">
                  ⚠️ Your protein and fat alone exceed your goal calories. Lower one to make room for carbs, or recheck your TDEE inputs.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Protein', grams: macros.protein, cal: macros.proteinCal, pct: macros.proteinPercent, color: 'da-cyan' },
                    { label: 'Carbs',   grams: macros.carbs,   cal: macros.carbsCal,   pct: macros.carbsPercent,   color: 'white' },
                    { label: 'Fat',     grams: macros.fat,     cal: macros.fatCal,     pct: macros.fatPercent,     color: 'da-gold' },
                    { label: 'Fiber',   grams: macros.fiber,   cal: null,              pct: null,                  color: 'white' },
                  ].map(({ label, grams, cal, pct, color }) => (
                    <div key={label} className="bg-da-darker/60 rounded-lg p-4 text-center">
                      <p className={`text-[10px] uppercase tracking-wider text-${color === 'white' ? 'white/60' : color} mb-1 font-bold`}>{label}</p>
                      <p className="text-2xl font-black text-white">{Math.round(grams)}<span className="text-xs text-white/40 ml-1">g</span></p>
                      {cal != null && (
                        <p className="text-xs text-white/40 mt-1">{Math.round(cal)} kcal</p>
                      )}
                      {pct != null && (
                        <p className="text-xs text-white/40">{Math.round(pct)}%</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cross-tool CTA */}
              {!macros.carbsClampedToZero && (
                <Link to={`/calculators/meal-frequency${macroQueryString}`}>
                  <Button type="button" variant="gradient" size="lg" className="w-full">
                    🍽 Use these macros in the Meal Frequency Planner →
                  </Button>
                </Link>
              )}
            </section>
          )}

```

- [ ] **Step 7: Build verify**

Run: `npm run build`
Expected: build succeeds, no syntax errors, no React warnings.

- [ ] **Step 8: Commit**

```bash
git add src/features/calculators/CalorieCalculator.jsx
git commit -m "feat(calorie-tdee): add macro breakdown section with adjustable sliders + cross-tool CTA"
```

---

## Task 3: Meal Frequency Planner — URL params auto-fill + fiber default bump

Spec reference: §5.2 (Inbound) + §5.3 (Toolkit-wide consistency fix) + §6.4 (React component additions).

**Files:**
- Modify: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Add `useSearchParams` to the react-router-dom import**

In `src/features/calculators/MealFrequencyCalculator.jsx`, find the existing import line:

```js
import { Link } from 'react-router-dom'
```

Replace it with:

```js
import { Link, useSearchParams } from 'react-router-dom'
```

- [ ] **Step 2: Bump fiber default in the useState declaration**

Find the existing line (near the top of the component body):

```js
  const [fiber,    setFiber]    = useState('25')
```

Replace with:

```js
  const [fiber,    setFiber]    = useState('30')
```

(The matching change to the `reset()` function is in Step 5 below — done together with the import-banner reset.)

- [ ] **Step 3: Add import-banner state**

After the existing `setUserOverrodeN` state declaration (the last `useState` in the component body), add:

```js
  const [importBannerVisible, setImportBannerVisible] = useState(false)
```

- [ ] **Step 4: Add the URL-params read useEffect**

After the `importBannerVisible` state declaration, add the useEffect that reads query params on mount:

```js
  // On mount, if the URL contains macro query params (from TDEE calc hand-off),
  // pre-fill the input fields and show the import banner.
  const [searchParams] = useSearchParams()
  useEffect(() => {
    const cals  = parseFloat(searchParams.get('calories'))
    const prot  = parseFloat(searchParams.get('protein'))
    const ft    = parseFloat(searchParams.get('fat'))
    const carb  = parseFloat(searchParams.get('carbs'))
    const fib   = parseFloat(searchParams.get('fiber'))
    if ([cals, prot, ft, carb, fib].every((v) => Number.isFinite(v) && v > 0)) {
      setCalories(String(cals))
      setProtein(String(prot))
      setFat(String(ft))
      setCarbs(String(carb))
      setFiber(String(fib))
      setImportBannerVisible(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Read once on mount
```

- [ ] **Step 5: Update the `reset()` function**

Find the existing `reset()` function:

```js
  const reset = () => {
    setCalories(''); setProtein(''); setFat(''); setCarbs(''); setFiber('25')
    setDayType('rest'); setCarbWeight(0.65); setFatWeight(0.15)
    setUserOverrodeN(false); setMealCount(defaultMealCount('rest'))
  }
```

Replace with:

```js
  const reset = () => {
    setCalories(''); setProtein(''); setFat(''); setCarbs(''); setFiber('30')
    setDayType('rest'); setCarbWeight(0.65); setFatWeight(0.15)
    setUserOverrodeN(false); setMealCount(defaultMealCount('rest'))
    setImportBannerVisible(false)
  }
```

- [ ] **Step 6: Add the import banner JSX**

Find the JSX where the calculator's input card opens — search for the `<div className="bg-da-card rounded-2xl p-6 md:p-8 space-y-6">` line. Immediately INSIDE that div, BEFORE the Daily Totals grid (`<div className="grid grid-cols-2 md:grid-cols-5 gap-3">`), add:

```jsx
            {importBannerVisible && (
              <div className="bg-da-cyan/10 border border-da-cyan/40 rounded-lg p-3 flex items-start justify-between gap-3">
                <p className="text-sm text-white/80">
                  ✨ Imported from your TDEE calculator results.
                </p>
                <button type="button" onClick={() => setImportBannerVisible(false)}
                  className="text-white/60 hover:text-white text-sm" aria-label="Dismiss">
                  ×
                </button>
              </div>
            )}
```

- [ ] **Step 7: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(meal-frequency): auto-fill from URL params + bump fiber default 25g→30g"
```

---

# Wrap-up

After all 3 tasks complete, run the full test suite to verify no regressions:

```bash
npm test
```

Expected: all tests pass (previous 85 + new ~15 from Task 1 = **~100 unit tests total**).

Then do a full cross-tool integration check in the browser:

1. Navigate to http://localhost:3000/calculators/calorie
2. Fill in: First Name "Test", Email "test@test.com", Age 30, Weight 75kg (metric), Height 178cm, Activity "Moderate", Goal "Weight Loss"
3. Verify BMR / TDEE / Goal Calories appear (~1721 / 2582 / 2082)
4. Verify the **new Macro Breakdown section** appears below Goal Calories with:
   - Protein slider at **1.8 g/kg = 135g**
   - Fat slider at **20% = 46g**
   - Fiber slider at **30g**
   - Result tiles: P 135g / C ~282g / F 46g / Fiber 30g
5. Drag the Protein slider to 2.2 g/kg → P updates to **165g**, C updates downward
6. Drag the Fat slider to 30% → F updates upward, C updates downward
7. Drag the Fiber slider to 35g → Fiber tile shows 35g
8. Reset sliders to default by clicking another goal then back (or use Reset button)
9. Click "**🍽 Use these macros in the Meal Frequency Planner →**"
10. URL should be `/calculators/meal-frequency?calories=2082&protein=135&fat=46&carbs=282&fiber=30`
11. Meal Frequency Planner should:
    - Show the **✨ Imported from your TDEE calculator results** banner
    - Have all 5 macro fields pre-filled
    - Compute and display the meal timeline immediately (since macros are now valid)
12. Click the × on the import banner — banner dismisses cleanly
13. Navigate directly to http://localhost:3000/calculators/meal-frequency (no query params) — verify it opens with fiber defaulting to **30g** (not 25g) and no banner

If all steps pass, the TDEE → Meal Frequency hand-off flow is complete.

---

*End of plan.*
