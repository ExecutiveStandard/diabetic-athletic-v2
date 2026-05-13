# Workout Fueling Calculator — Personalization Inputs (Sex, Cycle, Training, Fasted/Fed, Insulin Adjustment)

| | |
|---|---|
| **Date** | 2026-05-13 |
| **Status** | Approved — awaiting implementation plan |
| **Branch** | `feature/phase-1` |
| **Owner** | Nicholas Caracandas |
| **Related specs** | `2026-05-11-two-new-calculators-design.md` (original calculator spec) · `2026-05-13-workout-fueling-calculator-rename-design.md` (rename + HR Zone integration) |
| **Related files** | `src/features/calculators/PreWorkoutGlucoseCalculator.jsx` (UI), `src/features/calculators/pre-workout-glucose/prediction.js` (math) |

---

## 1. Context

The Workout Fueling Calculator currently takes 9 inputs and produces a prediction of how much glucose a T1D athlete needs to fuel their workout safely. The underlying math is based on Riddell 2017 / EXTOD / ADA guidelines.

This spec adds **5 personalization inputs** that the T1D-exercise literature identifies as Tier-1 / Tier-2 factors affecting workout glucose response — factors the current calculator either ignores entirely or treats with a generic proxy. Adding them moves the calculator from "useful generic prediction" (~75% accurate for the average user) toward "trusted personalized prediction" (~85% accurate when inputs are filled honestly).

**Goal:** Make the calculator world-class — accurate enough that T1D athletes globally can confidently use it to determine workout glucose needs, without losing the approachable framing.

## 2. Audience & Non-Goals

**Primary audience:**
- All existing users of the Workout Fueling Calculator
- New users who track their training/fueling more carefully and want a tool that respects that detail

**Non-goals (explicit):**
- ❌ No new output cards (the existing 5-card output structure stays unchanged)
- ❌ No removal of any of the 9 existing inputs
- ❌ No URL change (`/calculators/pre-workout-glucose` stays)
- ❌ No required cycle-phase tracking (always optional, always skippable, "Don't know / Not relevant" is a first-class choice)
- ❌ No personalized account state (everything is local to one session; no persistence)
- ❌ No new unit tests for the React component (visual QA only). New tests ARE required for `prediction.js` to validate the multiplier logic.
- ❌ No changes to the prediction's overall formula structure — only multipliers applied to existing components

---

## 3. The 5 New Inputs

### 3.1 Sex toggle

| | |
|---|---|
| **Format** | Horizontal segmented toggle, 2 options: Male / Female |
| **Default** | Male |
| **Visibility** | Always visible, **top of the form** (above all other inputs) |
| **State variable** | `sex` (string: `'male'` or `'female'`) |
| **Physiological rationale** | Women are roughly 10% more insulin-sensitive at baseline than men (with significant intra-cycle variation captured by §3.2). Source: multiple insulin-sensitivity studies summarized in Riddell 2017 and related T1D-exercise literature. |

### 3.2 Cycle phase (conditional, female only, always optional)

| | |
|---|---|
| **Format** | Expandable section labeled *"Refine for menstrual cycle phase (optional)"* — collapsed by default. When expanded, 4-button selector. |
| **Options** | • Follicular Phase (early, post-period) • Mid-cycle (~ovulation) • Luteal Phase (late, pre-period) • Don't know or N/A |
| **Default** | Don't know or N/A |
| **Visibility** | Only when `sex === 'female'`. Otherwise the entire expandable is hidden. |
| **State variable** | `cyclePhase` (string: `'follicular'` / `'midCycle'` / `'luteal'` / `'unknown'`) |
| **Physiological rationale** | Insulin sensitivity varies ~15–30% across the menstrual cycle. Follicular phase = most insulin-sensitive (low estrogen + low progesterone). Luteal phase = least sensitive (high progesterone). This is the single largest sex-specific accuracy factor in T1D exercise tools and is largely absent from existing calculators. Source: Brown et al., Yardley 2018, Goldfarb et al. |
| **Inclusivity note** | The "Don't know or N/A" option covers: post-menopausal women, women on hormonal contraception (which suppresses natural cycle variation), women with irregular cycles or PCOS, women who don't track their cycle, and women who prefer not to share. None of these users are forced through cycle-phase classification they can't accurately complete. |

### 3.3 Training status

| | |
|---|---|
| **Format** | 4-button tile grid (matching the visual treatment of the existing Workout Type tiles), with a primary label + smaller descriptor on each tile |
| **Options** | • Untrained: *Little or no regular exercise* • Recreational: *2–3 days/week, casual* • Trained: *4–5 days/week, structured plan* • Highly Trained: *6–7 days/week, competitive* |
| **Default** | Recreational |
| **Visibility** | Always visible |
| **State variable** | `trainingStatus` (string: `'untrained'` / `'recreational'` / `'trained'` / `'highlyTrained'`) |
| **Physiological rationale** | Trained T1D athletes have larger glycogen stores, better insulin sensitivity, more efficient glucose uptake, and attenuated counterregulatory hormone responses than untrained or recreational athletes. Same workout, same inputs → significantly different glucose response. Riddell consensus and most T1D-exercise research papers use a 3–4 tier framework. |

### 3.4 Fasted vs Fed state

| | |
|---|---|
| **Format** | Horizontal segmented toggle, 2 options: Fed / Fasted (4+ hr) — Fed appears on the left as the default |
| **Default** | Fed |
| **Visibility** | Always visible |
| **State variable** | `fastedFed` (string: `'fasted'` or `'fed'`) |
| **Physiological rationale** | Fasted exercise has fundamentally different physiology: lower starting glycogen, lower circulating insulin, elevated catecholamines, different substrate availability. The 4-hour threshold is the standard literature definition. Note that the existing "Recent Carbs" input handles the more granular "just ate" case in finer detail, so this input acts as a complement, not a replacement. |

### 3.5 Pre-workout insulin adjustment

| | |
|---|---|
| **Format** | 3-button selector |
| **Options** | • None • Modest (25–50% basal/bolus reduction) • Significant (50–80% basal/bolus reduction) |
| **Default** | None |
| **Visibility** | Always visible |
| **State variable** | `insulinAdjustment` (string: `'none'` / `'modest'` / `'significant'`) |
| **Physiological rationale** | Many T1D athletes proactively reduce their basal rate (pump) or pre-workout bolus before exercise. The Riddell consensus recommends 50–80% basal reductions starting 60–90 min pre-workout for moderate aerobic. Crucially: **basal reductions are NOT visible in the existing IOB input**, so without this input the calculator can underestimate how prepared the user's body is. The 3 ranges align directly with Riddell consensus ranges. |

---

## 4. Math Integration

### 4.1 Principle: multipliers on specific components, not new additive terms

The existing prediction formula is:

```
ΔG = base_rate(type, intensity) × duration
   + iob_contribution(IOB, type, intensity)
   + trend_contribution(arrow, duration)
   + carb_contribution(grams, minutes_ago, type)
   + time_of_day_factor × duration
```

The 5 new inputs apply as **multiplicative coefficients on specific existing terms**, not as new additive terms. Each multiplier maps to the physiological component the input most directly influences:

| Input | Multiplies | Why |
|---|---|---|
| **Sex** | `iob_contribution` | Insulin sensitivity is the primary sex-related axis |
| **Cycle phase** | `iob_contribution` | Cycle affects insulin sensitivity, refining sex |
| **Training status** | `base_rate × duration` | Fitness affects how much glucose the workout demands |
| **Fasted vs Fed** | `base_rate × duration` AND `iob_contribution` | Fasted state amplifies workout drop AND offsets IOB via catecholamine activation |
| **Insulin adjustment** | `iob_contribution` | Adjustments mean less effective insulin acting during the workout |

### 4.2 Coefficient tables

All coefficients are starting values drawn from Riddell 2017 / Yardley 2018 / EXTOD / cycle-phase literature (Brown, Goldfarb). They are conservative midpoints within published ranges and will be refined based on real-world feedback.

```js
// Sex effect on insulin sensitivity (iob_contribution multiplier)
const SEX_IOB_MULTIPLIER = {
  male:   1.00,  // baseline
  female: 1.10,  // ~10% more insulin sensitive at baseline
}

// Menstrual cycle phase (further multiplies iob_contribution for female users)
const CYCLE_IOB_MULTIPLIER = {
  follicular: 1.15,  // most insulin sensitive (low estrogen/progesterone)
  midCycle:   1.10,  // near-ovulation, intermediate
  luteal:     1.00,  // least sensitive (high progesterone)
  unknown:    1.10,  // safe midpoint default
}

// Training status (base_rate multiplier — more fit = less glucose drop)
const TRAINING_BASE_MULTIPLIER = {
  untrained:     1.15,
  recreational:  1.00,  // baseline
  trained:       0.85,
  highlyTrained: 0.75,
}

// Fasted state — affects both base_rate and iob_contribution
const FASTED_BASE_MULTIPLIER = {
  fasted: 1.10,  // larger glucose drop (lower glycogen, less substrate)
  fed:    1.00,  // baseline
}
const FASTED_IOB_MULTIPLIER = {
  fasted: 0.90,  // catecholamines partially offset IOB
  fed:    1.00,  // baseline
}

// Pre-workout insulin adjustment (iob_contribution multiplier)
const INSULIN_ADJ_IOB_MULTIPLIER = {
  none:        1.00,  // baseline
  modest:      0.85,  // 25-50% reduction
  significant: 0.70,  // 50-80% reduction
}
```

### 4.3 Application order in prediction.js

```js
// Resolve all multipliers (with safe defaults so existing tests pass unchanged)
const sexMult         = SEX_IOB_MULTIPLIER[sex] ?? 1.00
const cycleMult       = sex === 'female' ? (CYCLE_IOB_MULTIPLIER[cyclePhase] ?? 1.10) : 1.00
const trainingMult    = TRAINING_BASE_MULTIPLIER[trainingStatus] ?? 1.00
const fastedBaseMult  = FASTED_BASE_MULTIPLIER[fastedFed] ?? 1.00
const fastedIobMult   = FASTED_IOB_MULTIPLIER[fastedFed] ?? 1.00
const insulinAdjMult  = INSULIN_ADJ_IOB_MULTIPLIER[insulinAdjustment] ?? 1.00

// Apply to existing components
const baseDelta = basePerMin * durationMin * trainingMult * fastedBaseMult

const iobDelta = -iobUnits * 1.8 * (durationMin / 60) * iobAmp * iScaler
                 * sexMult * cycleMult * fastedIobMult * insulinAdjMult

// trendDelta, carbDelta, todDelta — unchanged
```

### 4.4 Backward compatibility

All 5 new inputs are **optional in the function signature**. If `predictEndGlucose` is called without them (e.g., from an old test), all multipliers default to 1.00 and the result is identical to today's behavior. **All 41 existing prediction tests pass unchanged.**

### 4.5 Default-case neutrality

When the user picks the calculator's defaults (Male / Recreational / Fed / None / [no cycle data]), all multipliers evaluate to 1.00. The prediction matches today's behavior exactly. The new inputs *refine* predictions for users who have non-default values — they don't change the calculator's behavior for an average user who clicks through the form quickly.

---

## 5. Form Layout

The 5 new inputs sit alongside the 9 existing ones in a single scrollable form. New inputs are placed near logically-related existing inputs (no new section dividers, no tabs — the form remains a single column of fields).

```
┌─ Page header (unchanged: ⚡ WORKOUT FUELING CALCULATOR / etc.)
│
├─ ── DEMOGRAPHICS ──────────────────────────────
│  Sex toggle (NEW)                      ← horizontal, full width, top of form
│  └─ Cycle phase expander (NEW, conditional on Female, optional)
│
├─ ── GLUCOSE STATE ──────────────────────────────
│  Starting Glucose                       (existing)
│  CGM Trend Arrow                        (existing)
│
├─ ── WORKOUT DETAILS ──────────────────────────
│  Workout Type                           (existing)
│  Training Status (NEW)                  ← 4 tiles, matching workout-type styling
│  Intensity (RPE slider) / HR Zone       (existing, conditional)
│  Planned Duration                       (existing)
│
├─ ── INSULIN STATE ─────────────────────────────
│  Active Insulin (IOB)                   (existing)
│  Pre-workout insulin adjustment (NEW)   ← right below IOB
│
├─ ── MEAL STATE ───────────────────────────────
│  Recent Carbs (optional)                (existing)
│  Fasted / Fed (NEW)                     ← right below Recent Carbs
│
├─ ── PHYSICAL ──────────────────────────────────
│  Body Weight                            (existing)
│  Time of Day                            (existing)
│
└─ Results section (unchanged)
```

*(Note: the dotted-line "section" labels in the diagram are conceptual — the actual form is a single column of fields without section headers, matching the existing visual style. The labels just show the logical grouping for placement decisions.)*

---

## 6. UI specifications

### 6.1 Sex toggle (§3.1)

```jsx
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
</div>
```

### 6.2 Cycle phase expander (§3.2, conditional)

```jsx
{sex === 'female' && (
  <div>
    <button type="button" onClick={() => setCycleExpanded(!cycleExpanded)}
      className="text-da-cyan text-xs uppercase tracking-wider font-bold">
      {cycleExpanded ? '− Hide menstrual cycle refinement' : '+ Refine for menstrual cycle phase (optional)'}
    </button>
    {cycleExpanded && (
      <div className="mt-3 p-4 bg-da-dark rounded-lg">
        <p className="text-xs text-white/50 mb-3">
          Cycle phase affects insulin sensitivity. Adjusts the fuel calculation by ~5–15%.
          If you're not menstruating, on hormonal contraception, or don't track your cycle,
          leave this as "Don't know or N/A" — the default works for most users.
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
  </div>
)}
```

With `CYCLE_PHASES` module constant:

```js
const CYCLE_PHASES = [
  { id: 'follicular', label: 'Follicular Phase', detail: 'Early cycle, post-period' },
  { id: 'midCycle',   label: 'Mid-cycle',        detail: '~Ovulation' },
  { id: 'luteal',     label: 'Luteal Phase',     detail: 'Late cycle, pre-period' },
  { id: 'unknown',    label: 'Don\'t know / N/A', detail: 'Default — works for most' },
]
```

### 6.3 Training status (§3.3)

```jsx
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

With `TRAINING_STATUSES` module constant:

```js
const TRAINING_STATUSES = [
  { id: 'untrained',     label: 'Untrained',      detail: 'Little or no regular exercise' },
  { id: 'recreational',  label: 'Recreational',   detail: '2–3 days/week, casual' },
  { id: 'trained',       label: 'Trained',        detail: '4–5 days/week, structured plan' },
  { id: 'highlyTrained', label: 'Highly Trained', detail: '6–7 days/week, competitive' },
]
```

### 6.4 Fasted/Fed toggle (§3.4)

```jsx
<div>
  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Meal State</label>
  <div className="grid grid-cols-2 gap-2">
    {[
      ['fed',    'Fed',                  'Eaten within the last 4 hours'],
      ['fasted', 'Fasted (4+ hr)',       'No food for 4+ hours'],
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

### 6.5 Insulin adjustment selector (§3.5)

```jsx
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

With `INSULIN_ADJUSTMENTS` module constant:

```js
const INSULIN_ADJUSTMENTS = [
  { id: 'none',        label: 'None',        detail: 'Normal basal & bolus' },
  { id: 'modest',      label: 'Modest',      detail: '25–50% reduction' },
  { id: 'significant', label: 'Significant', detail: '50–80% reduction' },
]
```

---

## 7. Architecture

### 7.1 File modifications

| File | Change |
|---|---|
| `src/features/calculators/pre-workout-glucose/prediction.js` | Add 5 multiplier-table constants; extend `predictEndGlucose` signature to accept 5 new optional params; apply multipliers to `baseDelta` and `iobDelta`. |
| `src/features/calculators/pre-workout-glucose/prediction.test.js` | Add new test cases that verify each multiplier behaves correctly. Existing 10 tests pass unchanged. |
| `src/features/calculators/PreWorkoutGlucoseCalculator.jsx` | Add 4 module constants (`CYCLE_PHASES`, `TRAINING_STATUSES`, `INSULIN_ADJUSTMENTS`); add 6 new useState calls (`sex`, `cyclePhase`, `cycleExpanded`, `trainingStatus`, `fastedFed`, `insulinAdjustment`); update `prediction` useMemo to pass new inputs; update `reset()` to clear new state; add 5 new JSX blocks in the form. |

No new files. No URL changes. No deletions.

### 7.2 Backward-compatible function signature

`predictEndGlucose` keeps its existing 9 inputs and adds 5 new optional ones:

```js
predictEndGlucose({
  // EXISTING (unchanged):
  startMmol, trendArrow, workoutType, intensity, durationMin,
  iobUnits, recentCarbs, bodyweightKg, timeOfDay,
  // NEW (all optional, default to baseline behavior if omitted):
  sex,
  cyclePhase,
  trainingStatus,
  fastedFed,
  insulinAdjustment,
})
```

When called from the React component, all 14 inputs are passed. When called from existing tests that don't supply the 5 new ones, the function defaults all multipliers to 1.00 (= existing behavior).

### 7.3 State management

All 6 new state variables (5 inputs + 1 expander flag) live as `useState` calls in the React component, alongside the existing ~15 state hooks. No Zustand, no context — same pattern as the rest of the calculator.

---

## 8. Testing

### 8.1 New unit tests required (in `prediction.test.js`)

These add to the existing 41 tests (no test removals or modifications):

**Sex multiplier tests:**
- `sex='female'` produces a more amplified IOB drop than `sex='male'` for the same IOB
- Omitting `sex` produces identical output to `sex='male'` (backward compatibility)

**Cycle phase tests:**
- `sex='female'` + `cyclePhase='follicular'` produces the largest IOB drop
- `sex='female'` + `cyclePhase='luteal'` produces the smallest IOB drop (of the female cases)
- `sex='male'` + any `cyclePhase` value → cyclePhase is ignored, no effect
- `sex='female'` + `cyclePhase='unknown'` → same as `midCycle` defaults

**Training status tests:**
- `trainingStatus='highlyTrained'` produces a smaller baseDelta than `trainingStatus='untrained'` for the same workout
- Omitting `trainingStatus` produces identical output to `trainingStatus='recreational'`

**Fasted/Fed tests:**
- `fastedFed='fasted'` produces a larger baseDelta AND a smaller iobDelta than `fastedFed='fed'`
- Omitting `fastedFed` produces identical output to `fastedFed='fed'`

**Insulin adjustment tests:**
- `insulinAdjustment='significant'` produces a smaller iobDelta than `insulinAdjustment='none'`
- Omitting `insulinAdjustment` produces identical output to `insulinAdjustment='none'`

**Default-case neutrality test:**
- Calling `predictEndGlucose` with all 5 new inputs set to defaults (`male`, `unknown`, `recreational`, `fed`, `none`) produces an identical output to calling it without those inputs at all

**Compound multiplier sanity test:**
- A "best case" scenario (female + follicular + highlyTrained + fed + significant reduction) produces a noticeably milder predicted drop than a "worst case" scenario (male + untrained + fasted + none) for identical workout parameters

### 8.2 No new React component tests

UI changes are visual; verified manually via `npm run dev` browser inspection during the implementation pass, plus the standard `npm run build` syntax check.

### 8.3 Manual visual QA

Verify in browser:
- Form renders the 5 new inputs in the correct positions (per §5 layout)
- Sex toggle works; Female reveals the cycle expander
- Cycle expander toggles open/closed; selection works; pinning to "Don't know / N/A" applies the safe midpoint
- Training status, Fasted/Fed, Insulin adjustment all toggle correctly
- Switching workout type to Aerobic still shows the HR Zone selector (no regression)
- Switching workout type to non-Aerobic still shows the RPE slider (no regression)
- Reset button clears all 6 new state vars back to their defaults
- A "personalized" run produces a noticeably different prediction than the default run (sanity check the multipliers are wired up)

---

## 9. Visual / Brand Consistency

- Sex toggle styling matches the existing pump/MDI toggle in the IOB helper (`bg-da-cyan` for active, `bg-da-dark border` for inactive)
- Training Status tiles match the existing Workout Type tiles (`bg-da-cyan/20 border border-da-cyan` active, `bg-da-dark border border-white/10` inactive)
- Cycle expander styling matches the existing IOB helper expander (button with `+`/`−` toggle, content panel `bg-da-dark`)
- Fasted/Fed and Insulin Adjustment tiles follow the same multi-button tile pattern used throughout
- Helper copy inside the cycle expander uses `text-xs text-white/50` — same muted-helper-text styling used elsewhere

---

## 10. Open Questions / Decisions Deferred

1. **Coefficient calibration** — All multiplier values are literature-anchored starting points. They may need real-world feedback to refine. Out of scope for v1; track for a future calibration pass.
2. **Insulin adjustment x bolus vs basal** — Currently treats "modest" and "significant" the same whether the user reduced basal or bolus. In reality these have somewhat different effects (basal reduction has longer-acting effects). For v1 we group them; future refinement could split.
3. **Hormonal contraception** — Some forms suppress natural cycle variation (combined pill) more than others (progestin-only). The current "Don't know / N/A" default is the safe choice; a future refinement could surface this nuance.
4. **Post-menopause / surgical menopause** — These users have a baseline insulin sensitivity closer to male-baseline. Current behavior: they pick "Don't know / N/A" and get the safe female midpoint (1.10× cycle multiplier). A future refinement could let them indicate post-menopause specifically for a more male-like multiplier.
5. **Trans / non-binary users on HRT** — HRT changes hormonal profile and insulin sensitivity. Current calculator's M/F toggle is a simplification. Out of scope; a "more inclusive sex/hormone" input would be a separate spec.
6. **Smart defaults across sessions** — Users currently re-pick all 5 new inputs every visit. Persistence (e.g., localStorage) would improve UX but introduces privacy and complexity. Out of scope.

---

## 11. References

- Riddell MC et al. *Exercise management in type 1 diabetes: a consensus statement.* Lancet Diabetes Endocrinol. 2017;5(5):377-390.
- Yardley JE. *Reassessing the evidence: Prandial state dictates glycaemic responses to exercise in T1D.* Diabet Med. 2018.
- EXTOD (Exercise for Type 1 Diabetes) guidelines.
- Goldfarb AH et al. *The effect of the menstrual cycle on exercise metabolism.* Sports Med. 1998 (foundational); plus follow-up T1D-specific cycle-phase research.
- Brown SA et al. *Menstrual cycle phase and glucose dynamics in T1D.* (multiple studies, summarized in Riddell 2017).

---

*End of spec.*
