# Workout Fueling Calculator — Rename + HR Zone Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the existing Pre-Workout Glucose Predictor to Workout Fueling Calculator across 5 copy locations, and add a Heart Rate Zone selector that conditionally replaces the RPE slider for Aerobic workouts (mapping to existing intensity bands so the underlying math stays unchanged).

**Architecture:** Two single-file modifications. The first updates `PreWorkoutGlucoseCalculator.jsx` (heading/subtitle copy + new `hrZone` state + new `HR_ZONES` and `INTENSITY_RPE_FROM_BAND` constants + conditional JSX block + useMemo update + reset update). The second updates the corresponding entry in `FreeResourcesPage.jsx`'s `calculators` array (name, tagline, description). No math, no new files, no new unit tests.

**Tech Stack:** React 19 + Vite + TailwindCSS + react-router-dom 7 (already configured). Vitest available (not used in this plan — no math changes mean no new unit tests).

**Spec source-of-truth:** `docs/superpowers/specs/2026-05-13-workout-fueling-calculator-rename-design.md`

**Phases:** 2 tasks, both small. Order matters slightly — Task 1 changes the calculator itself; Task 2 updates the public-facing card that links to it. Either could ship independently, but doing Task 1 first means the new name only "leaks" to users via the Free Resources page after both land.

---

## File Structure

```
src/features/calculators/
└── PreWorkoutGlucoseCalculator.jsx       # MODIFIED (Task 1)
                                          #   - Heading + pre-header tag + subtitle copy
                                          #   - 1 new useState (hrZone)
                                          #   - 2 new module constants (HR_ZONES, INTENSITY_RPE_FROM_BAND)
                                          #   - useMemo prediction updated to derive intensity from zone for aerobic
                                          #   - JSX block replacing RPE slider with conditional render
                                          #   - reset() updated to clear hrZone

src/pages/
└── FreeResourcesPage.jsx                 # MODIFIED (Task 2)
                                          #   - calculators[slug='pre-workout-glucose'] entry updated:
                                          #     name, tagline, description fields
```

No new files. No file deletions. No URL changes. No math changes.

---

## Task 1: Calculator rename + HR Zone selector

Spec reference: §3.1, §3.2, §3.3, §4 (entire HR Zone section), §6.2.

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

This task makes all changes to the calculator component itself. It is a UI-heavy task with no new unit tests — the existing 41 unit tests in `pre-workout-glucose/` all continue to pass because the underlying math is unchanged. Verification is via `npm run build` plus the existing test suite.

- [ ] **Step 1: Add the two new module-level constants**

In `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`, find the existing module-level constants block:

```js
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
```

Append two new constants immediately after `TIME_OF_DAY` (before the `export default function PreWorkoutGlucoseCalculator()` line):

```js
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
```

- [ ] **Step 2: Add the `hrZone` state**

Find the existing workout state declarations:

```js
  // Workout
  const [workoutType, setWorkoutType] = useState('aerobic')
  const [intensity, setIntensity] = useState(5)
  const [duration, setDuration] = useState('')
```

Add `hrZone` immediately after `setIntensity`:

```js
  // Workout
  const [workoutType, setWorkoutType] = useState('aerobic')
  const [intensity, setIntensity] = useState(5)
  const [hrZone, setHrZone] = useState('Z3')  // Default: Zone 3 (Moderate Effort)
  const [duration, setDuration] = useState('')
```

- [ ] **Step 3: Update the prediction useMemo to derive intensity from HR Zone when Aerobic**

Find the existing `prediction` useMemo. It currently passes `intensity` directly:

```js
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
```

Replace the entire useMemo block with this version that derives `effectiveIntensity` from `hrZone` when `workoutType === 'aerobic'`, and adds `hrZone` to the dependency array:

```js
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
    })
  }, [startGlucose, glucoseUnit, trendArrow, workoutType, intensity, hrZone, duration, effectiveIob, hasRecentCarbs, recentGrams, recentMinutesAgo, weight, weightUnit, timeOfDay])
```

The only differences from the original: (1) new `effectiveIntensity` derivation above the `predictEndGlucose` call, (2) `intensity: effectiveIntensity` passed instead of `intensity`, and (3) `hrZone` added to the deps array (between `intensity` and `duration`).

- [ ] **Step 4: Update the `reset()` function**

Find the existing `reset()` function:

```js
  const reset = () => {
    setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
    setIntensity(5); setDuration(''); setIobUnits('')
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
  }
```

(One addition: `setHrZone('Z3')` added after `setIntensity(5)`.)

- [ ] **Step 5: Update the page header JSX (heading, pre-header tag, subtitle)**

Find the existing page header JSX block. It's inside the first `<section>` and currently looks like:

```jsx
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
```

Replace with:

```jsx
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
```

Three changes: pre-header label text (`Pre-Workout Calculator` → `Workout Fueling Calculator`), H1 content + cyan accent word (`Pre-Workout <span>Glucose</span> Predictor` → `Workout <span>Fueling</span> Calculator`), and subtitle paragraph text.

- [ ] **Step 6: Replace the RPE slider block with a conditional render (HR Zone selector for aerobic, RPE slider for all others)**

Find the existing intensity slider block:

```jsx
  {/* Intensity */}
  <div>
    <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Intensity (RPE 1–10) — {intensity}</label>
    <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
      className="w-full accent-da-cyan" />
    <div className="flex justify-between text-xs text-white/40 mt-1">
      <span>Easy</span><span>Moderate</span><span>Hard</span><span>Very Hard</span>
    </div>
  </div>
```

Replace the entire `{/* Intensity */}` block with this conditional render:

```jsx
  {/* Intensity — HR Zone selector for aerobic, RPE slider for everything else */}
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
```

The non-aerobic branch (the `else` part inside the ternary) is the original RPE slider unchanged — same JSX as before, just now wrapped in the conditional.

- [ ] **Step 7: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 8: Run full test suite to confirm no regressions**

Run: `npm test`
Expected: all 104 existing tests pass (no changes to test count; no tests added or modified).

- [ ] **Step 9: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(workout-fueling): rename calculator + add HR Zone selector for aerobic workouts"
```

---

## Task 2: Free Resources card data update

Spec reference: §3.4, §3.5, §6.3.

**Files:**
- Modify: `src/pages/FreeResourcesPage.jsx`

- [ ] **Step 1: Update the `pre-workout-glucose` entry in the `calculators` array**

In `src/pages/FreeResourcesPage.jsx`, find the entry in the `calculators` array whose `slug` is `'pre-workout-glucose'`. It currently looks like this:

```js
{
  slug: 'pre-workout-glucose',
  name: 'Pre-Workout Glucose Predictor',
  tagline: 'Predict end-glucose before you train',
  description: 'Plug in your starting glucose, CGM trend, IOB, and the workout you\'re about to do. Get a literature-grounded prediction of where your glucose will land and whether you need to fuel up first. Built on Riddell consensus + EXTOD guidelines.',
  badge: 'NEW',
},
```

Replace the entire object with:

```js
{
  slug: 'pre-workout-glucose',
  name: 'Workout Fueling Calculator',
  tagline: 'Fuel your training, stay in range',
  description: 'Calculate exactly how much glucose you need to fuel your workout and stay in range. Plug in your glucose, your active insulin, and what training you\'re about to do — get back a clear fueling plan so you can train hard without crashing.',
  badge: 'NEW',
},
```

Three fields change (`name`, `tagline`, `description`). The `slug` and `badge` fields stay exactly as-is. Slug stays so the URL doesn't break.

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FreeResourcesPage.jsx
git commit -m "feat(workout-fueling): update Free Resources card to new name + plain-English description"
```

---

# Wrap-up

After both tasks complete:

1. Run the full test suite once more to confirm zero regressions:
   ```bash
   npm test
   ```
   Expected: 104 tests pass (unchanged).

2. Do a manual visual QA in the browser. Open http://localhost:3000/free-resources and verify:
   - The 5th calculator card now reads `Workout Fueling Calculator` with tagline `Fuel your training, stay in range`
   - The card description matches the new plain-English copy (no jargon)
   - The `NEW` badge is still present

3. Click into the calculator. Verify:
   - Pre-header tag reads `⚡ WORKOUT FUELING CALCULATOR`
   - H1 reads `Workout Fueling Calculator` with "Fueling" in cyan
   - Subtitle reads the new copy ("Know how much glucose you need to fuel your workout...")

4. Test the HR Zone selector:
   - With workout type = `Aerobic` (the default), the intensity input shows 5 zone buttons (Z1–Z5) with labels and HRR% ranges. Default selection is Z3.
   - Switching workout type to `Anaerobic`, `Mixed`, or `Strength` → zone buttons disappear, original RPE slider reappears
   - Switching back to `Aerobic` → zone buttons return with Z3 still selected (state preserved)
   - Clicking a different zone (e.g., Z1) and viewing the prediction → confirm the predicted end-glucose updates appropriately (Z1 = `easy` band should produce less glucose drop than Z3 = `moderate`)
   - Click `Calculate them here ↗` link → opens `/calculators/cardio` in a new tab; original calculator state preserved

5. Math sanity check (no regression): With the original RPE slider at `5` and the HR Zone at `Z3`, the predicted end-glucose should be identical (both resolve to `moderate` band). Test:
   - Set workout type to Aerobic, Z3 → note predicted end-glucose
   - Set workout type to Anaerobic, RPE 5 → confirm same intensity band logic produces a different (but consistent) prediction for anaerobic

6. Reset button: click → all inputs clear, hrZone returns to `Z3`, workoutType returns to `aerobic`.

If all the above checks pass, the rename and HR Zone integration is complete.

---

*End of plan.*
