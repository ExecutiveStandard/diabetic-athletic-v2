# Workout Fueling Calculator — Redesign Spec

**Date:** 2026-05-17
**Status:** Approved
**Replaces:** Earlier "Pre-Workout Glucose Predictor" → "Workout Fueling Calculator" rename and personalization work. Routes (`/calculators/pre-workout-glucose`) and core prediction engine unchanged.

---

## 1. Goal

Make the Workout Fueling Calculator do what its name promises: tell a person with Type 1 diabetes **how much fast-acting carbohydrate to ingest, and when**, so they can complete their workout landing in a safe target glucose range (7.0–8.0 mmol/L), without hypoglycemia mid-session and without compounding into hyperglycemia post-session.

The output is a **fuel plan**, not a glucose prediction. Predicted glucose becomes supporting context that justifies the fuel plan.

## 2. Audience and Voice

Diabetic Athletic's audience is **T1Ds transitioning from a diabetic lifestyle to an athletic mindset** (per the brand positioning memory dated 2026-05-17). The calculator must work well enough that a user trusts the result and feels the lead magnet was meaningfully valuable — they should walk away thinking "this is exactly what I needed, who is this person?"

Avoid clinical jargon where plain language works. Honor T1D physiology rules accurately. Don't assume athlete-level fitness or training experience.

## 3. Non-Goals

- A new prediction engine (existing `prediction.js` works well and stays)
- An insulin-dose calculator (that's what the Magic Ratio calc is for; we link to it from the post-workout brief)
- Removing clinically meaningful inputs in pursuit of simplicity (lead-magnet value depends on accuracy)
- Real-time CGM integration
- Saving past sessions / history
- Pre-workout meal planning (covered by meal-frequency calc + nurture content)
- Detailed ketone management beyond a top-level warning

## 4. Audience Inputs (Beginner / Advanced split)

Same pattern as the Magic Ratio calculator. Beginner mode default; one click to reveal Advanced.

### 4.1 Beginner (5 essentials, always visible)

| Input | Format / Validation |
|---|---|
| Starting BG | Number, mmol/L or mg/dL toggle |
| Activity type | 3-button selector: **Aerobic / Mixed / Anaerobic** |
| Duration | Number, minutes (1–300) |
| Body weight | Number, kg or lbs toggle |
| Insulin on board (IOB) | Number, units (0–20). Existing IOB helper expander remains available. |

### 4.2 Advanced (clinically meaningful refinements, collapsed by default)

| Input | Notes |
|---|---|
| Heart rate zone | Z1–Z5 selector; refines aerobic intensity (precise > RPE) |
| Insulin type | Rapid (Humalog/Novolog) or ultra-rapid (Fiasp/Lyumjev) — affects IOB decay curve |
| Pre-workout insulin adjustment | None / Reduced / Skipped — feeds prediction |
| Trend arrow | Rising / Flat / Falling (from CGM) |
| Sex + cycle phase | Same UI as Magic Ratio (cycle expander appears when Female) |
| Training status | Recreational / Trained / Highly Trained |
| Fasted vs Fed | Toggle |
| Recent carbs | Optional: grams + minutes ago (rarely used; surface only in Advanced) |
| Time of day | Morning / Afternoon / Evening — defaults from clock |

### 4.3 Inputs removed

None. Every existing input stays. The change is purely organizational (Beginner vs Advanced visibility) — accuracy is preserved.

## 5. Math — The Fuel Plan

### 5.1 Target landing range

| Metric | Value |
|---|---|
| Target midpoint | 7.5 mmol/L (135 mg/dL) |
| Target range | 7.0 – 8.0 mmol/L (126 – 144 mg/dL) |

If the predicted end-glucose lands in 7.0–8.0 → no fuel needed. If below 7.0 → fuel to close the gap. If above 8.0 → "you're already trending high; consider whether basal/bolus needs review."

### 5.2 Pre-workout fuel formula

```
aerobicGrams = 5 × (7.5 − predictedEndMmol) × (weightKg / 70)
```

- Constants: 5g raises BG by ~1 mmol/L for a 70kg adult (standard T1D rescue rule, also called the "15-15 rule" — 15g raises BG by ~3 mmol/L).
- Output is **rounded to the nearest 5g** and **clamped to 0–60g per dose**.

Activity-type branches:

| Activity | Formula |
|---|---|
| **Aerobic** | `aerobicGrams` as above |
| **Mixed** | `0.6 × aerobicGrams` (smaller dose; covers the aerobic phases, leaves headroom for the spike from intense bursts) |
| **Anaerobic** | `0g` if starting BG ≥ 6 mmol/L. If starting BG < 6: small protective top-up to bring BG to 6.0 mmol/L (still using the 5g/mmol/kg formula). |

### 5.3 During-workout top-ups (sessions > 60 min)

For aerobic and mixed sessions longer than 60 min:

```
topUpGrams = 0.3 × weightKg  (rounded to nearest 5g, clamped 10–40g)
```

Per-session schedule:

| Duration | Top-ups |
|---|---|
| ≤ 60 min | None |
| 61–90 min | One at 30 min |
| 91–120 min | Two: at 30 and 60 min |
| 121+ min | One every 30 min (so 121–150 min = 3 top-ups; 151–180 min = 4 top-ups; etc.) |

Anaerobic sessions do not get top-ups (they're rarely >60 min straight; cortisol-driven spikes mean mid-session carbs would over-fuel).

Rate verification: 0.3g/kg per 30 min = 0.6g/kg/hour. For a 70kg user, 42g/hour. Sits in the middle of the published 30–60g/hour endurance range cited by ADA, ISPAD, and the DMF reference materials.

### 5.4 Safety branches

These override the normal fuel-plan output.

| Condition | Status | User-facing message |
|---|---|---|
| Starting BG < 5 mmol/L | `delay` | **"Don't start your workout yet."** Eat 15–20g fast carbs, wait 15 min, recheck. Begin only once BG > 5 mmol/L. Re-enter the new BG to recalculate. |
| Starting BG > 15 mmol/L | `high-bg-warning` | **"Check for ketones before starting."** If present, follow your diabetes team's guidance — don't exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session. |
| Starting BG 5.0–15.0 mmol/L | `fuel` or `no-fuel` | Normal fuel plan logic (§5.2 / §5.3) |

The `delay` and `high-bg-warning` states suppress the normal fuel plan and post-workout brief — the user must address the safety issue first.

### 5.5 "With fuel" projection

For honesty + value demonstration, the result shows both:

- **predictedEndWithoutFuel** — what the prediction engine outputs given the inputs
- **predictedEndWithFuel** — what the BG would be IF the user follows the recommended fuel plan

For a recommended dose of `g` grams, the "with fuel" projection is:

```
predictedEndWithFuel = predictedEndWithoutFuel + (g / 5) × (70 / weightKg)
```

(Mirrors the recommendation formula in reverse.) This is shown so the user understands the *value* of the recommendation — without it, the prediction looks abstract.

## 6. The Fuel Plan Result UI

### 6.1 Layout (top-to-bottom)

1. **Hero — Your Fuel Plan** (activity-type-specific block, see §6.2)
2. **Comparison row** — Without fuel: X mmol/L → With fuel: ~7.5 mmol/L ✓
3. **Why** — bullet list from prediction breakdown (activity drop, IOB effect, trend, etc.)
4. **During your workout** — activity-type-specific tips
5. **Post-workout brief** — delayed-drop warning, link to Magic Ratio calc for bolus recalibration

### 6.2 Hero block content by status

**`fuel` (aerobic, ≤60 min)** — example: 6.5 starting, 45 min aerobic, 70kg:
> 💪 **Eat 20g of fast-acting carbs 15 minutes before you start**
>
> *Glucose tabs, juice, dextrose, sports drink.*

**`fuel` (aerobic, >60 min)** — example: 6.5 starting, 90 min aerobic, 70kg:
> 💪 **Pre-workout: 20g fast-acting carbs (15 min before)**
> 🔁 **At 30 min: 20g top-up**
> 🔁 **At 60 min: 20g top-up**
>
> *Carry your fuel with you — gels, sports drink, or chews work well during the session.*

**`fuel` (mixed)** — example: 6.0 starting, 60 min HIIT, 70kg:
> 💪 **Eat 12g of fast-acting carbs 10 minutes before you start**
>
> *Mixed sessions are variable. Expect some drop early then a possible spike from intense bursts. Recheck at the halfway point — top up with another 10g if you've dropped to 5 mmol/L or lower.*

**`no-fuel` (anaerobic, ≥6 mmol/L)** — example: 7.0 starting, 30 min strength:
> ✅ **No pre-workout fuel needed**
>
> Your BG is in a good starting range. Anaerobic work can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.

**`fuel` (anaerobic, <6 mmol/L)** — example: 5.0 starting, 30 min strength:
> 💪 **Eat 7g of fast-acting carbs before starting** *(protective top-up to bring BG to ~6 mmol/L)*
>
> Then proceed — anaerobic work may spike your glucose during/after the session. Watch for needing correction insulin in the cool-down window.

**`delay` (BG < 5)** — overrides everything:
> ⚠️ **Don't start your workout yet**
>
> Your BG is below 5 mmol/L. Eat 15–20g of fast-acting carbs, wait 15 minutes, then recheck. Begin only once your BG is above 5 mmol/L. (We'll recalculate your fuel plan when you re-enter your new starting BG.)

**`high-bg-warning` (BG > 15)** — overrides everything:
> ⚠️ **Check for ketones before starting**
>
> Your BG is above 15 mmol/L. Test for ketones first. If present, follow your diabetes team's guidance — don't exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session.

### 6.3 IOB context note (when IOB > 0)

Below the comparison row, a small italic note when applicable:

> *You have ~{X}u of active insulin from a recent bolus. For future workouts at this time of day, consider reducing your pre-meal bolus by ~50% to lower hypo risk during exercise.*

This is educational, not a directive. Reflects the meal-timing principle from the reference assets without forcing the user to act on it.

### 6.4 Post-workout brief (always shown for `fuel` and `no-fuel` statuses)

> 📉 **Watch for a delayed glucose drop 4–6 hours after finishing** — glycogen replenishment continues even after the workout ends. Recheck at 1 hour and 4 hours after stopping. Your post-workout bolus needs may be reduced by 50–75%. [Use the Magic Ratio Calculator →]
>
> *Link target: `/calculators/magic-ratio`*

Not shown for `delay` or `high-bg-warning` — those states require addressing the immediate issue first.

## 7. Architecture & File Structure

```
src/features/calculators/
├── PreWorkoutGlucoseCalculator.jsx       # MAJOR REWORK
│
└── pre-workout-glucose/
    ├── prediction.js                      # UNCHANGED (engine)
    ├── prediction.test.js                 # UNCHANGED
    ├── carbRecommendation.js              # DELETED (replaced by fuelPlan.js)
    ├── carbRecommendation.test.js         # DELETED
    ├── fuelPlan.js                        # NEW — see §7.1
    ├── fuelPlan.test.js                   # NEW — comprehensive
    ├── iobDecay.js                        # UNCHANGED
    ├── iobDecay.test.js                   # UNCHANGED
    ├── riskBands.js                       # UNCHANGED (may become unused; review during impl)
    ├── riskBands.test.js                  # UNCHANGED (review)
    ├── units.js                           # UNCHANGED
    └── units.test.js                      # UNCHANGED
```

### 7.1 `fuelPlan.js` — the pure function at the heart of this redesign

```js
/**
 * Build a fuel plan from prediction inputs and outputs.
 * Pure function. Highly testable.
 *
 * @param {object} args
 * @param {number} args.startGlucoseMmol      Starting BG in mmol/L.
 * @param {number} args.predictedEndMmol      End-glucose predicted by prediction.js.
 * @param {string} args.activityType          'aerobic' | 'mixed' | 'anaerobic'
 * @param {number} args.durationMinutes
 * @param {number} args.bodyweightKg
 * @param {number} args.iobUnits              Insulin on board (units).
 * @returns {object}
 *   {
 *     status: 'fuel' | 'no-fuel' | 'delay' | 'high-bg-warning',
 *     preWorkout: { grams: number, timingText: string } | null,
 *     topUps: Array<{ atMinutes: number, grams: number }>,
 *     predictedEndWithoutFuel: number,        // mmol/L
 *     predictedEndWithFuel: number,           // mmol/L
 *     iobNote: string | null,
 *     warning: string | null,                 // for 'delay' / 'high-bg-warning' states
 *   }
 */
export function buildFuelPlan({ ... })
```

The function encodes every branch from §5 and §6. UI code does no math — it just renders what the function returns.

### 7.2 Calculator JSX changes

- Top of form: new `<ModeToggle>` (Beginner / Advanced). State: `mode`, default `'beginner'`.
- Beginner inputs render in their existing positions, restricted to the 5 essentials.
- Advanced inputs collapse into a `<StepCard stepNumber="A" title="Advanced refinements (optional)">` — only renders when `mode === 'advanced'`. Same pattern as Magic Ratio.
- `<PredictionResults>` component deleted. Replaced by `<FuelPlanResults>` rendering the panels from §6.
- The component reads `prediction` from the existing prediction engine, passes it + the user's other inputs to `buildFuelPlan()`, and renders the result.

### 7.3 OptInGate wrapper

Untouched. The Workout Fueling calc is already wrapped in `<OptInGate slug="pre-workout-glucose">`. All rework happens inside `PreWorkoutGlucoseCalculatorActual`. The opt-in flow continues to work.

### 7.4 Routes

Untouched. `/calculators/pre-workout-glucose` still points to `PreWorkoutGlucoseCalculator`.

## 8. Testing

`fuelPlan.test.js` covers:

**Math correctness (per scenario from reference materials):**
- 70kg user, BG 5.0, 30 min aerobic, no IOB → expects ~12g pre-workout (~10g per reference)
- 70kg user, BG 6.5, 45 min aerobic, no IOB → expects ~20g pre-workout
- 70kg user, BG 6.5, 90 min aerobic, no IOB → expects pre-workout + 2 top-ups at 30 and 60 min
- 70kg user, BG 7.0, 30 min anaerobic, no IOB → expects `'no-fuel'` status
- 70kg user, BG 5.5, 30 min anaerobic, no IOB → expects protective top-up to bring BG to 6.0
- 70kg user, BG 6.0, 60 min mixed, no IOB → expects ~12g (60% of aerobic dose)

**Safety branches:**
- BG 4.5 → `'delay'` status, no fuel plan
- BG 16.0 → `'high-bg-warning'` status, no fuel plan
- BG exactly 5.0 → `'fuel'` status (boundary inclusive on the safe side)
- BG exactly 15.0 → `'fuel'` status (boundary inclusive on the safe side)

**Scheduling:**
- Duration 60 min → 0 top-ups
- Duration 90 min → 1 top-up at 30 min
- Duration 120 min → 2 top-ups at 30, 60 min
- Duration 150 min → 3 top-ups at 30, 60, 90 min

**Bodyweight scaling:**
- 50kg vs 70kg vs 100kg at same starting/predicted → grams scale linearly with weight ratio

**Activity-type branching:**
- Same inputs with type=aerobic vs mixed vs anaerobic produce different statuses/grams

## 9. Out of Scope (Explicitly)

- Real-time CGM data ingestion
- Push notifications during workout (top-up reminders)
- Saving past sessions / history view
- Per-user customization of the target range (always 7.0–8.0)
- Per-user customization of the carb ratio (always 5g/mmol/kg baseline)
- Insulin dose recommendations beyond the post-workout link to Magic Ratio
- Pre-workout meal planning
- Ketone management beyond the > 15 mmol/L warning
