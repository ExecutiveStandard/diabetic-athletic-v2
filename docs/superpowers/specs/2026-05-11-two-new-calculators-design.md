# Two New Calculator Lead Magnets — Design Spec

| | |
|---|---|
| **Date** | 2026-05-11 |
| **Status** | Approved — awaiting implementation plan |
| **Branch** | `feature/phase-1` |
| **Owner** | Nicholas Caracandas |
| **Related** | `design.md` (top-level architecture), `flow.md` (user journeys) |

---

## 1. Context

The Diabetic Athletic site has 4 interactive lead-magnet calculators live on `/free-resources`: Calorie/TDEE, Protein (LBM-based), Magic Ratio (insulin TDD/ISF/I:C), and Heart Rate Zones (Karvonen + T1D glucose tips). This spec adds two more, both following the same pattern:

- No email-gate. Instant value, in-browser.
- Rich, educational, multi-card output (matches existing calc style).
- Brand-consistent with dark `#221E1F` + cyan `#46C0ED` + gold `#FCC826`.

The two new calculators:

1. **Pre-Workout Glucose Target Predictor** — fills a gap that's unique to T1D athletes: "Given my glucose right now, my CGM trend, my insulin on board, and the workout I'm about to do — what's my glucose likely to look like at the end, and what should I do?"
2. **Meal Frequency & Macro Distributor** — answers the most-asked T1D coaching question after someone gets their daily calorie/macro targets: "OK, now how do I actually eat that?" Structures daily macros into N meals respecting the carb-per-meal dosing-accuracy threshold (~35–45g), with training-day templates that adapt to training time and the Three-Hour Rule.

## 2. Audience & Non-Goals

**Primary audience:**
- T1D athletes who train regularly (Calc #1 assumes most use a CGM)
- Diabetic Athletic clients & prospects who have either run the existing TDEE calc or have macro targets from another source (Calc #2)

**Non-goals (explicit, v1):**
- ❌ No email gating, no Firestore writes from these calculators
- ❌ No insulin-dose calculation — that's the existing Magic Ratio Calc's job; these calcs only *educate* about dosing implications and link to it
- ❌ No cross-tool data auto-import (Calc #2 doesn't pull from the existing TDEE calc — manual entry only; cross-linking deferred)
- ❌ No persistent user history / accounts / saved sessions
- ❌ No analytics events specific to these tools (general site GA4 later, Phase 3)
- ❌ No motion / Framer Motion polish — that's a separate Phase 3 effort across the site
- ❌ Not a replacement for medical advice — disclaimer present on both calcs

---

## 3. Calculator #1 — Pre-Workout Glucose Target Predictor

**Route:** `/calculators/pre-workout-glucose`
**Free-Resources card label:** `Pre-Workout Glucose Predictor`
**Subtitle:** *"Predict your end-glucose and risk-of-low before you train."*

### 3.1 Inputs

All inputs surface on a single page (matching existing-calc UX pattern). All numeric inputs have appropriate min/max and helpful placeholder text.

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Starting glucose | Number + unit toggle (mmol/L \| mg/dL) | Yes | Range: 2.0–22.2 mmol/L (36–400 mg/dL). Default unit: mmol/L. (Cross-calculator unit-preference persistence is a future enhancement, out of scope here.) |
| 2 | CGM trend arrow | Segmented control (↑↑ / ↑ / → / ↓ / ↓↓) | Yes | Default: → (stable). Tooltip explains: "Match the arrow shown on your CGM." |
| 3 | Workout type | 4-button selector (Aerobic / Anaerobic / Mixed / Strength) | Yes | Brief tooltip per type with examples (e.g., Aerobic = steady running, cycling, swimming; Strength = weights, calisthenics). |
| 4 | Intensity | Slider (1–10 RPE) with labeled bands: Easy (1–3) / Moderate (4–6) / Hard (7–8) / Very Hard (9–10) | Yes | Default: 5 (moderate). |
| 5 | Planned duration | Number (minutes) | Yes | Range: 5–300 min. |
| 6 | Active insulin (IOB) | Number (units) + expandable "Help me calculate it" panel | Yes | See §3.1.1. |
| 7 | Recent carb intake | Number (grams) + Number (minutes ago) | Optional | Both fields collapsed into one row labeled *"Have you eaten any carbs recently?"* with a toggle. |
| 8 | Body weight | Number + unit toggle (kg \| lb) | Yes | Used only for g/kg carb-fueling recommendations in output. Range: 35–200 kg. |
| 9 | Time of day | 3-button selector (Morning / Midday / Evening) | Yes | Captures dawn-phenomenon nuance and the post-meal/insulin-state typical of each window. Default auto-selected from browser clock with manual override. |

#### 3.1.1 IOB expandable helper

When user clicks **"Help me calculate it"** below the main IOB field, a panel expands with:

- *Last bolus units* (number, units)
- *Minutes since last bolus* (number, 0–360)
- *Insulin type*: Rapid-acting (default) / Ultra-rapid

A computed IOB value populates the main IOB field automatically when all three sub-fields are filled. The math:

```
DIA_rapid     = 240 minutes (4 hr)
DIA_ultra     = 210 minutes (3.5 hr)
DIA           = DIA_rapid OR DIA_ultra
elapsed       = minutes_since_bolus (clamped 0..DIA)
IOB           = bolus_units × max(0, (1 - elapsed / DIA))
```

This is a linear decay model — adequate for v1. (More accurate bilinear/curvilinear models can be added later; not worth the complexity now.)

A small note: *"Pump users — read IOB directly off your pump display. This helper is for MDI users."*

### 3.2 Prediction Model

The model produces three outputs from the inputs:

1. **`predicted_end_glucose`** (same unit as start)
2. **`delta_glucose`** (signed; how far it moved)
3. **`contribution_breakdown`** — an ordered list of `{label, delta, reasoning}` objects shown in the "Why this prediction" card

Formula (all in mmol/L; conversion handled at I/O boundary):

```
ΔG = (base_rate(type, intensity) × duration_minutes)
   + iob_contribution(IOB, type, intensity)
   + trend_contribution(arrow, duration_minutes)
   + carb_contribution(grams, minutes_ago, type)
   + time_of_day_factor(window) × duration_minutes

predicted_end_glucose = clamp(start_glucose + ΔG, 1.5, 30.0)
```

#### 3.2.1 `base_rate(type, intensity)` — mmol/L per minute

Drawn from Riddell 2017 Lancet consensus + EXTOD + clinical observation. Coefficients are v1 starting values; refinement after feedback is expected.

| Type | Intensity 1-3 (Easy) | 4-6 (Mod) | 7-8 (Hard) | 9-10 (Very Hard) |
|---|---:|---:|---:|---:|
| Aerobic | −0.025 | −0.060 | −0.080 | −0.090 |
| Anaerobic | 0.0 | +0.015 | +0.040 | +0.060 |
| Mixed | −0.015 | −0.040 | −0.050 | −0.045 |
| Strength | −0.005 | +0.005 | +0.020 | +0.030 |

Interpretation: a 45-min moderate aerobic session → 45 × −0.060 = **−2.7 mmol/L** from base rate alone.

#### 3.2.2 `iob_contribution(IOB, type, intensity)`

Aerobic exercise amplifies insulin action; anaerobic is roughly neutral; strength sits between.

```
iob_amplifier = {
  Aerobic:   2.5,
  Mixed:     1.8,
  Strength:  1.5,
  Anaerobic: 1.0,
}[type]

# Each unit of IOB drops glucose by ~1.8 mmol/L per hour during rest;
# during exercise multiply by amplifier and scale by duration.
iob_contribution = − IOB × 1.8 × (duration_minutes / 60) × iob_amplifier
                   × intensity_scaler(intensity)

intensity_scaler = 0.7 (Easy) | 1.0 (Moderate) | 1.2 (Hard) | 1.3 (Very Hard)
```

#### 3.2.3 `trend_contribution(arrow, duration_minutes)`

CGM arrows project ~30-min trajectories. Scale the projection to workout duration up to a 60-min cap (after which the trend signal degrades).

```
per_min = { ↑↑: +0.067, ↑: +0.033, →: 0, ↓: −0.033, ↓↓: −0.067 }[arrow]
trend_contribution = per_min × min(duration_minutes, 60)
```

#### 3.2.4 `carb_contribution(grams, minutes_ago, type)`

Carbs eaten in the last 90 minutes contribute glucose during the workout (counter to IOB). Roughly: 1 g carb raises glucose ~0.15 mmol/L absent insulin; absorption tail extends ~90 min.

```
if minutes_ago > 90 OR grams = 0:
  return 0

availability_fraction = max(0, 1 - (minutes_ago / 90))
carb_contribution = grams × 0.15 × availability_fraction
                    × type_carb_utilization_factor

type_carb_utilization_factor = {
  Aerobic:   0.6  (more carbs burned during workout)
  Mixed:     0.7
  Strength:  0.85
  Anaerobic: 0.95
}[type]
```

#### 3.2.5 `time_of_day_factor(window)`

Captures dawn-phenomenon (morning glucose rise tendency) and end-of-day insulin sensitivity drift.

| Window | Factor (added per minute) |
|---|---:|
| Morning (typically pre-breakfast or shortly after) | +0.010 |
| Midday | 0.0 |
| Evening | −0.005 |

### 3.3 Risk Bands

Applied to `predicted_end_glucose`. Both units rendered side-by-side in the UI.

| Band | mmol/L | mg/dL | Color (brand) | Action |
|---|---|---|---|---|
| Severe hypo | < 3.3 | < 60 | Red `#E74C3C` | "DO NOT START — treat low first" |
| Hypo risk | 3.3 – 4.5 | 60 – 80 | Orange `#F39C12` | "Consume 15–30g fast carbs now and recheck in 15 min" |
| Ideal | 4.5 – 9.0 | 80 – 162 | Cyan `#46C0ED` (brand green-equivalent) | "Cleared to start" |
| Acceptable hyper | 9.0 – 13.9 | 162 – 250 | Gold `#FCC826` | "OK to start — recheck at 30 min" |
| Hyper risk | 13.9 – 16.7 | 250 – 300 | Orange `#F39C12` | "Consider correcting before starting" |
| Danger / ketones | > 16.7 | > 300 | Red `#E74C3C` | "Check ketones — postpone if ketones present" |

### 3.4 Carb Recommendation Logic

Triggered only when `predicted_end_glucose < 4.5 mmol/L` (i.e., bands "Severe hypo" or "Hypo risk").

```
grams_needed = round_to_5(
    (target_end - predicted_end_glucose) × 5 × bodyweight_kg_factor
)
# target_end = 5.5 mmol/L (mid-ideal)
# bodyweight_kg_factor = bodyweight_kg / 70  (normalizes to 70kg reference)
# 5g of fast carb raises glucose ~1 mmol/L for a 70kg person on average

clamp grams_needed to [10, 60] for safety
```

Output copy: *"Consume **{grams_needed}g** of fast-acting carbs (e.g., glucose tablets, juice, dextrose) now and recheck in 15 minutes before starting."*

### 3.5 Output Cards (in order, top to bottom)

1. **Headline card**: predicted end-glucose (huge number, both units), color-coded risk band pill.
2. **Recommendation card**: action text + grams (if applicable) + recheck guidance.
3. **"Why we predicted this" breakdown card**: ordered list, each line: `[Component] [+/−] [delta] mmol/L` with a one-sentence reasoning. Sorted by absolute contribution descending.
4. **During-workout tips card**: tailored to workout type. Aerobic → carry 15g fast carbs, recheck at 30 min. Anaerobic → watch for late rise; cool-down period drop. Mixed → both patterns. Strength → low hypo risk but post-workout drop common.
5. **Post-workout brief card**: 4–6hr delayed-hypo warning. Recheck at 1hr and 4hr post. Educational copy.
6. **Disclaimer footer**: `§3.6`.

### 3.6 Disclaimer Copy

> **⚠️ Educational tool — not medical advice.** The Pre-Workout Glucose Predictor uses literature-based modeling to estimate likely glucose response to exercise in people with type 1 diabetes. Individual responses vary substantially based on insulin sensitivity, fitness level, recent stressors, medications, hormones, sleep, hydration, and many other factors. Always check your glucose before, during, and after exercise. Always carry fast-acting carbs. Never adjust insulin doses based solely on this tool. Consult your endocrinologist or diabetes care team before making changes to your exercise or insulin routine.

---

## 4. Calculator #2 — Meal Frequency & Macro Distributor

**Route:** `/calculators/meal-frequency`
**Free-Resources card label:** `Meal Frequency Planner`
**Subtitle:** *"Turn your daily macros into a structured eating plan that works with T1D dosing."*

### 4.1 Purpose

After a client receives their daily macro targets (from the TDEE calculator or elsewhere), they ask: *"How do I actually eat this?"* This calculator answers that by:

1. Spreading the daily macros across **N meals** (auto-suggested by the 35–45g-carbs-per-meal dosing rule)
2. Producing a **non-training-day** template AND a **training-day** template with the same daily totals
3. Slotting **Pre-Workout** and **Post-Workout** meals into the training-day template based on training time of day, with composition adapted to the **Three-Hour Rule**
4. Surfacing coaching notes that link to the existing **Magic Ratio Calculator** for insulin sensitivity adjustments

### 4.2 Inputs

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Daily calories | Number | Yes | Range: 1000–6000. |
| 2 | Daily protein | Number (g) | Yes | Range: 30–400. |
| 3 | Daily fat | Number (g) | Yes | Range: 20–250. |
| 4 | Daily carbs | Number (g) | Yes | Range: 30–700. |
| 5 | Daily fiber | Number (g) | Yes | Default **25**, editable. Range: 10–60. |
| 6 | Day type toggle | Segmented (Non-training / Training) | Yes | Drives whether the training-day inputs appear. |
| 7 | Training time *(training-day only)* | 3-button (Morning / Midday / Evening) | Conditional | Morning = first meal slot is post-workout. Evening = last meal slot is post-workout. Midday = mid-day workout. |
| 8 | Pre-workout meal timing *(training-day only)* | 3-button (3+ hrs / 1–3 hrs / <1 hr before training) | Conditional | Adapts pre-workout meal composition (see §4.5). |
| 9 | Meal count | Number (3–7) | Yes | Auto-suggested from `ceil(daily_carbs / 40)`, user can override. Live recalculation. |

A consistency check (warning, non-blocking) verifies that `protein×4 + fat×9 + carbs×4` is within ±10% of stated calories. If outside that range, show: *"Heads up — your stated macros don't match your stated calories. Double-check your numbers."*

### 4.3 Meal Count Mechanic

```
suggested_meal_count = ceil(daily_carbs / 40)
clamped              = clamp(suggested_meal_count, 3, 7)
default_meal_count   = clamped
```

The suggestion is shown prominently with reasoning copy:

> *"With **{daily_carbs}g** of carbs spread evenly, **{N} meals** keeps each meal at **{daily_carbs/N | round 1}g** of carbs — within the 35–45g dosing-accuracy sweet spot."*

User can override via a 3–7 selector. If any meal exceeds 50g carbs after override, a warning flag (`⚠️`) appears on that meal card:

> *"This meal exceeds 50g carbs. Glycemic index behavior changes past ~50g — dosing accuracy may suffer. Consider increasing your meal count."*

### 4.4 Equal Distribution (Non-Training Day)

```
per_meal_calories = daily_calories / N
per_meal_protein  = daily_protein  / N
per_meal_fat      = daily_fat      / N
per_meal_carbs    = daily_carbs    / N
per_meal_fiber    = daily_fiber    / N
```

Meal names assigned by `N`:

| N | Names |
|---|---|
| 3 | Breakfast, Lunch, Supper |
| 4 | Breakfast, Lunch, Snack, Supper |
| 5 | Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Supper |
| 6 | Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Supper, Evening Snack |
| 7 | Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Supper, Evening Snack, Late Snack |

### 4.5 Training-Day Rules

Daily totals are **identical** to the non-training day. Two of the N meal slots are **re-labeled** as Pre-Workout and Post-Workout (depending on training time), and the **composition** of the pre-workout meal adapts per the Three-Hour Rule.

#### 4.5.1 Slot assignment by training time

| Training time | Pre-Workout slot | Post-Workout slot |
|---|---|---|
| Morning | Slot 1 (becomes "Pre-Workout") | Slot 2 (becomes "Post-Workout / Breakfast") |
| Midday | Mid-morning slot or Lunch (whichever is closer in time) | Afternoon Snack or Lunch (whichever comes after) |
| Evening | Afternoon Snack or Supper (whichever lands closer to training) | Supper or Evening Snack |

(Implementation will use a deterministic table per `(N, training_time)` combination; see Appendix A.)

#### 4.5.2 Pre-Workout meal composition by timing

| Pre-workout meal timing | Carbs (amount) | Carbs (type) | Protein | Fat | Fiber |
|---|---|---|---|---|---|
| **3+ hours before training** | Equal share | Complex | Equal share | **Equal share** | **Equal share** |
| **1–3 hours before training** | Equal share | Mostly complex | Equal share | **Half share** | **Half share** |
| **<1 hour before training** | Equal share | **Simple/refined** | Equal share | **0g** | **0g** |

#### 4.5.3 Redistribution math (fat & fiber displaced from pre-workout meal)

```
# For "1–3 hrs before" case:
pre_fat_share   = per_meal_fat × 0.5
pre_fiber_share = per_meal_fiber × 0.5
displaced_fat   = per_meal_fat   - pre_fat_share        # the 0.5× difference
displaced_fiber = per_meal_fiber - pre_fiber_share

# For "<1 hr before" case:
pre_fat_share   = 0
pre_fiber_share = 0
displaced_fat   = per_meal_fat
displaced_fiber = per_meal_fiber

# Redistribute equally across the remaining (N-1) meals:
each_other_meal_fat   = per_meal_fat   + (displaced_fat   / (N - 1))
each_other_meal_fiber = per_meal_fiber + (displaced_fiber / (N - 1))
```

Carbs and protein are NOT redistributed — pre-workout meal keeps its equal share of both. Post-workout meal keeps its equal share of all macros and gets carbs from the *complex* type pool.

### 4.6 Output Cards (in order)

1. **Daily totals card**: confirms inputs + suggested meal count + reasoning copy.
2. **Day-type toggle**: re-shows the same toggle from input section (sticky as user scrolls).
3. **Meal timeline (Non-Training Day)**: card stack, one per meal, with name, time-of-day suggestion, macro breakdown, and example foods per meal.
4. **Meal timeline (Training Day)**: same structure, with Pre-Workout and Post-Workout slots clearly labeled with cyan/gold accents and small ⚡ / 💪 glyphs respectively.
5. **Three-Hour Rule explainer card**: educational. Links to `/calculators/insulin` (Magic Ratio).
6. **Post-Workout Insulin Sensitivity card**: educational. Links to `/calculators/insulin`.
7. **Coaching notes panel** (always visible):
   - 💧 *"Eat in a relaxed state — suit meals to your life schedule, not the other way around."*
   - ⚠️ *"Carbs used to treat hypos count toward your daily totals — adjust meals down on days you've had to treat lows."*
   - 🎯 *"This is a template, not a rule. Shift meal timing as needed. The daily totals are what matter."*
8. **Disclaimer footer** (§4.8).

### 4.7 Educational Card Copy (drafts)

**🕒 Three-Hour Rule card:**

> The timing of your pre-workout meal changes how you should dose insulin for it.
>
> **A meal 3+ hours before training** can be dosed normally — most short-acting insulin has a ~4-hour action window, so by the time you train you'll have roughly 25% of that bolus still on board. That's a great state for strength work and not much hypo risk for endurance.
>
> **A meal within 1 hour of training** is best dosed at roughly 25% of your usual amount (a 75% reduction). The remaining 75% of the bolus would otherwise stack with exercise-driven glucose drops.
>
> Use the **Magic Ratio Calculator** to dial in your current insulin-to-carb ratio, then adjust around training accordingly.
>
> → *Try the Magic Ratio Calculator*

**💉 Post-Workout Insulin Sensitivity card:**

> You're significantly more insulin-sensitive **during and after** training — for up to 24 hours, with peak sensitivity in the 4–6 hours after exercise. Most people benefit from reducing the post-workout meal bolus by **50–75%** of their normal insulin-to-carb ratio. Recheck glucose at 30 min and 2 hours post-meal to verify.
>
> → *Use the Magic Ratio Calculator to recalibrate around training*

### 4.8 Disclaimer Copy

> **⚠️ Educational tool — not medical advice.** The Meal Frequency Planner produces structural eating templates based on dosing-accuracy principles for people with type 1 diabetes and standard nutrition science. Individual macro needs, insulin responses, and meal tolerances vary widely. The 35–45g carbs-per-meal range is a heuristic, not a prescription. Always check glucose around meals to verify your dosing. Consult your endocrinologist or registered dietitian before making significant changes to your eating pattern, especially if you have other medical conditions (renal, hepatic, cardiac), are pregnant, or are managing weight loss/gain at extremes.

---

## 5. Architecture

### 5.1 Routing

Add two new routes to `src/App.jsx`:

```jsx
<Route path="/calculators/pre-workout-glucose" element={<PreWorkoutGlucosePage />} />
<Route path="/calculators/meal-frequency"      element={<MealFrequencyPage />} />
```

### 5.2 File structure

```
src/features/calculators/
├── pre-workout-glucose/
│   ├── PreWorkoutGlucosePage.jsx       # Container — layout, page header, footer
│   ├── PreWorkoutGlucoseForm.jsx       # All 9 inputs
│   ├── IobHelperPanel.jsx              # Expandable IOB helper
│   ├── PredictionResultCards.jsx       # Multi-card output
│   ├── lib/
│   │   ├── prediction.js               # Pure functions: predictEndGlucose(), buildBreakdown()
│   │   ├── riskBands.js                # bandFor(glucose, unit) → { name, color, action }
│   │   ├── carbRecommendation.js       # gramsNeeded(currentPredicted, weight)
│   │   └── units.js                    # mmolToMgdl, mgdlToMmol
│   └── prediction.test.js              # Vitest unit tests
├── meal-frequency/
│   ├── MealFrequencyPage.jsx
│   ├── MealFrequencyForm.jsx
│   ├── MealTimeline.jsx                # Renders an array of meals
│   ├── MealCard.jsx                    # Single meal card
│   ├── CoachingNotesPanel.jsx
│   ├── ThreeHourRuleCard.jsx
│   ├── PostWorkoutSensitivityCard.jsx
│   ├── lib/
│   │   ├── planner.js                  # Main: buildDayPlan(inputs) → { nonTraining: Meal[], training: Meal[] }
│   │   ├── slotAssignment.js           # Per-N + training-time slot template
│   │   ├── compositionRules.js         # Pre-workout composition by timing
│   │   └── redistribution.js           # Fat/fiber redistribution math
│   └── planner.test.js
```

### 5.3 State

Both calculators use **local React state** (`useState` / `useReducer`). No Zustand needed:
- Inputs and results are ephemeral
- No cross-tool data flow in v1
- No persistence

### 5.4 Reused components & styles

- `<Button />`, `<Modal />`, `<Footer />`, `<Nav />`, `<ScrollToTop />` — already exist
- Brand colors (Tailwind tokens `da-dark` / `da-cyan` / `da-gold`) — already in `tailwind.config.js`
- Gradient dividers and card styles — match existing calculator pages
- Glucose-unit toggle pattern — reuse from `CalorieCalculator.jsx` (metric/imperial toggle is structurally identical)

### 5.5 Free Resources page changes

`src/pages/FreeResourcesPage.jsx` (or equivalent — check actual filename during implementation) currently renders a 4-card grid. Update to render 6 cards:

| Existing | New |
|---|---|
| C — Calorie & TDEE | ⚡ Pre-Workout Glucose |
| P — Protein | 🍽 Meal Frequency Planner |
| M — Magic Ratio | |
| C — Cardio (HR Zones) | |

Use existing card component and styling. Assign each new card a left-edge letter glyph (`⚡` and `🍽` or single-letter `G` and `M`) following the existing pattern.

### 5.6 Testing

Vitest unit tests required (no E2E or integration tests in v1):

**Calc #1 (`prediction.test.js`):**
- `predictEndGlucose` returns sensible values for representative scenarios (e.g., 45 min moderate aerobic, 1u IOB, ↓ trend, no recent carbs → expects significant drop)
- Risk-band edge values (3.3, 4.5, 9.0, 13.9, 16.7 mmol/L) classify correctly
- Unit conversion roundtrip preserves value within 0.1 mmol/L
- IOB helper linear-decay math correct for boundary cases (0 min, DIA min, beyond DIA)

**Calc #2 (`planner.test.js`):**
- Auto meal-count is `ceil(carbs / 40)`, clamped to [3, 7]
- Equal distribution sums to daily totals (within floating-point tolerance)
- Pre-workout-fat/fiber redistribution preserves daily fat and fiber totals
- Slot assignment per `(N, training_time)` combination produces expected labels
- 50g carb warning triggers on overridden small meal-count
- Macro consistency check (calories vs. macro-implied calories) triggers correctly

### 5.7 Accessibility

- Semantic HTML: `<main>`, `<section>`, `<h1>`–`<h3>` hierarchy on each calc page
- All inputs have associated `<label htmlFor>`
- Color is never the only signal (risk bands have text + icon + color)
- Keyboard navigation works for all controls including segmented selectors
- Focus states visible (existing site uses cyan focus ring)
- Tooltips dismissible via keyboard
- Color contrast: minimum 4.5:1 for body text on dark background (current brand passes)

---

## 6. Visual / Brand Consistency

Both calcs match the existing pattern:

- Dark page background `bg-da-dark` (#221E1F)
- Page header: centered uppercase Lato Bold title with **gold-accented keyword** + 1-line subtitle in muted gray
- Gradient divider band (`#46C0ED` → `#FCC826`) below header
- Cards: dark surface with subtle border, rounded corners (8px), hover lift (`translateY(-4px)`)
- Primary CTA buttons: cyan `#46C0ED` background, dark text, Lato Bold uppercase
- Secondary CTA: gold `#FCC826` background, dark text
- Reset link: text link, no chrome
- Disclaimer block: small text, muted gray, gold left border

Reference pages in current codebase to copy structure from:
- `CalorieCalculator.jsx` — best match for Calc #1 (rich multi-card output + unit toggle)
- `CardioCalculator.jsx` — best match for Calc #2 (multiple color-coded result cards)

---

## 7. Open Questions / Decisions Deferred

These are intentionally **not** in v1 scope but worth tracking:

1. **Cross-tool data import** — Should Calc #2 auto-fill from TDEE results when available? Deferred to a future polish pass once both calcs ship.
2. **Save / share results** — No save or share in v1. Could add "Copy results to clipboard" or "Email me my plan" in a future iteration (the latter requires the email Cloud Function we've deferred).
3. **Formula refinement** — Calc #1's coefficients are literature-anchored starting values. Real-world feedback may show certain bands need adjustment. Track this for a v1.1 calibration pass.
4. **Mobile UX detail** — Both calcs use the same responsive patterns as existing calcs (single-column on mobile, multi-column on desktop). No mobile-specific designs in this spec; rely on Tailwind defaults + spot-check during implementation.
5. **Pre-workout meal composition for "Mixed" pre-workout timing** — We currently treat "1–3 hours" as half-share fat/fiber. This is an interpolation between the 3-hour and <1-hour bookends. Real coaching may have a more nuanced rule; revisit.

---

## 8. References

- Riddell MC et al. *Exercise management in type 1 diabetes: a consensus statement.* Lancet Diabetes Endocrinol. 2017;5(5):377-390.
- Yardley JE, Sigal RJ. *Exercise strategies for hypoglycemia prevention in individuals with type 1 diabetes.* Diabetes Spectrum. 2015;28(1):32-38.
- EXTOD (Exercise for Type 1 Diabetes) guidelines.
- American Diabetes Association. *Standards of Medical Care in Diabetes — exercise recommendations.* Current edition.
- Graham, Phil. *The Diabetic Muscle and Fitness Guide.* OMNE Publishing, 2018 — Chapter 6 (Nutrition), pp. 110–233. Specifically: meal frequency (p. 210), protein per meal (pp. 141–143), post-workout nutrition (pp. 210–211), macros for fat loss & mass gain (pp. 207–208).
- Diabetic Shred infographics: *"How To Structure Your Diet For Training In The Morning"*, *"How To Structure Your Diet For Training In The Evening"* — provided by Nicholas Caracandas, 2026-05-11.

---

## Appendix A — Slot assignment table

Deterministic mapping from `(meal_count N, training_time)` to which slot becomes Pre-Workout (PW) and Post-Workout (PoW).

Slot indices below are 1-based using the non-training-day naming from §4.4.

| N | Morning training | Midday training | Evening training |
|---|---|---|---|
| 3 | PW=1 (becomes "Pre-Workout / Early Breakfast"), PoW=2 ("Post-Workout / Brunch") | PW=2 (Lunch becomes "Pre-Workout Lunch"), PoW=3 ("Post-Workout Supper") | PW=2 (Lunch), PoW=3 ("Post-Workout Supper") |
| 4 | PW=1, PoW=2 | PW=2 (Lunch), PoW=3 (Snack becomes "Post-Workout") | PW=3 (Snack becomes "Pre-Workout"), PoW=4 ("Post-Workout Supper") |
| 5 | PW=1, PoW=2 | PW=2 (Mid-morning becomes "Pre-Workout"), PoW=3 (Lunch becomes "Post-Workout") | PW=4 (Afternoon Snack), PoW=5 ("Post-Workout Supper") |
| 6 | PW=1, PoW=2 | PW=3 (Lunch), PoW=4 (Afternoon Snack) | PW=4 (Afternoon Snack), PoW=5 ("Post-Workout Supper") |
| 7 | PW=1, PoW=2 | PW=3 (Lunch), PoW=4 (Afternoon Snack) | PW=4 (Afternoon Snack), PoW=5 ("Post-Workout Supper") |

Implementation note: pre/post slot labels in the UI override the default meal name (e.g., "Lunch" becomes "Pre-Workout (Lunch)" on training days).

---

*End of spec.*
