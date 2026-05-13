# Workout Fueling Calculator — Rename + HR Zone Integration

| | |
|---|---|
| **Date** | 2026-05-13 |
| **Status** | Approved — awaiting implementation plan |
| **Branch** | `feature/phase-1` |
| **Owner** | Nicholas Caracandas |
| **Related specs** | `2026-05-11-two-new-calculators-design.md` (original Pre-Workout Glucose Predictor spec — the calculator being modified here) |
| **Related file** | `src/features/calculators/PreWorkoutGlucoseCalculator.jsx` (existing — will be extended) |

---

## 1. Context

The existing `/calculators/pre-workout-glucose` route shipped a calculator named **"Pre-Workout Glucose Predictor"** with a tagline emphasizing prediction. While the underlying math and inputs work correctly, the *positioning* is misaligned with how T1D athletes actually use the tool: they want to know **how much glucose to consume to fuel the workout and avoid intra-workout lows**, not primarily to *predict* an end-glucose number.

This spec applies a **targeted rename + one input addition** to better align the calculator with its real purpose. It explicitly does **NOT** change the underlying math, the 9 inputs (other than the new HR Zone selector that conditionally replaces the RPE slider for aerobic workouts), or the output structure.

The calculator already outputs both pieces of useful information — a glucose-needed recommendation AND an end-glucose prediction. The rename simply emphasizes the fueling-first framing in the heading, subtitle, and Free Resources card description.

## 2. Audience & Non-Goals

**Primary audience:**
- T1D athletes browsing `/free-resources` looking for a workout-fueling tool
- Existing users who currently arrive at the calculator via the cardio calc, hero CTAs, or direct links

**Non-goals (explicit, v1):**
- ❌ **No math/formula changes.** The existing `predictEndGlucose` function in `prediction.js` and the `BASE_RATE_PER_MIN` / `IOB_AMPLIFIER` / `INTENSITY_SCALER` / `TREND_PER_MIN` / `TYPE_CARB_UTILIZATION` / `TIME_OF_DAY_PER_MIN` coefficient tables stay exactly as-is.
- ❌ **No output structure changes.** The 5 result cards (Headline / Recommendation / Why this prediction / During-Workout Tips / Post-Workout Brief) all stay as they are today, with the existing risk-band coloring and `gramsNeeded` carb recommendation.
- ❌ **No URL change.** The route `/calculators/pre-workout-glucose` stays unchanged for link stability. Only the *displayed* name updates.
- ❌ **No removal of any of the 9 inputs.** Starting glucose, CGM trend, workout type, intensity, duration, IOB, recent carbs, body weight, time of day — all preserved.
- ❌ **No restructuring of the output into "pre + during" split or schedule.** Earlier brainstorming explored this; the user confirmed the current single-recommendation format is correct.
- ❌ **No "secondary end-glucose display" treatment.** Earlier brainstorming explored downplaying the end-glucose number; the user confirmed it should stay as the current headline.
- ❌ **No new educational content beyond a single helper link.** The "Don't know your zones?" treatment is a small italic link, not a tutorial or modal.

---

## 3. Copy Changes

The rename ripples to **5 locations**. The new copy emphasizes **fueling-first** framing while still acknowledging the end-glucose prediction as a secondary benefit.

### 3.1 Page pre-header tag (gold uppercase label above the H1)

| Before | After |
|---|---|
| `⚡ PRE-WORKOUT CALCULATOR` | `⚡ WORKOUT FUELING CALCULATOR` |

### 3.2 Page H1 heading (with one word in cyan accent)

| Before | After |
|---|---|
| `Pre-Workout` **`Glucose`** `Predictor` (with "Glucose" in cyan) | `Workout` **`Fueling`** `Calculator` (with "Fueling" in cyan) |

The cyan accent shifts from the noun `Glucose` to the verb-form noun `Fueling` — emphasizing the calculator's *action* rather than its subject matter.

### 3.3 Page subtitle (descriptive paragraph below H1)

**Before:**
> *"Predict your end-glucose and risk-of-low before you train. Inputs in 60 seconds, literature-grounded prediction."*

**After:**
> *"Know how much glucose you need to fuel your workout and avoid intra-workout lows. Plug in your numbers, get a literature-grounded fueling plan plus your predicted end-glucose."*

### 3.4 Free Resources page card description

**Before:**
> *"Plug in your starting glucose, CGM trend, IOB, and the workout you're about to do. Get a literature-grounded prediction of where your glucose will land and whether you need to fuel up first. Built on Riddell consensus + EXTOD guidelines."*

**After:**
> *"Calculate exactly how much glucose you need to fuel your workout and stay in range. Plug in your glucose, your active insulin, and what training you're about to do — get back a clear fueling plan so you can train hard without crashing."*

**Rationale for changes from the previous description:**
- `CGM trend, IOB` → bundled into the plain phrase *"your glucose, your active insulin"* (drops jargon)
- `workout details` → *"what training you're about to do"* (more conversational)
- `literature-grounded fueling plan and confident end-glucose prediction` → simplified to *"a clear fueling plan"*
- **Removed** `Built on Riddell consensus + EXTOD guidelines` — that credibility line stays in the calculator's disclaimer footer, not on the public-facing card

### 3.5 Free Resources page card tagline (short one-liner)

| Before | After |
|---|---|
| `Predict end-glucose before you train` | `Fuel your training, stay in range` |

---

## 4. HR Zone Selector for Aerobic Workouts

### 4.1 Purpose

For aerobic sessions, **heart-rate-based zone selection is a more natural and accurate intensity proxy** than RPE (subjective effort 1-10). T1D athletes who train with a heart-rate monitor will know their training zone but may not naturally translate that to an RPE number. Adding a zone selector for aerobic workouts:

1. Aligns this calculator with the existing **Cardio HR Zones Calculator** (`/calculators/cardio`) which uses the Karvonen method
2. Provides a more intuitive aerobic intensity input
3. Strengthens toolkit cohesion (the two calculators reference the same zone framework)

### 4.2 Behavior

**When workout type = `Aerobic`:**
- The existing **RPE intensity slider is replaced** by a 5-zone button selector
- Selecting a zone maps to one of the existing 4 intensity bands (`easy` / `moderate` / `hard` / `veryHard`) — see §4.4
- The mapped band is passed to `predictEndGlucose` via the existing `intensity` parameter (or its band-key form, depending on implementation — see §6.2)

**When workout type = `Anaerobic` / `Mixed` / `Strength`:**
- The RPE intensity slider remains as today
- The HR Zone selector is hidden (those workout types use load/effort, not HR, as the natural intensity proxy)

### 4.3 UI specification

When `Aerobic` is selected, this UI section appears in place of the current RPE slider:

```
Training Zone:  [Z1]   [Z2]   [Z3]   [Z4]   [Z5]
                Recovery  Steady  Moderate  Threshold  Very Hard
                68-73%    73-80%  80-87%    87-93%     93-100% HRR

                Selected: Zone 3 · Moderate Effort · 80-87% HRR

                Don't know your zones? Calculate them here ↗
```

The "Calculate them here" link:
- Targets `/calculators/cardio`
- Opens in a **new tab** (`target="_blank" rel="noopener noreferrer"`) to preserve the user's in-progress inputs on the fueling calculator
- Styled as a small italic helper line (`text-xs text-da-cyan italic`)

### 4.4 Zone → intensity band mapping

The math under the hood currently uses 4 bands. The 5-zone HRR system maps to those 4 bands as follows:

| Zone | Label | % HRR (Karvonen) | Maps to band |
|---|---|---|---|
| **Z1** | Recovery | 68–73% | `easy` |
| **Z2** | Steady | 73–80% | `moderate` |
| **Z3** | Moderate Effort | 80–87% | `moderate` |
| **Z4** | Threshold | 87–93% | `hard` |
| **Z5** | Very Hard | 93–100% | `veryHard` |

**Rationale for collapsing Z2 + Z3 into `moderate`:** The glucose response between Z2 (steady aerobic base) and Z3 (moderate effort/tempo) is sufficiently similar that grouping them into the existing `moderate` band is defensible. The alternative — splitting `moderate` into two bands or expanding to 5 bands — would require math changes that are explicitly out of scope (§2).

The zone labels match the conceptual scheme of the existing Cardio HR Zones Calculator (recovery → steady → moderate → threshold → very hard), so users moving between calculators see consistent terminology.

### 4.5 Default zone

When the user first selects `Aerobic`, the default zone is **Z3 (Moderate Effort)**. This matches the existing RPE slider's default of `5` (mid-range moderate).

### 4.6 State persistence across workout-type changes

- When user switches FROM `Aerobic` to another workout type → the HR Zone state is preserved in component state (not reset). If they switch back to Aerobic, their previously selected zone is restored.
- When user switches FROM another workout type TO `Aerobic` → the RPE slider value is preserved similarly (so toggling between types doesn't lose previous selections).
- The `predictEndGlucose` call uses the active input (RPE for non-aerobic, HR Zone for aerobic), translated to the appropriate `intensity` / band parameter.

---

## 5. What Stays Unchanged

For clarity, the following all remain exactly as shipped:

- All 9 input fields (starting glucose with unit toggle, CGM trend arrow, workout type, intensity, duration, IOB with helper, recent carbs optional, body weight with unit toggle, time of day)
- IOB linear-decay helper panel (`computeIob`)
- The 5 output result cards (Headline / Recommendation / Why this prediction / During-Workout Tips / Post-Workout Brief)
- Risk band color coding (`bandFor`)
- Carb recommendation logic (`gramsNeeded`)
- All 6 coefficient tables in `prediction.js`
- The disclaimer footer copy (including the Riddell consensus + EXTOD references)
- The URL `/calculators/pre-workout-glucose`
- All 41 existing unit tests in `pre-workout-glucose/`

---

## 6. Architecture

### 6.1 File modifications

| File | Change |
|---|---|
| `src/features/calculators/PreWorkoutGlucoseCalculator.jsx` | Update heading, pre-header tag, subtitle, intensity input region (conditional HR Zone selector for aerobic), and the conditional render logic |
| `src/pages/FreeResourcesPage.jsx` | Update the `pre-workout-glucose` entry in the `calculators` array (`name`, `tagline`, `description`) |

### 6.2 React component changes — `PreWorkoutGlucoseCalculator.jsx`

**Add new state:**

```js
// Heart Rate Zone state — only relevant when workoutType === 'aerobic'.
// Persists across workout-type changes so toggling back restores the user's selection.
const [hrZone, setHrZone] = useState('Z3')  // Default: Zone 3 (Moderate Effort)
```

**Add new constants near the existing `WORKOUT_TYPES` / `TRENDS` / `TIME_OF_DAY` blocks:**

```js
const HR_ZONES = [
  { id: 'Z1', label: 'Recovery',        rangeHrr: '68-73%',  band: 'easy'     },
  { id: 'Z2', label: 'Steady',          rangeHrr: '73-80%',  band: 'moderate' },
  { id: 'Z3', label: 'Moderate Effort', rangeHrr: '80-87%',  band: 'moderate' },
  { id: 'Z4', label: 'Threshold',       rangeHrr: '87-93%',  band: 'hard'     },
  { id: 'Z5', label: 'Very Hard',       rangeHrr: '93-100%', band: 'veryHard' },
]

const INTENSITY_RPE_FROM_BAND = {
  easy:     2,  // RPE mid-point for easy (1-3)
  moderate: 5,  // RPE mid-point for moderate (4-6)
  hard:     7,  // RPE mid-point for hard (7-8)
  veryHard: 9,  // RPE mid-point for veryHard (9-10)
}
```

**Update the `prediction` useMemo to derive `intensity` from either RPE or HR Zone based on workout type:**

```js
const prediction = useMemo(() => {
  const sg = parseFloat(startGlucose)
  const dur = parseFloat(duration)
  const wt = parseFloat(weight)
  const iob = parseFloat(effectiveIob) || 0
  if (!sg || !dur || !wt) return null

  // Resolve intensity: for aerobic workouts, use the HR Zone → band → RPE midpoint;
  // for other workout types, use the user's RPE slider value directly.
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

**Replace the intensity slider block in the JSX with a conditional render:**

```jsx
{/* Intensity input — HR Zone selector for aerobic, RPE slider for everything else */}
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

**Update the heading/subtitle JSX:**

```jsx
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
```

**Update the `reset()` function** to also reset `hrZone` back to `'Z3'`:

```js
const reset = () => {
  setStartGlucose(''); setTrendArrow('flat'); setWorkoutType('aerobic')
  setIntensity(5); setHrZone('Z3'); setDuration(''); setIobUnits('')
  setIobHelperOpen(false); setLastBolus(''); setMinutesSinceBolus('')
  setHasRecentCarbs(false); setRecentGrams(''); setRecentMinutesAgo('')
  setWeight('')
}
```

### 6.3 React component changes — `FreeResourcesPage.jsx`

Find the `pre-workout-glucose` entry in the `calculators` array and update three fields (`name`, `tagline`, `description`):

```js
{
  slug: 'pre-workout-glucose',
  name: 'Workout Fueling Calculator',
  tagline: 'Fuel your training, stay in range',
  description: 'Calculate exactly how much glucose you need to fuel your workout and stay in range. Plug in your glucose, your active insulin, and what training you\'re about to do — get back a clear fueling plan so you can train hard without crashing.',
  badge: 'NEW',
},
```

---

## 7. Testing

### 7.1 No new unit tests required

Since the underlying math (`predictEndGlucose`, `BASE_RATE_PER_MIN`, `bandFor`, `gramsNeeded`, etc.) is unchanged, the existing 41 unit tests in `pre-workout-glucose/` provide full coverage of the prediction logic.

The new HR Zone → RPE mapping is a static lookup (`HR_ZONES` constant + `INTENSITY_RPE_FROM_BAND` lookup) with no algorithmic complexity worth testing in isolation.

### 7.2 Manual visual QA after implementation

The visual QA pass should verify:

1. Free Resources page card displays the new name (`Workout Fueling Calculator`), new tagline (`Fuel your training, stay in range`), new description
2. Calculator page header displays the new pre-header tag (`⚡ WORKOUT FUELING CALCULATOR`), new H1 (`Workout` **`Fueling`** `Calculator`), and new subtitle
3. Switching workout type to `Aerobic` → RPE slider is replaced by 5 zone buttons (Z1–Z5) with HRR% ranges and labels
4. Switching workout type away from `Aerobic` → zone buttons disappear, RPE slider returns
5. Switching back to `Aerobic` → previously selected zone is preserved
6. Clicking each zone updates the prediction live (verify Z1 produces less glucose drop than Z5 for same duration)
7. Clicking "Calculate them here" link → opens `/calculators/cardio` in a new tab; original page state preserved
8. Reset button clears zone back to Z3
9. Other workout types (Anaerobic / Mixed / Strength) all still use the RPE slider as before
10. Math sanity: Z3 (moderate) prediction should match the prior RPE 5 (moderate) prediction exactly, since both map to the same `moderate` band

---

## 8. Visual / Brand Consistency

- Zone selector buttons use the same visual pattern as the existing workout-type selector (4 tiles with active/inactive cyan styling)
- "Don't know your zones?" link uses the same small italic helper-text pattern as the IOB helper's "Pump users: read IOB off your pump" note
- HRR% range labels use `text-[10px] text-white/40` — consistent with the workout-type tiles' detail labels
- All other styling (page header, subtitle, card layout, result tiles) remains exactly as shipped

---

## 9. Open Questions / Decisions Deferred

1. **Cross-tool data persistence** — If a user computes their personal Karvonen zones in the Cardio calc, those BPM values aren't carried over to the Workout Fueling calculator. The zone *labels* are consistent but the *actual BPM targets* require the user to consult their cardio results separately. Out of scope for v1; could be addressed in a future cross-tool integration pass (similar to the TDEE → Meal Frequency URL-params bridge).

2. **Zone count expansion (4 → 5 bands)** — Collapsing Z2 + Z3 into the existing `moderate` band is a clean fit but loses some precision. If real-world feedback indicates Z2 and Z3 produce meaningfully different glucose responses, a future spec could expand the math to 5 intensity bands. Defer.

3. **Custom RPE-to-Zone mapping per user** — Different individuals may experience the same HR zone with different RPE. Currently the calculator uses a global mapping. Personalized mappings would require user accounts. Defer indefinitely.

---

## 10. References

- Riddell MC et al. *Exercise management in type 1 diabetes: a consensus statement.* Lancet Diabetes Endocrinol. 2017;5(5):377-390.
- EXTOD (Exercise for Type 1 Diabetes) guidelines.
- The existing Cardio HR Zones Calculator (`src/features/calculators/CardioCalculator.jsx`) — uses Karvonen method with the same 5-zone HRR framework referenced here.

---

*End of spec.*
