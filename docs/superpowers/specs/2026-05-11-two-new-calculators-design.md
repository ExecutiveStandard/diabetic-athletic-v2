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

After a client receives their daily macro targets (from the TDEE calculator or elsewhere), they ask: *"How do I actually eat this?"* This calculator answers by reproducing — in a self-serve form — the same **peri-workout-weighted distribution model** Nicholas uses in his "Done For You Check-In System" master spreadsheet (Macro Timing tab). Specifically:

1. Daily macros distribute across **N meals** using configurable peri-workout **weights** — carbs concentrate around training (default **65%** of daily carbs in the pre + post workout meals combined), while fat **avoids** training (default **15%** of daily fat in pre + post) to keep pre-workout meals light for dosing accuracy and digestive comfort.
2. Defaults are **4 training-day meals** and **3 rest-day meals** (matching the master sheet). User can override 3–7 with smart suggestions when high daily-carb totals would force any meal above 50g (the dosing-accuracy ceiling).
3. Output produces a **non-training-day** template AND a **training-day** template with **identical daily totals** — only structure shifts.
4. Educational cards surface the **Three-Hour Rule**, **post-workout insulin sensitivity**, and other coaching context — linking to the existing **Magic Ratio Calculator** for insulin adjustments.

### 4.2 Inputs

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Daily calories | Number | Yes | Range: 1000–6000. Cross-checked against macro-derived calories (consistency warning if off by >10%). |
| 2 | Daily protein | Number (g) | Yes | Range: 30–400. |
| 3 | Daily fat | Number (g) | Yes | Range: 20–250. |
| 4 | Daily carbs | Number (g) | Yes | Range: 30–700. |
| 5 | Daily fiber | Number (g) | Yes | Default **25**, editable. Range: 10–60. |
| 6 | Day type toggle | Segmented (Non-training / Training) | Yes | Drives whether training-day inputs appear. |
| 7 | Training time *(training-day only)* | 3-button (Morning / Afternoon / Evening) | Conditional | Determines chronological slot ordering. |
| 8 | Peri-workout **carb** weight *(training-day only)* | Slider, default **0.65**, range **0.40–0.80** | Conditional | Fraction of daily carbs that goes to the **pre + post** workout meals combined. Default matches master sheet. |
| 9 | Peri-workout **fat** weight *(training-day only)* | Slider, default **0.15**, range **0.10–0.30** | Conditional | Fraction of daily fat that goes to pre + post combined. Default matches master sheet. |
| 10 | Meal count | Selector (3–7) | Yes | Defaults: **4 training / 3 rest**. Smart suggestion bumps the default upward when the math would force any meal over 45g carbs (see §4.3). |

A **macro-calorie consistency check** (warning, non-blocking) verifies that `protein×4 + fat×9 + carbs×4` is within ±10% of stated calories. If outside that range: *"Heads up — your stated macros don't add up to your stated calories. Double-check your numbers."* The calculator still produces output using the macros (treated as source of truth).

### 4.3 Meal Count Mechanic

**Defaults** (per master sheet):
- Training day → **4 meals** (2 peri + 2 regular)
- Rest day → **3 meals**

**Smart bump suggestion** — fired when defaults would produce any meal exceeding **45g** carbs (the top of the dosing-accuracy sweet spot, with 5g headroom below the 50g hard threshold):

```
# Training day with peri weights
peri_carbs_each    = (carb_weight × daily_carbs) / 2
regular_carbs_each = ((1 - carb_weight) × daily_carbs) / (N - 2)

# Rest day
rest_carbs_each    = daily_carbs / N
```

Auto-suggest a higher `N` when either `regular_carbs_each > 45` or `rest_carbs_each > 45`. The calculator shows the suggestion prominently with reasoning copy:

> *"With **{daily_carbs}g** daily carbs and the default **{carb_weight×100}%** peri-workout weighting, **{N} training meals** would land each meal at {≤45g} carbs — within the 35–45g dosing-accuracy sweet spot. We suggest **{suggested_N}**."*

User can override to anything in the 3–7 range regardless of suggestion. **Warning flag** (`⚠️`) appears on any meal exceeding 50g carbs:

> *"This meal exceeds 50g carbs. Glycemic index behavior changes past ~50g — dosing accuracy may suffer. Consider increasing your meal count or reducing the peri-workout carb weight."*

**Edge case** — peri meal carbs themselves exceed 45g (happens at high daily-carb totals like 250g+ where `0.65 × 250 / 2 = 81g > 45g`): show a secondary suggestion to **reduce the peri-workout carb weight** (e.g., from 0.65 → 0.50). Increasing meal count cannot fix this because peri meals are always exactly 2 in count.

### 4.4 Distribution Math — Training Day

Given inputs: `daily_carbs`, `daily_protein`, `daily_fat`, `daily_fiber`, `N`, `carb_weight`, `fat_weight`.

There are always exactly **2 peri-workout meals** (Pre + Post) and **N − 2 regular meals**.

```
# CARBS — weighted toward peri
peri_carbs_total    = carb_weight × daily_carbs
regular_carbs_total = (1 - carb_weight) × daily_carbs
peri_carbs_each     = peri_carbs_total / 2
regular_carbs_each  = regular_carbs_total / (N - 2)

# FAT — weighted away from peri
peri_fat_total    = fat_weight × daily_fat
regular_fat_total = (1 - fat_weight) × daily_fat
peri_fat_each     = peri_fat_total / 2
regular_fat_each  = regular_fat_total / (N - 2)

# PROTEIN — equal across ALL meals
per_meal_protein = daily_protein / N

# FIBER — equal across ALL meals
per_meal_fiber = daily_fiber / N

# CALORIES — derived from each meal's macros, NOT distributed separately
meal_calories = (meal_protein × 4) + (meal_carbs × 4) + (meal_fat × 9)
```

**Worked example** (Nicholas's sheet, training-day defaults: 1700 cal / 100g P / 100g C / 100g F / 30g fiber, N = 4, carb_weight = 0.65, fat_weight = 0.15):

| Slot | Protein | Carbs | Fat | Fiber | Calories (derived) |
|---|---:|---:|---:|---:|---:|
| Pre-Workout | 25 | **32.5** | **7.5** | 7.5 | **297.5** |
| Post-Workout | 25 | **32.5** | **7.5** | 7.5 | **297.5** |
| Regular meal 1 | 25 | 17.5 | 42.5 | 7.5 | **552.5** |
| Regular meal 2 | 25 | 17.5 | 42.5 | 7.5 | **552.5** |
| **Daily total** | **100** | **100** | **100** | **30** | **1700** ✅ |

Matches master sheet exactly.

### 4.5 Distribution Math — Rest Day

Equal distribution across all N rest-day meals (default N = 3):

```
each_meal_protein = daily_protein / N
each_meal_carbs   = daily_carbs   / N
each_meal_fat     = daily_fat     / N
each_meal_fiber   = daily_fiber   / N
each_meal_cals    = (protein × 4) + (carbs × 4) + (fat × 9)
```

**Worked example** (same daily totals as above, N = 3):

| Slot | Protein | Carbs | Fat | Fiber | Calories |
|---|---:|---:|---:|---:|---:|
| Breakfast | 33.3 | 33.3 | 33.3 | 10 | 566.7 |
| Lunch | 33.3 | 33.3 | 33.3 | 10 | 566.7 |
| Dinner | 33.3 | 33.3 | 33.3 | 10 | 566.7 |
| **Daily total** | **100** | **100** | **100** | **30** | **1700** ✅ |

Matches master sheet exactly.

### 4.6 Slot Template & Chronological Ordering

The master sheet uses a fixed 6-slot chronological template with some slots **zeroed out** depending on training time. Our calculator generalizes this for variable meal counts while preserving the chronological ordering principle.

**Slot ordering on training day** — peri meals are placed chronologically around the training window; regular meals fill the remaining slots in time order:

| Training time | Slot order (chronological) |
|---|---|
| **Morning** (e.g., 6–9am) | **Pre-Workout** → **Post-Workout** → (Lunch) → (Dinner) → … |
| **Afternoon** (e.g., midday–4pm) | (Breakfast) → **Pre-Workout** → **Post-Workout** → (Dinner) → … |
| **Evening** (e.g., 5–8pm) | (Breakfast) → (Lunch) → **Pre-Workout** → **Post-Workout** → (Late snack) → … |

Where `()` are regular meals filling around the Pre/Post anchor.

**Slot template per (N, training_time)** is deterministic. See **Appendix A** for the full table covering N = 3..7.

**Meal labels** — combine the slot's position name with the meal's role:
- Regular slots use chronological names: **Breakfast / Mid-Morning Snack / Lunch / Afternoon Snack / Dinner / Evening Snack / Late Snack** (subset chosen by N)
- Peri slots are labeled **"Pre-Workout"** and **"Post-Workout"** (with cyan ⚡ and gold 💪 visual accents)

### 4.7 Output Cards (in order)

1. **Daily totals card**: confirms inputs + meal count + reasoning copy. Shows macro-derived calorie total alongside user-entered calories.
2. **Day-type toggle**: re-shows the toggle from inputs (sticky as user scrolls).
3. **Meal timeline**: card stack rendered in chronological order. Each meal card shows name + role label (Pre/Post if applicable) + macro breakdown (cal/P/C/F/fiber) + carbs-type indicator (simple/complex/mixed) + 50g warning flag if applicable.
4. **🕒 Three-Hour Rule explainer card** *(educational, not in math)*: links to `/calculators/insulin` (Magic Ratio).
5. **💉 Post-Workout Insulin Sensitivity card** *(educational, not in math)*: links to `/calculators/insulin`.
6. **Coaching notes panel** (always visible):
   - 💧 *"Eat in a relaxed state — suit meals to your life schedule, not the other way around."*
   - ⚠️ *"Carbs used to treat hypos count toward your daily totals — adjust meals down on days you've had to treat lows."*
   - 🎯 *"This is a template, not a rule. Shift meal timing as needed. The daily totals are what matter."*
   - 🍎 *"Pre-workout meals are weighted toward simple carbs for fast availability during training. Post-workout meals favor complex carbs for sustained replenishment."* (This is the carb-type *suggestion* — the math doesn't differ by type, but the meal-card label and example-foods list does.)
7. **Disclaimer footer** (§4.8).

### 4.7.1 Educational Card Copy (drafts)

These cards appear in the output regardless of inputs (after the meal timeline). They teach the dosing context — the calculator itself doesn't act on them.

**🕒 Three-Hour Rule card:**

> The **timing** of your pre-workout meal changes how you should **dose insulin** for it (even though the meal's macros stay the same in this plan).
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
│   │   ├── planner.js                  # Main: buildDayPlan(inputs) → { meals: Meal[] }
│   │   ├── slotAssignment.js           # Per-(N, training_time) slot template
│   │   ├── distribution.js             # Peri-weighted macro distribution math
│   │   └── mealCount.js                # Defaults + smart bump suggestion
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

**Calc #2 (`planner.test.js` + helpers):**
- Default meal counts are 4 (training) and 3 (rest); both can be user-overridden to any 3..7 value
- Smart bump suggestion fires when `regular_carbs_each > 45g` OR `rest_carbs_each > 45g` and produces the next-higher feasible N
- Peri-weighted distribution sums to daily totals exactly (within floating-point tolerance) — sheet-verified at 1700 cal / 100g P / 100g C / 100g F / 30g fiber / N=4 / 0.65 / 0.15 → matches Pre 297.5, Post 297.5, Regulars 552.5 each
- Rest-day equal distribution sums to daily totals (sheet-verified at same inputs / N=3 → 566.67 cal × 3)
- Slot assignment per `(N, training_time)` combination produces expected chronological ordering (see Appendix A)
- 50g carb warning fires on any meal exceeding 50g
- Macro-calorie consistency check (calories vs. macro-derived calories) triggers when off by >10%
- Edge-case: when peri meal carbs alone exceed 45g, the secondary "reduce peri weight" suggestion appears (since increasing N doesn't help peri meals)

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

Deterministic mapping from `(meal_count N, training_time)` to **chronologically ordered** slot labels. Pre and Post are always adjacent. Indices are 0-based for implementation simplicity; labels read from left to right = first meal of day to last.

| N | Morning training | Afternoon training | Evening training |
|---|---|---|---|
| **3** | `[Pre, Post, Dinner]` (preIdx=0, postIdx=1) | `[Breakfast, Pre, Post]` (preIdx=1, postIdx=2) | `[Breakfast, Pre, Post]` (preIdx=1, postIdx=2) |
| **4** | `[Pre, Post, Lunch, Dinner]` (preIdx=0, postIdx=1) | `[Breakfast, Pre, Post, Dinner]` (preIdx=1, postIdx=2) | `[Breakfast, Lunch, Pre, Post]` (preIdx=2, postIdx=3) |
| **5** | `[Pre, Post, Lunch, Snack, Dinner]` (preIdx=0, postIdx=1) | `[Breakfast, Snack, Pre, Post, Dinner]` (preIdx=2, postIdx=3) | `[Breakfast, Lunch, Snack, Pre, Post]` (preIdx=3, postIdx=4) |
| **6** | `[Pre, Post, Snack, Lunch, Snack, Dinner]` (preIdx=0, postIdx=1) | `[Breakfast, Snack, Pre, Post, Snack, Dinner]` (preIdx=2, postIdx=3) | `[Breakfast, Snack, Lunch, Snack, Pre, Post]` (preIdx=4, postIdx=5) |
| **7** | `[Pre, Post, Snack, Lunch, Snack, Dinner, Late Snack]` (preIdx=0, postIdx=1) | `[Breakfast, Snack, Pre, Post, Snack, Dinner, Late Snack]` (preIdx=2, postIdx=3) | `[Breakfast, Snack, Lunch, Snack, Pre, Post, Late Snack]` (preIdx=4, postIdx=5) |

**Rest day** uses the same N-keyed name template, peri-workout slots are absent:

| N | Slot labels |
|---|---|
| 3 | Breakfast, Lunch, Dinner |
| 4 | Breakfast, Lunch, Snack, Dinner |
| 5 | Breakfast, Snack, Lunch, Snack, Dinner |
| 6 | Breakfast, Snack, Lunch, Snack, Dinner, Late Snack |
| 7 | Breakfast, Snack, Lunch, Snack, Dinner, Late Snack, Bedtime Snack |

Implementation: peri slots in the rendered UI show **"Pre-Workout"** / **"Post-Workout"** as the primary label with the chronological name (e.g., "Lunch") as a sub-label or tooltip.

---

*End of spec.*
