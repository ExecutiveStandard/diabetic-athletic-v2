# Magic Ratio Calculator — Beginner / Advanced Mode + Educational Additions

| | |
|---|---|
| **Date** | 2026-05-13 |
| **Status** | Approved — awaiting implementation plan |
| **Branch** | `feature/phase-1` |
| **Owner** | Nicholas Caracandas |
| **Related file** | `src/features/calculators/InsulinCalculator.jsx` (existing) |

---

## 1. Context

A real tester provided feedback that the calculator's outputs don't match his actual insulin needs:

> *"One of [the] problems I have is that depending on the workout I can be more or less insulin sensitive. For example 80% of the time I need 4 units of insulin waking up without doing anything. Then I need to take a larger dose for carbs in the morning than what the app suggested... The app worked well in the afternoon specifically when things were a bit more settled but then I would struggle again in the evening."*

The feedback surfaces a real limitation: TDD-derived ratios from `weight × 0.55` are accurate for "average" T1Ds but diverge significantly for users with non-typical body composition, training status, sex, or hormonal context. The calculator's job is to give every T1D — beginner or experienced — the most accurate possible **calculated** starting ratios for their *Insulin Sensitivity Factor* and three time-of-day *I:C ratios*.

The fix is **not** to let users override the calculated ratios (which would defeat the calculator's purpose — anyone who already has their ratios doesn't need the calculator). The fix is to let users with more information about themselves feed it in, producing ratios calibrated to their physiology.

Additionally, the tester's "4 units on waking" mention surfaces a common misunderstanding in the T1D community: confusion between **Dawn Phenomenon** (overnight glucose rise) and **Foot-to-Floor** (post-waking cortisol/adrenaline spike). Most public resources conflate these, even though they have different solutions. Adding an educational card that distinguishes them is high-value differentiation.

## 2. Audience & Non-Goals

**Primary audience:**
- T1Ds discovering their I:C and ISF ratios for the first time (Beginner)
- T1Ds with partial knowledge of their physiology (actual TDD, body composition, training status, sex/cycle) who want more accurate calculated ratios (Advanced)
- All users, regardless of mode, who want to understand why their morning numbers might behave differently

**Non-goals (explicit, v1):**
- ❌ **No I:C or ISF override fields.** The calculator always outputs *calculated* ratios — never user-supplied ratios. A user who already has their ratios dialed in has no reason to be using this calculator.
- ❌ **No funnel CTA on the calculator.** The lead-capture (firstName/email) at the top of the form already feeds Nicholas's email opt-in funnel; no "book a call" button or similar.
- ❌ **No persistence across sessions.** Each visit starts fresh.
- ❌ **No Foot-to-Floor (FOTF) input field.** Educational copy only — the calculator doesn't model FOTF in its math.
- ❌ **No changes to the Beginner inputs or their math** — Beginner-mode output is identical to today's behavior.
- ❌ **No URL change.** Route stays `/calculators/insulin` (and the `/calculators/magic-ratio` alias).

---

## 3. Two-Tier Structure

A **Beginner / Advanced** segmented toggle sits between the lead-capture fields (firstName / email) and the main calculator inputs.

### 3.1 Beginner Mode (default)

The existing 6-input flow, completely unchanged:
- Weight + units (kg/lb)
- Insulin type (rapid-acting / regular)
- BG unit (mg/dL or mmol/L)
- Current BG
- Carb grams
- Time of day (morning / afternoon / evening)

Outputs the existing 3-section results: ISF, three I:C ratios, meal-dose calculator.

### 3.2 Advanced Mode (toggle-on)

Same 6 Beginner inputs plus a new **Advanced inputs** section containing 4 additional inputs that refine the TDD calculation. The output structure is the same as Beginner — only the *values* differ because the math has more accurate inputs.

When Advanced toggle is on but all Advanced inputs are at their defaults, the math output is **identical to Beginner-mode output for the same Beginner inputs.** Refinement is opt-in.

---

## 4. The 4 New Advanced Inputs

### 4.1 Actual Total Daily Dose

| | |
|---|---|
| **Format** | Optional number input (units of insulin) |
| **Range** | 5–200 |
| **Default** | Empty (falls back to weight-based estimate) |
| **State variable** | `actualTdd` (string — parsed as float when used) |
| **Purpose** | Replace the `weight × 0.55` (or `weight ÷ 4` for lb) estimate with the user's actual daily insulin total. Most experienced T1Ds know this number; it's typically more accurate than any body-composition-based estimate. |
| **Helper text** | *"Your average daily insulin (basal + bolus combined). If you don't know this, leave it blank — we'll estimate from your weight."* |

### 4.2 Body Fat Percentage

| | |
|---|---|
| **Format** | Optional number input (%) |
| **Range** | 5–60 |
| **Default** | Empty |
| **State variable** | `bodyFatPercent` |
| **Visibility / precedence** | Used **only when `actualTdd` is empty**. When provided, TDD is estimated from lean body mass instead of total weight: `TDD = (weight × (1 − bodyFat%/100)) × 0.7`. |
| **Purpose** | More accurate TDD for very lean athletes (whose TDD is significantly lower than a weight-based estimate suggests) and for higher-BF individuals (whose TDD is closer to LBM-based math than total-weight math). |
| **Helper text** | *"For a more accurate TDD estimate if you know your body fat %. Skip if you provided actual TDD above."* |

### 4.3 Training Status

| | |
|---|---|
| **Format** | 4-button tile grid, matching the existing Workout Type tile pattern |
| **Options + descriptors** | • Untrained — *Little or no regular exercise* • Recreational — *2–3 days/week, casual* • Trained — *4–5 days/week, structured plan* • Highly Trained — *6–7 days/week, competitive* |
| **Default** | Recreational |
| **State variable** | `trainingStatus` |
| **Purpose** | Modulates the TDD estimate based on insulin-sensitivity adaptations from training. Higher training status → more insulin-sensitive → lower TDD relative to weight → looser ratios (more carbs per unit, bigger correction effect). Validated framework: same 4-bucket scheme used in the Workout Fueling Calculator. |

### 4.4 Sex (+ optional Cycle phase for female users)

| | |
|---|---|
| **Format (Sex)** | Horizontal segmented toggle, Male / Female |
| **Default (Sex)** | Male |
| **State variable (Sex)** | `sex` |
| **Format (Cycle)** | Optional expandable section labeled *"Refine for menstrual cycle phase (optional)"*, collapsed by default. Shown only when `sex === 'female'`. 4 options: Follicular Phase / Mid-cycle / Luteal Phase / Don't know or N/A. |
| **Default (Cycle)** | Don't know or N/A |
| **State variable (Cycle)** | `cyclePhase` (+ `cycleExpanded` boolean) |
| **Purpose** | Captures sex-related baseline insulin sensitivity (women ~5–10% more sensitive at baseline) plus the meaningful 15–30% intra-cycle variation from progesterone/estrogen shifts (follicular = most sensitive, luteal = least). Mirrors the inclusivity pattern from the Workout Fueling Calc: "Don't know / N/A" is a first-class default, covering post-menopausal, hormonal contraception, irregular cycles, non-trackers. |

---

## 5. Math Integration

### 5.1 Principle

The Advanced inputs feed into a **TDD-refinement chain**. The existing ISF and I:C formulas (`ISF = 1800/TDD`, `I:C = 500/(TDD × factor)`) are unchanged — they just receive a more accurate TDD value when the user provides more information.

### 5.2 TDD computation flow

```
Step 1 — Determine base TDD:
  if actualTdd provided      → tdd_base = actualTdd
  else if bodyFatPercent     → tdd_base = (weight × (1 - bodyFat%/100)) × 0.7
  else                       → tdd_base = weight × 0.55 (kg) or weight ÷ 4 (lb)  [existing default]

Step 2 — Apply Training Status multiplier:
  tdd_after_training = tdd_base × TRAINING_TDD_MULT[trainingStatus]

Step 3 — Apply Sex × Cycle multipliers (women baseline more insulin sensitive):
  sex_mult   = SEX_TDD_MULT[sex] ?? 1.00
  cycle_mult = sex === 'female' ? (CYCLE_TDD_MULT[cyclePhase] ?? 0.95) : 1.00
  tdd_final  = tdd_after_training × sex_mult × cycle_mult

Step 4 — Compute ISF and the 3 I:C ratios from tdd_final (existing formulas unchanged):
  ISF             = ISF_NUMERATORS[insulinType][bgUnit] / tdd_final
  I:C morning     = 500 / (tdd_final × 0.8)
  I:C afternoon   = 500 / (tdd_final × 1.2)
  I:C evening     = 500 / tdd_final
```

### 5.3 Coefficient tables

All values are literature-anchored starting points from Riddell 2017, Yardley 2018, ADA exercise recommendations, and insulin-sensitivity research. Subject to real-world refinement.

```js
const TRAINING_TDD_MULT = {
  untrained:     1.10,  // higher insulin resistance, slightly more daily insulin
  recreational:  1.00,  // baseline matches weight × 0.55 estimate
  trained:       0.90,  // ~10% reduction from training adaptations
  highlyTrained: 0.80,  // ~20% reduction at elite levels
}

const SEX_TDD_MULT = {
  male:   1.00,  // baseline
  female: 0.95,  // women ~5% more insulin sensitive at baseline (cycle adds further variation)
}

const CYCLE_TDD_MULT = {
  follicular: 0.90,  // most sensitive (low estrogen + progesterone) — multiplies female 0.95 × 0.90 = 0.855
  midCycle:   0.95,  // intermediate — multiplies to 0.95 × 0.95 = 0.9025
  luteal:     1.05,  // least sensitive (high progesterone) — multiplies to 0.95 × 1.05 = 0.9975 (near male baseline)
  unknown:    0.95,  // safe midpoint default for women who don't track / don't menstruate
}
```

### 5.4 Backward compatibility

When all Advanced inputs are at their defaults (`actualTdd` empty, `bodyFatPercent` empty, `trainingStatus = 'recreational'`, `sex = 'male'`), all multipliers evaluate to 1.00 and `tdd_final === weight × 0.55`. **Output is identical to today's behavior.** All existing prediction-related tests in the calculator continue to pass without modification.

### 5.5 Default-case neutrality verification

Worked example: 80 kg user, no Advanced inputs filled.
- `tdd_base = 80 × 0.55 = 44 units`
- `tdd_after_training = 44 × 1.00 = 44`
- `tdd_final = 44 × 1.00 × 1.00 = 44`
- `ISF (rapid, mmol/L) = 100/44 = 2.27 mmol/L per unit`
- `I:C morning = 500 / (44 × 0.8) = 14.2g per unit`

Matches existing Beginner-mode output exactly.

Worked example: same 80 kg user, Advanced-mode with Trained + Female + Follicular.
- `tdd_base = 80 × 0.55 = 44`
- `tdd_after_training = 44 × 0.90 = 39.6`
- `tdd_final = 39.6 × 0.95 × 0.90 = 33.86`
- `ISF (rapid, mmol/L) = 100/33.86 = 2.95 mmol/L per unit` (33% higher — much more sensitive)
- `I:C morning = 500 / (33.86 × 0.8) = 18.5g per unit` (30% looser — more carbs per unit)

Reflects the expected physiology of a trained female in follicular phase.

---

## 6. Form Layout

The Advanced section sits between the existing Beginner inputs and the Results section. It's only visible when the mode toggle is set to Advanced.

```
┌─ Page header (unchanged: ⚡ Magic Ratio Calculator)
│
├─ Lead capture (firstName, email)               ← unchanged
│
├─ 🆕 Mode toggle: [ Beginner ● ] [ Advanced ]
│       (Recommended)    (I have more data)
│
├─ ── BEGINNER inputs (always visible) ────────
│  • Weight + units
│  • Insulin type
│  • BG unit
│  • Current BG
│  • Carb grams
│  • Time of day
│
├─ ── ADVANCED inputs (visible only when toggle = Advanced) ──── ← NEW
│  • Actual Total Daily Dose (optional)
│  • Body fat % (optional, ignored if Actual TDD provided)
│  • Training Status (4-tile selector, default = Recreational)
│  • Sex (Male/Female toggle, default = Male)
│    └─ Menstrual cycle phase (conditional optional expander when Female)
│
├─ ── RESULTS section ─────────────────────────
│  • Your ISF                                    (unchanged structure)
│  • Your 3 I:C ratios                           (unchanged structure)
│  • Meal Dose Calculator                        (unchanged structure)
│  • 🆕 Dawn Phenomenon vs Foot-to-Floor card    (NEW — always visible)
│  • 🆕 Reality-check note                       (NEW — always visible)
│
└─ Disclaimer (unchanged)
```

---

## 7. UI Specifications

### 7.1 Mode toggle (top of form)

```jsx
<div>
  <label className="block text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Mode</label>
  <div className="grid grid-cols-2 gap-2">
    {[
      ['beginner', 'Beginner', 'Recommended'],
      ['advanced', 'Advanced', 'I have more data'],
    ].map(([id, lbl, detail]) => (
      <button key={id} type="button" onClick={() => setMode(id)}
        className={`p-3 rounded-lg text-left ${mode === id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/10'}`}>
        <div className={`font-bold ${mode === id ? 'text-da-cyan' : 'text-white'}`}>{lbl}</div>
        <div className="text-xs text-white/40">{detail}</div>
      </button>
    ))}
  </div>
</div>
```

State: `const [mode, setMode] = useState('beginner')`

### 7.2 Advanced inputs section

Wrapped in a single `<section>` with a section header, rendered conditionally:

```jsx
{mode === 'advanced' && (
  <section>
    <h2 className="text-da-cyan uppercase tracking-widest text-sm font-bold mb-2">Advanced Inputs</h2>
    <p className="text-white/50 text-sm mb-6">
      The more we know about you, the more accurate your calculated ratios. All fields below are optional — fill in what you know.
    </p>

    {/* Actual TDD */}
    {/* Body fat % */}
    {/* Training Status */}
    {/* Sex (+ Cycle expander) */}
  </section>
)}
```

(Individual input JSX omitted from spec — patterns match the Workout Fueling Calc personalization inputs; details locked at implementation time.)

### 7.3 Educational card — Dawn vs Foot-to-Floor

Always visible, placed AFTER the Meal Dose Calculator and BEFORE the disclaimer footer.

```jsx
<section className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
  <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">🌅 Why your morning numbers might still need adjusting</p>
  <div className="text-white/70 space-y-3 text-sm leading-relaxed">
    <p><strong className="text-white">Dawn Phenomenon</strong> is a slow glucose rise that happens <em>while you're still asleep</em> (typically 2–4 AM), driven by overnight hormones. If your glucose is <em>already</em> elevated when you check on waking, that's a sign of dawn phenomenon — usually addressed by overnight basal adjustments or bedtime tweaks, not by this calculator.</p>
    <p><strong className="text-white">Foot-to-Floor</strong> is the sharp glucose spike that happens <em>after you get out of bed</em>, driven by the cortisol and adrenaline of waking up. Your glucose is fine on waking, then rises 15–60 minutes later. Many T1Ds preempt this with a small fixed bolus on waking.</p>
    <p>These two get conflated constantly. If you suspect one of them is affecting your mornings, track your numbers around waking for a week and look at the pattern — getting the diagnosis right is the first step toward dosing with confidence.</p>
  </div>
</section>
```

### 7.4 Reality-check note

Small italic line placed BETWEEN the Meal Dose Calculator output and the Dawn/FOTF card.

```jsx
<p className="text-xs text-white/50 italic text-center">
  These are your calibrated starting points. Track your real-world response over 1–2 weeks and you'll lock in the version that's truly yours.
</p>
```

---

## 8. Architecture

### 8.1 File modifications

| File | Change |
|---|---|
| `src/features/calculators/InsulinCalculator.jsx` | Add `mode` toggle state; add 6 new useState hooks (`actualTdd`, `bodyFatPercent`, `trainingStatus`, `sex`, `cyclePhase`, `cycleExpanded`); add 3 multiplier-table module-level constants (`TRAINING_TDD_MULT`, `SEX_TDD_MULT`, `CYCLE_TDD_MULT`) + 2 selector tables (`TRAINING_STATUSES`, `CYCLE_PHASES`); extend `calcTDD` to accept and apply the refinement chain; update `reset()` to clear new state; insert the Mode toggle, Advanced inputs section, Educational card, and Reality-check note into the JSX. |

No new files. No URL changes.

### 8.2 Math helper changes

The existing `calcTDD({ weight, weightUnits })` function gains optional refinement parameters:

```js
function calcTDD({
  weight,
  weightUnits,
  // NEW (all optional — when omitted, function returns the existing weight-based estimate)
  actualTdd,
  bodyFatPercent,
  trainingStatus,
  sex,
  cyclePhase,
}) {
  if (!weight || weight <= 0) return 0

  // Step 1 — base TDD
  let tdd
  if (actualTdd && actualTdd > 0) {
    tdd = actualTdd
  } else if (bodyFatPercent && bodyFatPercent > 0 && bodyFatPercent < 60) {
    const lbm = weight * (1 - bodyFatPercent / 100)
    tdd = (weightUnits === 'kg' ? lbm * 0.7 : (lbm / 2.2) * 0.7)
  } else {
    tdd = weightUnits === 'kg' ? weight * 0.55 : weight / 4
  }

  // Step 2 — training status
  tdd *= TRAINING_TDD_MULT[trainingStatus] ?? 1.00

  // Step 3 — sex × cycle
  const sexMult = SEX_TDD_MULT[sex] ?? 1.00
  const cycleMult = sex === 'female' ? (CYCLE_TDD_MULT[cyclePhase] ?? 0.95) : 1.00
  tdd *= sexMult * cycleMult

  return tdd
}
```

`calcISF`, `calcICR`, `calcCarbDose`, `calcCorrectionDose` are **unchanged** — they receive the refined TDD value and compute as before.

### 8.3 State management

All new state via `useState` hooks in the React component. No Zustand, no Context, no persistence — matches the rest of the calculator suite.

---

## 9. Testing

### 9.1 No new unit tests required for v1

The math changes are linear multiplier chains with no new conditional branches beyond what's already tested by Beginner-mode coverage. The values themselves are literature-anchored coefficients, not formulas with edge cases. Adding tests for "Trained users get a lower TDD" or "Female + follicular reduces TDD further" is low-value because the math is direct multiplication.

**However**, if any new unit tests are added in implementation, they should at minimum cover:
1. Default-case neutrality (all Advanced inputs at defaults → output matches Beginner-mode)
2. `calcTDD` math precedence: `actualTdd` overrides `bodyFatPercent`, which overrides `weight × 0.55`
3. Backward compatibility: calling `calcTDD({ weight, weightUnits })` without any Advanced inputs returns the same value as before

### 9.2 Manual visual QA

Verify in browser:
- Mode toggle defaults to Beginner; Advanced inputs hidden
- Switching to Advanced reveals the new section with 4 input groups in correct order
- Filling Actual TDD makes Body Fat % visibly skippable (or grayed) — *defer styling decision to implementation*
- Filling Body Fat % alone (no Actual TDD) reduces the computed TDD vs. baseline (lean-mass math)
- Training Status tiles: Highly Trained reduces TDD by ~20% vs Recreational baseline
- Sex toggle Female reveals the Cycle expander
- Cycle expander 4 phase tiles + helper text + "Don't know / N/A" default
- ISF and 3 I:C ratios update live as Advanced inputs change
- Dawn-vs-FOTF educational card is visible in all modes
- Reality-check note is visible in all modes
- Reset button clears all 6 new state vars back to their defaults (mode → 'beginner', sex → 'male', etc.)

---

## 10. Visual / Brand Consistency

- Mode toggle uses the 2-tile pattern from the Meal Frequency Planner's Day Type selector
- Advanced inputs section header matches the existing "Required Info" section header pattern
- Training Status tiles match the Workout Type / Goal tile patterns
- Sex toggle styling matches the IOB-helper pump/MDI toggle
- Cycle expander matches the IOB helper expander (`+ / −` toggle, dark content panel)
- Dawn/FOTF educational card uses `border-l-4 border-da-cyan` (matching the Three-Hour Rule card in the Meal Frequency Planner)
- Reality-check note uses muted italic styling consistent with other helper text throughout the suite

---

## 11. Open Questions / Decisions Deferred

1. **Coefficient calibration** — Multiplier values are literature-anchored starting points. They may need refinement based on real-world feedback from users.
2. **Lean-mass conversion constant** — Using `0.7` (LBM × 0.7 → estimated TDD) is a published rough constant; alternatives (0.65, 0.75) exist in different literature sources. May refine.
3. **Disabling Body Fat % when Actual TDD is filled** — Spec says "ignored when Actual TDD is provided." Implementation may choose to visually gray-out / disable the BF% field in that case for clarity, or leave it active but unused. Defer to implementation taste.
4. **Tooltips on multiplier numbers** — When the calculator displays an ISF of e.g. 2.95 instead of the unmodified 2.27, the user might wonder "why?". A future enhancement could add a small expandable "why this number?" tooltip showing the refinement chain. Out of scope for v1.

---

## 12. References

- Riddell MC et al. *Exercise management in type 1 diabetes: a consensus statement.* Lancet Diabetes Endocrinol. 2017;5(5):377-390.
- Yardley JE. *Reassessing the evidence: Prandial state dictates glycaemic responses to exercise in T1D.* Diabet Med. 2018.
- American Diabetes Association. *Standards of Medical Care in Diabetes — exercise & insulin sensitivity recommendations.* (current edition)
- Brown SA et al. *Menstrual cycle phase and glucose dynamics in T1D.* (summarized in Riddell 2017)
- Existing Workout Fueling Calculator personalization spec (`2026-05-13-workout-fueling-calc-personalization-design.md`) for the multiplier framework pattern.

---

*End of spec.*
