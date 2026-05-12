# TDEE Calculator — Macro Breakdown Extension

| | |
|---|---|
| **Date** | 2026-05-12 |
| **Status** | Approved — awaiting implementation plan |
| **Branch** | `feature/phase-1` |
| **Owner** | Nicholas Caracandas |
| **Related specs** | `2026-05-11-two-new-calculators-design.md` (defines the Meal Frequency Planner this hands off to) |
| **Related file** | `src/features/calculators/CalorieCalculator.jsx` (existing — will be extended) |

---

## 1. Context

The existing TDEE Calculator outputs **BMR → TDEE → goalCalories** but stops at calories. The Meal Frequency Planner (shipped 2026-05-11) requires daily **calories + P + F + C + fiber** as input — which means after a client computes their TDEE they currently have to source macro targets from somewhere else (the coach, a separate calculator, or rough heuristics) before they can use the Meal Frequency Planner.

This spec extends the TDEE Calculator to also output a daily macro breakdown (protein, fat, carbs, fiber) using Phil Graham's *Diabetic Muscle and Fitness Guide* (Chapter 6) recommendations as defaults, with adjustable sliders for power users. A "Use these macros in the Meal Frequency Planner →" CTA passes the values via URL query params for friction-free hand-off to the next tool.

## 2. Audience & Non-Goals

**Primary audience:**
- T1D coaching clients who've computed TDEE and need daily macro targets
- Self-serve users moving from TDEE → meal-planning in a single sitting

**Non-goals (explicit, v1):**
- ❌ No persistent Zustand state across tools — URL query params instead
- ❌ No email-gating of the macros (matches existing pattern: no gates on the math)
- ❌ No edits to the existing TDEE calculator's lead-capture fields (firstName, email) — those stay as-is
- ❌ No new Firebase usage
- ❌ No re-styling the existing TDEE calc UI — only adding the new section below `goalCalories`
- ❌ No new persistent settings (e.g., remembering the user's preferred protein g/kg across sessions)

---

## 3. Formula

### 3.1 Defaults by goal

| Goal | Protein (g/kg/day) | Fat % of cals | Notes |
|---|---|---|---|
| Fat Loss | **1.8** | **20%** | Higher end of Phil Graham's 1.4–2.0 range to protect lean body mass during caloric deficit. 20% fat is mid-range of his 15–25% recommendation for fat-loss phases. |
| Maintain | **1.6** | **25%** | Mid-range protein. Slightly higher fat for satiety on maintenance days. |
| Mass Gain | **1.6** | **25%** | Solid protein floor. Phil suggests 20–30% fat for mass gain — 25% is mid-range. Same fat % as Maintain, but the higher overall calorie pool means **absolute** carb grams are highest on this goal (fuel for training volume). |

### 3.2 Slider ranges

| Slider | Min | Max | Step | Default |
|---|---|---|---|---|
| Protein (g/kg/day) | **1.2** | **2.5** | 0.1 | Goal-specific (see §3.1) |
| Fat (% of calories) | **15%** | **35%** | 1% | Goal-specific (see §3.1) |
| Fiber (g/day) | **30** | **40** | 1 | **30** |

**Fiber rationale**: Phil Graham cites SCAN 2015 — *"at least 30g per day of fibre because this is the minimum amount associated with reduced risk of disease"* (DMF Chapter 6, "What About Fibre Intake?"). The slider floors at 30g (Phil's published minimum) and caps at 40g (which covers aggressive-deficit cases where volume feeding via non-starchy vegetables pushes fiber intake higher). A tooltip beneath the slider explains the SCAN reference and the deficit-case rationale.

### 3.3 Carbs (derived, not adjustable)

```
protein_grams = bodyweight_kg × protein_per_kg
fat_grams     = (fat_percent × goalCalories) / 9
carbs_grams   = (goalCalories - protein_grams×4 - fat_grams×9) / 4
fiber_grams   = (user-selected slider value)
```

Carbs display alongside the other macros but are not directly adjustable. The slider for **protein** and **fat %** indirectly tunes them (increasing either reduces the carb remainder).

**Guard rail**: If protein + fat together exceed goalCalories (mathematically possible at extreme slider positions, e.g., 2.5 g/kg protein at very low goalCalories), carbs clamp to 0 and a warning displays: *"Your protein and fat alone exceed your goal calories. Lower one to make room for carbs, or recheck your TDEE inputs."*

### 3.4 Calorie source

Macros are calculated against `goalCalories` (TDEE ± goal offset), **not** raw TDEE. This matches the user's actual eating target — a 2200 kcal cut-day target distributes macros across 2200, not the higher maintenance TDEE.

### 3.5 Trigger / gating

The macro section appears once **both `activity` and `goal` are picked** — same gating as the existing `goalCalories` display. Until then, the section is hidden.

This mirrors the existing TDEE calc's progressive-reveal pattern (BMR → TDEE once activity picked → goalCalories once goal picked → now macros also gated on goal).

---

## 4. UI Structure

Inserted into `CalorieCalculator.jsx` below the existing `goalCalories` card and above the existing disclaimer footer.

```
┌─ TDEE Calculator page (existing, unchanged above)
│  ├─ Page header
│  ├─ Lead-capture fields (firstName, email) — UNCHANGED
│  ├─ Inputs: gender, units, age, weight, height
│  ├─ Activity picker
│  ├─ Goal picker
│  ├─ BMR card
│  ├─ TDEE card
│  └─ Goal Calories card
│
├─ 🆕 Macro Breakdown card (NEW — gated on activity+goal)
│  ├─ Headline: "Your Daily Macro Targets"
│  ├─ Subtitle: "Calibrated from Phil Graham's Diabetic Muscle and Fitness
│  │              Guide. Adjust the sliders to fine-tune."
│  │
│  ├─ Slider: Protein
│  │   Label: "Protein — {protein_per_kg} g/kg = {protein_grams}g/day"
│  │   Range: 1.2–2.5 g/kg, step 0.1
│  │   Default: goal-specific (see §3.1)
│  │
│  ├─ Slider: Fat
│  │   Label: "Fat — {fat_percent}% of calories = {fat_grams}g/day"
│  │   Range: 15–35%, step 1%
│  │   Default: goal-specific (see §3.1)
│  │
│  ├─ Slider: Fiber
│  │   Label: "Fiber — {fiber_grams}g/day"
│  │   Range: 30–40g, step 1g
│  │   Default: 30g
│  │   Tooltip below: "Phil Graham / SCAN 2015 recommends a minimum 30g/day
│  │                   for general health. Slider goes up to 40g for
│  │                   aggressive-deficit cases where volume feeding via
│  │                   non-starchy vegetables increases fiber intake."
│  │
│  ├─ Result tiles (4-up grid):
│  │   ┌──────────┬──────────┬──────────┬──────────┐
│  │   │ PROTEIN  │  CARBS   │   FAT    │  FIBER   │
│  │   │  135g    │  282g    │   46g    │   30g    │
│  │   │ 540 kcal │ 1126 kcal│ 416 kcal │          │
│  │   │   26%    │   54%    │   20%    │          │
│  │   └──────────┴──────────┴──────────┴──────────┘
│  │   (Carb tile shows "remainder" hint if user hovers)
│  │   (If carbs clamped to 0: warning text per §3.3 replaces the tiles)
│  │
│  └─ CTA Button: "🍽 Use these macros in the Meal Frequency Planner →"
│      Links to: /calculators/meal-frequency?calories=N&protein=N&fat=N&carbs=N&fiber=N
│
└─ Disclaimer (existing, unchanged)
```

### Styling notes
- Use existing brand tokens: `bg-da-card`, `text-da-cyan`, `text-da-gold`, `accent-da-cyan` for sliders
- Result tiles match the visual pattern of the Meal Frequency Planner's meal-card macro tiles (grid-cols-2 md:grid-cols-4, dark backgrounds, centered text)
- Sliders use Tailwind's `accent-da-cyan` for consistency with existing intensity slider in Pre-Workout Glucose Predictor
- CTA button uses `variant="gradient"` (the cyan→gold gradient already used elsewhere on the site)

---

## 5. Cross-Tool Wiring

### 5.1 Outbound (from TDEE calc)

When user clicks the CTA, navigate to:

```
/calculators/meal-frequency?calories={goalCalories}&protein={proteinGrams}&fat={fatGrams}&carbs={carbsGrams}&fiber={fiberGrams}
```

All values are integers (rounded to nearest whole number). Example:
```
/calculators/meal-frequency?calories=2082&protein=135&fat=46&carbs=282&fiber=30
```

Use React Router's `<Link>` component (since the existing calc uses `react-router-dom`).

### 5.2 Inbound (in Meal Frequency Planner)

Add to `MealFrequencyCalculator.jsx`:
1. Import `useSearchParams` from `react-router-dom`
2. On mount (single useEffect), read `?calories`, `?protein`, `?fat`, `?carbs`, `?fiber` from the URL
3. If all five are present and parse as positive numbers, pre-fill the corresponding state values
4. Show a dismissible banner above the inputs:
   > ✨ *Imported from your TDEE calculator results. [Dismiss ×]*

Banner styling: subtle, cyan-bordered, single-line, dismiss button in the corner.

### 5.3 Toolkit-wide consistency fix

The Meal Frequency Planner currently defaults its fiber input to `25g`. To match the new TDEE-output default of `30g`, **bump the Meal Frequency Planner's fiber default from 25 → 30**.

The Meal Frequency Planner's fiber input remains freely editable (10–60g range, unchanged), so users can still go lower if they want. Only the *initial* value when the page loads cold changes.

---

## 6. Architecture

### 6.1 File structure

```
src/features/calculators/
├── CalorieCalculator.jsx                 # MODIFIED — adds macro section
├── MealFrequencyCalculator.jsx           # MODIFIED — useSearchParams read,
│                                         #            fiber default 25→30
├── calorie-tdee/                         # NEW — pure-logic helpers for macros
│   ├── macros.js                         # computeMacros() + DEFAULTS
│   └── macros.test.js                    # Vitest unit tests
└── ... (other existing calcs unchanged)
```

### 6.2 `macros.js` — public surface

```js
// Goal-specific defaults (per §3.1)
export const MACRO_DEFAULTS = {
  loss:     { proteinPerKg: 1.8, fatPercent: 0.20 },
  maintain: { proteinPerKg: 1.6, fatPercent: 0.25 },
  gain:     { proteinPerKg: 1.6, fatPercent: 0.25 },
}

export const FIBER_DEFAULT_G = 30

export const SLIDER_RANGES = {
  protein: { min: 1.2, max: 2.5, step: 0.1 },
  fat:     { min: 0.15, max: 0.35, step: 0.01 },
  fiber:   { min: 30, max: 40, step: 1 },
}

// Pure function — given calories, bodyweight, and slider values,
// return macro grams + derived metrics for display.
export function computeMacros({ goalCalories, bodyweightKg, proteinPerKg, fatPercent, fiberGrams }) {
  // → returns { protein, carbs, fat, fiber, proteinCal, carbsCal, fatCal,
  //             proteinPercent, carbsPercent, fatPercent, carbsClampedToZero }
}
```

### 6.3 React component additions to `CalorieCalculator.jsx`

New state (added to the existing useState block):

```js
const [proteinPerKg, setProteinPerKg] = useState(null)  // null until goal picked
const [fatPercent,   setFatPercent]   = useState(null)
const [fiberGrams,   setFiberGrams]   = useState(FIBER_DEFAULT_G)
```

New useEffect — when `goal` changes, reset `proteinPerKg` and `fatPercent` to goal-specific defaults (so switching between fat-loss and mass-gain updates the sliders to sensible new starting points):

```js
useEffect(() => {
  if (!goal) return
  const defaults = MACRO_DEFAULTS[goal.id]
  setProteinPerKg(defaults.proteinPerKg)
  setFatPercent(defaults.fatPercent)
  // Note: fiber doesn't reset — user's slider position persists across goal changes
}, [goal])
```

New useMemo — derived macros:

```js
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
```

New JSX — macro card rendered between `goalCalories` card and the disclaimer footer, conditional on `macros && goal && activity`.

### 6.4 React component additions to `MealFrequencyCalculator.jsx`

New imports:
```js
import { useSearchParams } from 'react-router-dom'
```

New state:
```js
const [importBannerVisible, setImportBannerVisible] = useState(false)
```

New useEffect — read query params on mount:
```js
const [searchParams] = useSearchParams()
useEffect(() => {
  const cals  = parseFloat(searchParams.get('calories'))
  const prot  = parseFloat(searchParams.get('protein'))
  const ft    = parseFloat(searchParams.get('fat'))
  const carb  = parseFloat(searchParams.get('carbs'))
  const fib   = parseFloat(searchParams.get('fiber'))
  if ([cals, prot, ft, carb, fib].every(v => v > 0)) {
    setCalories(String(cals))
    setProtein(String(prot))
    setFat(String(ft))
    setCarbs(String(carb))
    setFiber(String(fib))
    setImportBannerVisible(true)
  }
}, [])  // empty deps — read once on mount
```

Banner JSX (above the macros input grid):
```jsx
{importBannerVisible && (
  <div className="bg-da-cyan/10 border border-da-cyan/40 rounded-lg p-3 flex items-start justify-between gap-3">
    <p className="text-sm text-white/80">
      ✨ Imported from your TDEE calculator results.
    </p>
    <button type="button" onClick={() => setImportBannerVisible(false)}
      className="text-white/60 hover:text-white text-sm">
      ×
    </button>
  </div>
)}
```

Fiber default bump:
```js
// Was: const [fiber, setFiber] = useState('25')
// Now: const [fiber, setFiber] = useState('30')
```

(Also update the reset function's fiber re-init from `'25'` to `'30'`.)

---

## 7. Testing

### 7.1 Vitest unit tests (`macros.test.js`)

- `computeMacros` returns correct values for the worked-example case (75kg male, 2082 goalCalories, defaults for fat-loss → 135 / 282 / 46 / 30)
- `computeMacros` honors user-adjusted protein g/kg
- `computeMacros` honors user-adjusted fat %
- `computeMacros` carbs clamp to 0 + flag set when protein+fat exceed goalCalories
- Boundary: lowest valid inputs (protein 1.2 g/kg, fat 15%)
- Boundary: highest valid inputs (protein 2.5 g/kg, fat 35%)
- `MACRO_DEFAULTS` has entries for all 3 goal IDs (`loss`, `maintain`, `gain`)

### 7.2 No new React component tests

UI changes are visual; verified manually via `npm run dev` browser inspection during implementation (matches existing pattern from Phase 1/2 of the 2-new-calculators build).

---

## 8. Visual / Brand Consistency

- Macro card matches the visual depth of the existing TDEE result cards (BMR, TDEE, Goal Calories)
- Sliders use the same Tailwind `accent-da-cyan` accent color as the Pre-Workout Glucose Predictor's intensity slider
- Result tiles match the macro-tile pattern from the Meal Frequency Planner's meal cards (same grid layout, same dark backgrounds, same uppercase labels)
- CTA button uses `variant="gradient"` (cyan→gold) — the most prominent button variant, signaling a primary action
- Tooltip on the fiber slider uses the same muted `text-white/40` styling as helper text elsewhere

---

## 9. Open Questions / Decisions Deferred

1. **Goal-specific overrides on Carb display** — Should the carb tile color-code by goal (e.g., higher-carb friendly on mass gain, restrained on fat loss)? Probably not for v1; defer.
2. **Save / share macro plan via URL** — Currently the cross-tool CTA is the only URL with macros. Could also expose a "Copy share link" button so users can save their calc result. Defer.
3. **Auto-sync back from Meal Frequency Planner to TDEE calc** — One-directional for now (TDEE → Meal Frequency only). The reverse direction has no obvious use case.
4. **Macro recalculation on weight change** — Currently the macro section recomputes whenever weight changes (via `metric.weightKg` in the useMemo deps). This is correct but may feel "jumpy" to users typing into the weight field. Not addressing in v1; if it becomes a UX issue, consider debouncing.

---

## 10. References

- Graham, Phil. *The Diabetic Muscle and Fitness Guide.* OMNE Publishing, 2018. Chapter 6 (Nutrition):
  - Protein recommendations: pp. 141–143 (1.4–2.0g/kg for active individuals)
  - Macro splits by goal: pp. 207–208 (fat 15-25% for fat loss, 20-30% for mass gain)
  - Fiber recommendation: SCAN 2015 minimum 30g/day (Chapter 6, "What About Fibre Intake?")
- Nicholas Caracandas's *Done For You Check-In System* master spreadsheet (Macro Timing tab) — peri-workout-weighted distribution used by the Meal Frequency Planner downstream.

---

*End of spec.*
