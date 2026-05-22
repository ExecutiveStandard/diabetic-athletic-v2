# Workout Fueling — Rescue + Activity Fuel Split

**Date:** 2026-05-22
**Status:** Approved
**Builds on:** [`2026-05-17-workout-fueling-redesign-design.md`](./2026-05-17-workout-fueling-redesign-design.md)

---

## 1. Goal

Restructure the Workout Fueling output to separate two distinct concepts that the current "fund-the-drop" single-number recommendation conflates:

1. **Rescue carbs** — the dose needed *now* to get out of the low-BG danger zone and into a safe pre-workout range
2. **Activity fuel** — a separate dose, eaten *after* the rescue has taken effect, to power the workout itself

A user starting at BG 4.9 mmol/L preparing for a 40-min aerobic session should see a result that says, in effect: *"Eat 15g now to bring your BG into range. Once you're at 6.5+ mmol/L, eat an additional 25g to fuel the workout. Total: 40g."* The current calculator says only "Consume 20g now" — a single number that's mathematically correct for the prediction but misleading about what the user is actually being asked to do.

## 2. Why This Matters

Field testing with the calculator surfaced a real product gap: users with low starting BG see the recommended dose as a rescue dose, mentally check that they've fixed the low — and then have no guidance about whether they need additional fuel to power the activity. T1Ds globally struggle with carb timing around exercise; the calculator must address this directly.

Additionally, even at healthy starting BG, T1Ds and active users burn carbs at a higher rate than the general population. A 20-minute easy walk at BG 7.0 should still get a small activity-fuel recommendation — silence here would imply "you need nothing," which under-serves the audience.

## 3. The Three-Step Output

The fuel plan output now has up to three distinct steps:

### Step 1: Rescue (conditional)

**Appears only when starting BG < 6.0 mmol/L.**

- Headline: *"💉 Eat **{rescueG}g** of fast carbs now. Recheck in 15 min — wait until you're at 6.5 mmol/L or higher before starting."*
- Formula: `rescueG = roundTo5(5 × (7.0 − startGlucoseMmol) × (weightKg / 70))`, clamped 5–25g
- Below the step, a small note: *"Don't know your insulin ratios yet? The [Magic Ratio Calculator](/calculators/magic-ratio) will help you find them — they'll personalize this even further."* (Visual: italic, lower contrast, with `Link` to magic-ratio.)

### Step 2: Activity Fuel (conditional by activity type)

**Appears for `aerobic` and `mixed`. Skipped for `anaerobic` and `strength`** (which spike BG via cortisol — adding fuel would over-shoot).

- Headline (aerobic): *"💪 Once you're in range, eat an additional **{activityG}g** to fuel your {duration}-min {activity} session."*
- Headline (mixed): *"💪 Once you're in range, eat **{activityG}g** to fuel your {duration}-min mixed session. Recheck mid-workout."*
- If Step 1 is skipped (BG already in healthy range), the wording shifts: *"💪 Eat **{activityG}g** 10–15 min before you start to fuel your {duration}-min {activity} session."*
- Formula:
  - Base: `0.4 × weightKg × (durationMinutes / 60)` grams
  - **Minimum floor: 5g** (so a 10-min walk still gets a small dose)
  - Rounded to nearest 5g, clamped 5–40g per single dose
  - Mixed multiplier: 0.6 of aerobic
  - Anaerobic / strength: 0g

### Step 3: During-Workout Top-Ups (unchanged from current spec)

**Aerobic and mixed sessions > 60 min only.**

- One top-up every 30 min for the remaining duration past 60 min
- Each top-up: `0.3 × weightKg` grams, rounded to 5g, clamped 10–40g
- Format: *"🔁 At 30 min: 25g top-up. At 60 min: 25g top-up."*

### Total Carbs Summary (always shown when at least one of steps 1–3 is non-zero)

At the bottom of the hero block, a one-line total:

> *Total carbs for this workout: **40g** (15g rescue + 25g activity fuel)*

If only one component fires, format collapses naturally: *"Total carbs for this workout: 25g (activity fuel)."*

## 4. Anaerobic + Strength Special Cases

Unchanged from prior design with two clarifications:

- If starting BG ≥ 6 mmol/L: Hero is *"✅ No pre-workout fuel needed"* + the spike warning. No Step 1, no Step 2, no Step 3, no Total.
- If starting BG < 6 mmol/L: Step 1 fires (protective rescue to bring BG to ~6.0) + the spike warning. No Step 2, no Step 3.

## 5. Safety Branches Unchanged

`status === 'delay'` (BG < 5) and `status === 'high-bg-warning'` (BG > 15) continue to render the yellow warning panel and suppress all step content. Step 1's lower bound (5.0) and the safety floor (5.0) align — at exactly 5.0, the user gets Step 1 rescue (15g → BG ~7), not the delay warning.

## 6. Math Reference Table

For a 70kg user:

| Duration | Activity fuel (aerobic) | Activity fuel (mixed) |
|---|---|---|
| 15 min  | 5g (floor)  | 5g (floor) |
| 20 min  | 10g | 5g (floor) |
| 30 min  | 15g | 10g |
| 40 min  | 20g | 10g |
| 60 min  | 30g | 20g |
| 90 min  | 40g (cap) + 1 × 20g top-up | 25g + 1 × 20g top-up |

For an 87kg user:

| Duration | Activity fuel (aerobic) | Activity fuel (mixed) |
|---|---|---|
| 20 min  | 10g | 5g (floor) |
| 40 min  | 25g | 15g |
| 60 min  | 35g | 20g |
| 90 min  | 40g (cap) + 1 × 25g top-up | 25g + 1 × 25g top-up |

## 7. Function Signature Change

`buildFuelPlan()` return shape gains two new fields:

```js
{
  status: 'fuel' | 'no-fuel' | 'delay' | 'high-bg-warning',
  rescue: { grams: number, note: string } | null,        // NEW — step 1
  activityFuel: { grams: number, timingText: string } | null,  // NEW — step 2
  topUps: Array<{ atMinutes, grams }>,                   // unchanged — step 3
  totalGrams: number,                                    // NEW — sum of rescue + activityFuel + all topUps
  predictedEndWithoutFuel: number,
  predictedEndWithFuel: number,
  iobNote: string | null,
  warning: string | null,
}
```

The existing `preWorkout` field is **removed** — its responsibilities split cleanly between `rescue` and `activityFuel`. This is a breaking change to the function signature, but only `FuelPlanResults.jsx` consumes it; the tests and the consumer both update together.

## 8. UI Layout Inside `FuelPlanResults`

Hero block becomes a stack of conditional sub-blocks:

```
┌─ YOUR FUEL PLAN ──────────────────────────────┐
│                                               │
│  [Step 1 if rescue is non-null]              │
│  💉 Eat 15g of fast carbs now.               │
│      Recheck in 15 min...                     │
│   [italic Magic Ratio link note]              │
│                                               │
│  [Step 2 if activityFuel is non-null]        │
│  💪 Once you're in range, eat 25g...         │
│                                               │
│  [Step 3 if topUps.length > 0]               │
│  🔁 At 30 min: 25g top-up                    │
│  🔁 At 60 min: 25g top-up                    │
│                                               │
│  ─────────────────────────────                │
│  Total carbs: 40g (15g rescue + 25g fuel)    │
│                                               │
└───────────────────────────────────────────────┘
```

For `no-fuel` and safety statuses, layout matches prior spec (no changes).

## 9. Out of Scope (Explicitly)

- Changing the prediction engine
- Re-modeling the during-workout top-up rate (stays at 0.3g/kg per 30 min)
- Per-user customization of the 6.0 mmol/L start floor or 7.0 target
- Insulin dose recommendations (still defers to Magic Ratio link)
- Sport-specific fueling tables (the formula is general; sport specifics are the user's coaching domain, not lead-magnet scope)
