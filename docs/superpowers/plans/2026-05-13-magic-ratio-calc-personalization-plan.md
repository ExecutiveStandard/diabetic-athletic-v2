# Magic Ratio Calc — Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Magic Ratio Calculator around a Beginner / Advanced two-tier UX, replacing the existing user-supplied I:C/ISF override with a TDD-refinement chain (Actual TDD, Body Fat %, Training Status, Sex + optional Cycle phase), and add two educational pieces (Reality-check note + Dawn-vs-Foot-to-Floor explainer card) that strengthen the calculator's value as a standalone lead magnet.

**Architecture:** Three sequential single-file tasks, all touching `InsulinCalculator.jsx`. Task 1 removes the existing override (~30-line cleanup leaves a working calculator with simpler math). Task 2 adds the Beginner/Advanced toggle, 5 new Advanced inputs, and the TDD-refinement multiplier chain. Task 3 adds the educational content (Reality-check note + Dawn-vs-FOTF card). Each task produces a working, committed state.

**Tech Stack:** React 19 + Vite + TailwindCSS + react-router-dom 7. No tests required (per spec §9.1 — math changes are linear multiplier chains, the calculator has no existing test file).

**Spec source-of-truth:** `docs/superpowers/specs/2026-05-13-magic-ratio-calc-personalization-design.md`

---

## File Structure

```
src/features/calculators/
└── InsulinCalculator.jsx                # MODIFIED (all 3 tasks)
                                         #   Task 1: remove override (5 useStates, branching logic, JSX block)
                                         #   Task 2: add mode toggle + 6 Advanced useStates + 5 module constants
                                         #           + extend calcTDD math chain + new JSX blocks
                                         #   Task 3: replace InfoBox + add educational card + reality-check note
```

No new files. No new tests. No URL changes. No changes outside `InsulinCalculator.jsx`.

---

## Task 1: Remove existing I:C / ISF override feature

Spec reference: §2 (Non-goals: "NO I:C or ISF override fields"), plus aligning with the user's stated philosophy that "if somebody comes to use the advanced option and they already know their ratios, there really is no point for them to use this calculator."

**Files:**
- Modify: `src/features/calculators/InsulinCalculator.jsx`

The existing code has a `useCustomRatios` checkbox plus 4 custom input fields that let users override the calculated ISF and I:C ratios. This task removes them. After this task, the calculator unconditionally shows the system-calculated ratios from TDD; there's no override path.

- [ ] **Step 1: Remove the 5 override-related useState hooks**

In `src/features/calculators/InsulinCalculator.jsx`, find this block (around lines 131–136):

```js
  // Custom override toggle
  const [useCustomRatios, setUseCustomRatios] = useState(false)
  const [customISF, setCustomISF]             = useState('')
  const [customMorningICR, setCustomMorningICR]     = useState('')
  const [customAfternoonICR, setCustomAfternoonICR] = useState('')
  const [customEveningICR, setCustomEveningICR]     = useState('')
```

Delete it entirely (the comment line AND all 5 useState lines).

- [ ] **Step 2: Simplify `activeISF` and `activeICR` to always use system-calculated values**

Find this code (around lines 165–177):

```js
  // ISF actually used (system or user override)
  const activeISF = useCustomRatios
    ? parseFloat(customISF) || 0
    : systemISF

  // ICR for selected time of day
  const activeICR = useMemo(() => {
    if (useCustomRatios) {
      const map = { morning: customMorningICR, afternoon: customAfternoonICR, evening: customEveningICR }
      return parseFloat(map[timeOfDay]) || 0
    }
    return systemICRs[timeOfDay]
  }, [useCustomRatios, timeOfDay, customMorningICR, customAfternoonICR, customEveningICR, systemICRs])
```

Replace the entire block with:

```js
  // ISF actually used in meal-dose math
  const activeISF = systemISF

  // ICR for selected time of day
  const activeICR = useMemo(
    () => systemICRs[timeOfDay],
    [timeOfDay, systemICRs]
  )
```

- [ ] **Step 3: Update `reset()` to remove old override-state setters**

Find the existing `reset()` function (around lines 201–206):

```js
  const reset = () => {
    setInsulinType('rapid'); setBgUnit('mg/dL'); setWeight(''); setWeightUnits('kg')
    setUseCustomRatios(false); setCustomISF(''); setCustomMorningICR('')
    setCustomAfternoonICR(''); setCustomEveningICR('')
    setCarbGrams(''); setTimeOfDay('morning'); setCurrentBG('')
  }
```

Replace with (removes the override-clearing line):

```js
  const reset = () => {
    setInsulinType('rapid'); setBgUnit('mg/dL'); setWeight(''); setWeightUnits('kg')
    setCarbGrams(''); setTimeOfDay('morning'); setCurrentBG('')
  }
```

- [ ] **Step 4: Remove the override toggle checkbox JSX**

Find this JSX block (around lines 360–376):

```jsx
            {/* Custom toggle */}
            <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-600/20 to-da-cyan/20 border border-purple-500/30 rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomRatios}
                onChange={(e) => setUseCustomRatios(e.target.checked)}
                className="mt-0.5 accent-da-cyan w-5 h-5"
              />
              <div>
                <div className="text-white font-bold text-sm">
                  Use my own ISF and I:C ratios instead
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Already know your numbers from your endocrinologist? Override below.
                </div>
              </div>
            </label>
```

Delete this entire block (the `{/* Custom toggle */}` comment plus the `<label>...</label>` element).

- [ ] **Step 5: Unwrap the ternary that branches between system-calculated and custom-input displays**

Find this ternary structure (around lines 378–470). The outer shape is:

```jsx
            {!useCustomRatios ? (
              <>
                {/* System-calculated ratios — KEEP this entire branch */}
                <ResultBox ... />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  ... 3 ICR boxes ...
                </div>
                <InfoBox>
                  These are starting-point estimates. If your body is more insulin-resistant...
                </InfoBox>
              </>
            ) : (
              <>
                {/* Custom inputs — DELETE this entire branch */}
                <div className="space-y-3">
                  ... 4 custom input fields ...
                </div>
              </>
            )}
```

Replace the entire ternary with just the content of the first (system-calculated) branch — drop the `{!useCustomRatios ? (` opener, drop the `<>` fragment tags, drop the `: ( ... )}` else clause. The result should be the system-calculated `<ResultBox>` + `<div className="grid...">` + `<InfoBox>` rendered unconditionally.

After this step, the surrounding JSX should look like:

```jsx
            {/* Show system-calculated ratios */}
            <ResultBox
              label="Insulin Sensitivity Factor (ISF)"
              value={fmt(systemISF)}
              suffix={bgUnit}
              subtitle="One unit of insulin lowers BG by this amount"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Morning ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.morning)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Afternoon ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.afternoon)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
              <div className="bg-da-darker rounded-lg p-4 text-center border border-white/15">
                <div className="text-da-cyan text-xs uppercase tracking-wider font-bold mb-1">
                  Evening ICR
                </div>
                <div className="text-2xl font-black text-white">{fmtIcr(systemICRs.evening)}</div>
                <div className="text-white/40 text-[10px] mt-1">grams carb / 1 unit</div>
              </div>
            </div>

            <InfoBox>
              These are starting-point estimates. If your body is more insulin-resistant, you may need a higher dose. If you're more sensitive, you may need less. Always log your numbers and adjust with your healthcare team.
            </InfoBox>
```

(Task 3 will replace this `InfoBox` with the new Reality-check note and add the Dawn-vs-FOTF card. Leave it intact for now.)

- [ ] **Step 6: Update the source-of-ISF subtitle text**

Find this text (around line 569) somewhere in the meal-dose results JSX:

```jsx
{useCustomRatios ? 'From your custom ISF above.' : 'Auto-calculated from your TDD and insulin type.'}
```

Replace with just:

```jsx
Auto-calculated from your TDD and insulin type.
```

(Drop the ternary; always show the auto-calculated message since there's no override anymore.)

- [ ] **Step 7: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors. No references to `useCustomRatios`, `customISF`, `customMorningICR`, `customAfternoonICR`, `customEveningICR`, `activeISF` (old branching), or any of the removed identifiers should remain. The calculator should still function — it just unconditionally shows system-calculated ratios now.

- [ ] **Step 8: Sanity verify in browser** *(optional but recommended)*

Open http://localhost:3000/calculators/magic-ratio (or `/calculators/insulin`). Enter weight + insulin type + BG unit + current BG + carb grams + time of day. Confirm:
- The "Use my own ISF and I:C ratios instead" checkbox is GONE
- The calculator shows ISF + 3 ICRs based purely on TDD
- Meal dose calculation works as expected
- No JavaScript errors in the browser console

- [ ] **Step 9: Commit**

```bash
git add src/features/calculators/InsulinCalculator.jsx
git commit -m "refactor(magic-ratio): remove I:C/ISF override feature

The override path contradicted the calculator's purpose. A user who
already knows their ratios doesn't need a ratio-discovery calculator.
Removed the useCustomRatios toggle, 4 custom-input fields, branching
logic in activeISF/activeICR, and the corresponding JSX.

Calculator now unconditionally outputs system-calculated ratios from
the TDD-based math. Aligns with the calc-personalization spec §2
non-goals.

Prepares the file for Tasks 2 + 3 (Beginner/Advanced toggle and
educational additions)."
```

---

## Task 2: Add Beginner/Advanced toggle + Advanced inputs + TDD-refinement math

Spec reference: §3 (Two-Tier Structure), §4 (The 4 New Advanced Inputs), §5 (Math Integration), §7 (UI Specifications).

**Files:**
- Modify: `src/features/calculators/InsulinCalculator.jsx`

This task adds:
1. Five new module-level constants (multiplier tables + selector definitions)
2. Seven new useState hooks (mode + 6 Advanced inputs)
3. An extended `calcTDD` function that accepts and applies the TDD-refinement chain
4. A wired-up `tdd` useMemo that passes the new params
5. Updates to `reset()` that clear the new state
6. New JSX: the Mode toggle, plus the Advanced inputs section (conditionally rendered)

After this task, Beginner mode produces identical output to Task 1's behavior (TDD = weight × 0.55, default multipliers all = 1.00). Advanced mode lets the user fill in refinements that progressively shift the calculated ratios.

- [ ] **Step 1: Add 5 new module-level constants**

In `src/features/calculators/InsulinCalculator.jsx`, find the existing module-level constants block at the top (currently has `ISF_NUMERATORS`, `TARGET_BG`, `TIME_OF_DAY`). Append these new constants immediately AFTER `TIME_OF_DAY` and BEFORE the math helpers section (the `MATH HELPERS` comment / `calcTDD` function):

```js
// ───────────── PERSONALIZATION MULTIPLIERS ─────────────
// Coefficients drawn from Riddell 2017, Yardley 2018, ADA exercise
// guidelines, and Brown et al. (menstrual cycle). Conservative midpoints
// within published ranges; subject to feedback-based refinement.

const TRAINING_TDD_MULT = {
  untrained:     1.10,  // higher insulin resistance, slightly more daily insulin
  recreational:  1.00,  // baseline matches weight × 0.55 estimate
  trained:       0.90,  // ~10% reduction from training adaptations
  highlyTrained: 0.80,  // ~20% reduction at elite levels
}

const SEX_TDD_MULT = {
  male:   1.00,
  female: 0.95,  // women ~5% more insulin sensitive at baseline (cycle adds further variation)
}

const CYCLE_TDD_MULT = {
  follicular: 0.90,  // most sensitive (low estrogen + progesterone)
  midCycle:   0.95,  // intermediate
  luteal:     1.05,  // least sensitive (high progesterone) — near male baseline
  unknown:    0.95,  // safe midpoint default
}

const TRAINING_STATUSES = [
  { id: 'untrained',     label: 'Untrained',      detail: 'Little or no regular exercise' },
  { id: 'recreational',  label: 'Recreational',   detail: '2–3 days/week, casual' },
  { id: 'trained',       label: 'Trained',        detail: '4–5 days/week, structured plan' },
  { id: 'highlyTrained', label: 'Highly Trained', detail: '6–7 days/week, competitive' },
]

const CYCLE_PHASES = [
  { id: 'follicular', label: 'Follicular Phase', detail: 'Early cycle, post-period' },
  { id: 'midCycle',   label: 'Mid-cycle',        detail: '~Ovulation' },
  { id: 'luteal',     label: 'Luteal Phase',     detail: 'Late cycle, pre-period' },
  { id: 'unknown',    label: "Don't know / N/A", detail: 'Default — works for most' },
]
```

- [ ] **Step 2: Extend the `calcTDD` function with the refinement chain**

Find the existing `calcTDD` function (around line 34):

```js
function calcTDD({ weight, weightUnits }) {
  if (!weight || weight <= 0) return 0
  return weightUnits === 'kg' ? weight * 0.55 : weight / 4
}
```

Replace the entire function with the extended version:

```js
function calcTDD({
  weight,
  weightUnits,
  // NEW personalization inputs — all optional. When omitted, the function
  // returns the same weight-based estimate as before (backward compatibility).
  actualTdd,
  bodyFatPercent,
  trainingStatus,
  sex,
  cyclePhase,
}) {
  if (!weight || weight <= 0) return 0

  // Step 1 — determine base TDD
  let tdd
  if (actualTdd && actualTdd > 0) {
    tdd = actualTdd
  } else if (bodyFatPercent && bodyFatPercent > 0 && bodyFatPercent < 60) {
    const lbm = weight * (1 - bodyFatPercent / 100)
    tdd = weightUnits === 'kg' ? lbm * 0.7 : (lbm / 2.2) * 0.7
  } else {
    tdd = weightUnits === 'kg' ? weight * 0.55 : weight / 4
  }

  // Step 2 — apply training status multiplier
  tdd *= TRAINING_TDD_MULT[trainingStatus] ?? 1.00

  // Step 3 — apply sex × cycle multiplier
  const sexMult   = SEX_TDD_MULT[sex] ?? 1.00
  const cycleMult = sex === 'female' ? (CYCLE_TDD_MULT[cyclePhase] ?? 0.95) : 1.00
  tdd *= sexMult * cycleMult

  return tdd
}
```

- [ ] **Step 3: Add 7 new useState hooks**

Find the existing useState block in the component body (it starts around line 126 with `insulinType` state, etc.). Locate the LAST useState declaration of the existing inputs — currently `showFormulaTable` around line 146. Immediately AFTER that useState declaration, add these 7 new hooks:

```js
  // Mode toggle — Beginner (default) shows existing inputs only;
  // Advanced reveals the personalization inputs that refine the TDD calc.
  const [mode, setMode] = useState('beginner')

  // Personalization inputs (only visible when mode === 'advanced')
  const [actualTdd,         setActualTdd]         = useState('')
  const [bodyFatPercent,    setBodyFatPercent]    = useState('')
  const [trainingStatus,    setTrainingStatus]    = useState('recreational')
  const [sex,               setSex]               = useState('male')
  const [cyclePhase,        setCyclePhase]        = useState('unknown')
  const [cycleExpanded,     setCycleExpanded]     = useState(false)
```

- [ ] **Step 4: Update the `tdd` useMemo to pass the new inputs**

Find the existing `tdd` useMemo (around lines 149–152):

```js
  const tdd = useMemo(() => {
    const w = parseFloat(weight)
    return calcTDD({ weight: w, weightUnits })
  }, [weight, weightUnits])
```

Replace with:

```js
  const tdd = useMemo(() => {
    const w = parseFloat(weight)
    return calcTDD({
      weight: w,
      weightUnits,
      actualTdd:      parseFloat(actualTdd) || 0,
      bodyFatPercent: parseFloat(bodyFatPercent) || 0,
      trainingStatus,
      sex,
      cyclePhase,
    })
  }, [weight, weightUnits, actualTdd, bodyFatPercent, trainingStatus, sex, cyclePhase])
```

- [ ] **Step 5: Update `reset()` to clear new state**

Find the existing `reset()` function (which Task 1 simplified to):

```js
  const reset = () => {
    setInsulinType('rapid'); setBgUnit('mg/dL'); setWeight(''); setWeightUnits('kg')
    setCarbGrams(''); setTimeOfDay('morning'); setCurrentBG('')
  }
```

Replace with:

```js
  const reset = () => {
    setInsulinType('rapid'); setBgUnit('mg/dL'); setWeight(''); setWeightUnits('kg')
    setCarbGrams(''); setTimeOfDay('morning'); setCurrentBG('')
    // Personalization defaults
    setMode('beginner')
    setActualTdd(''); setBodyFatPercent(''); setTrainingStatus('recreational')
    setSex('male'); setCyclePhase('unknown'); setCycleExpanded(false)
  }
```

- [ ] **Step 6: Add the Mode toggle JSX**

Locate the JSX inside the main form. Find where the lead-capture inputs end (firstName + email + age — actually, this is the Magic Ratio calc, not the TDEE calc, so check if there are lead-capture fields here first. Look for `setInsulinType` rendering — that's the first "Step 1" input.).

The Mode toggle should go BEFORE the first input "step card." Find the first `<StepCard stepNumber={1}` and add a new JSX block BEFORE it that contains the Mode toggle:

```jsx
          {/* Mode toggle — Beginner / Advanced */}
          <div className="mb-6">
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

- [ ] **Step 7: Add the Advanced Inputs section JSX**

Insert this new block IMMEDIATELY AFTER the existing "Step 1" StepCard (the ratios card) and BEFORE the "Step 2" StepCard (Carb Coverage). It's a single conditional section that renders only when `mode === 'advanced'`:

```jsx
          {/* Advanced Inputs — conditional on mode === 'advanced' */}
          {mode === 'advanced' && (
            <StepCard stepNumber="A" title="Advanced Inputs (optional)">
              <p className="text-white/60 text-sm mb-4">
                The more we know about you, the more accurate your calculated ratios. All fields below are optional — fill in what you know.
              </p>

              {/* Actual TDD */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Actual Total Daily Dose (units, optional)
                </label>
                <input
                  type="number" step="0.5" min="0" max="200"
                  value={actualTdd}
                  onChange={(e) => setActualTdd(e.target.value)}
                  placeholder="e.g. 32"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <p className="text-white/40 text-xs mt-1 italic">
                  Your average daily insulin (basal + bolus combined). If you don't know this, leave it blank — we'll estimate from your weight.
                </p>
              </div>

              {/* Body Fat % */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Body Fat % (optional)
                </label>
                <input
                  type="number" step="0.5" min="0" max="60"
                  value={bodyFatPercent}
                  onChange={(e) => setBodyFatPercent(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <p className="text-white/40 text-xs mt-1 italic">
                  For a more accurate TDD estimate if you know your body fat %. Skip if you provided actual TDD above.
                </p>
              </div>

              {/* Training Status */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Training Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TRAINING_STATUSES.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTrainingStatus(t.id)}
                      className={`p-3 rounded-lg text-left ${trainingStatus === t.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-darker border border-white/15'}`}>
                      <div className={`font-bold text-sm ${trainingStatus === t.id ? 'text-da-cyan' : 'text-white'}`}>{t.label}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{t.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sex (+ optional Cycle expander) */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['male', 'Male'], ['female', 'Female']].map(([id, lbl]) => (
                    <button key={id} type="button" onClick={() => setSex(id)}
                      className={`py-3 rounded-lg ${sex === id ? 'bg-da-cyan text-da-dark font-bold' : 'bg-da-darker border border-white/15 text-white/60'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Cycle expander — only when Female */}
                {sex === 'female' && (
                  <>
                    <button type="button" onClick={() => setCycleExpanded(!cycleExpanded)}
                      className="text-da-cyan text-xs uppercase tracking-wider mt-2 font-bold">
                      {cycleExpanded ? '− Hide menstrual cycle refinement' : '+ Refine for menstrual cycle phase (optional)'}
                    </button>
                    {cycleExpanded && (
                      <div className="mt-3 p-4 bg-da-darker rounded-lg">
                        <p className="text-xs text-white/50 mb-3">
                          Cycle phase affects insulin sensitivity. Adjusts the calculation by ~5–15%. If you're not menstruating, on hormonal contraception, or don't track your cycle, leave this as "Don't know / N/A" — the default works for most users.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CYCLE_PHASES.map((p) => (
                            <button key={p.id} type="button" onClick={() => setCyclePhase(p.id)}
                              className={`p-3 rounded-lg text-left ${cyclePhase === p.id ? 'bg-da-cyan/20 border border-da-cyan' : 'bg-da-dark border border-white/15'}`}>
                              <div className={`font-bold text-sm ${cyclePhase === p.id ? 'text-da-cyan' : 'text-white'}`}>{p.label}</div>
                              <div className="text-[10px] text-white/40 mt-0.5">{p.detail}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </StepCard>
          )}
```

- [ ] **Step 8: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 9: Manual verify in browser** *(optional but recommended)*

Open the calculator. Verify:
- The Mode toggle appears at the top, with Beginner selected by default
- Switching to Advanced reveals the new "Advanced Inputs (optional)" StepCard
- All 4 input groups visible in Advanced mode (Actual TDD, BF%, Training Status, Sex)
- Selecting Female reveals the cycle expander; expander toggles work
- Fill in some Advanced values and confirm the calculated ISF/I:C ratios update live
- Reset button clears all 7 new state vars back to defaults

- [ ] **Step 10: Commit**

```bash
git add src/features/calculators/InsulinCalculator.jsx
git commit -m "feat(magic-ratio): add Beginner/Advanced toggle + TDD-refinement chain

Beginner mode is the existing flow, unchanged. Advanced mode adds 4
optional input groups (Actual TDD, Body Fat %, Training Status, Sex
with optional cycle phase) that feed into a new TDD-refinement chain:

  Step 1: Determine base TDD (actualTdd > LBM-based > weight × 0.55)
  Step 2: Apply training status multiplier
  Step 3: Apply sex × cycle multiplier
  Step 4: Existing ISF / I:C formulas use the refined TDD

When all Advanced inputs are at defaults (Recreational, Male, etc.),
multipliers all evaluate to 1.00 and output matches Beginner mode
exactly.

Coefficient tables are literature-anchored starting values from
Riddell 2017, Yardley 2018, ADA exercise guidelines, and Brown et al.
on menstrual cycle phase effects.

Implements personalization spec §3–§5."
```

---

## Task 3: Educational additions (Reality-check note + Dawn-vs-FOTF card)

Spec reference: §7.3 (Educational card), §7.4 (Reality-check note).

**Files:**
- Modify: `src/features/calculators/InsulinCalculator.jsx`

This task replaces the existing generic InfoBox (currently inside Step 1) with the new Reality-check note placed after the meal-dose results, and adds the always-visible Dawn-vs-Foot-to-Floor educational explainer card. Both pieces of content are user-facing and always rendered regardless of mode.

- [ ] **Step 1: Remove the existing InfoBox inside Step 1**

Find this InfoBox (currently inside the ratios card, after the 3-ICR grid):

```jsx
            <InfoBox>
              These are starting-point estimates. If your body is more insulin-resistant, you may need a higher dose. If you're more sensitive, you may need less. Always log your numbers and adjust with your healthcare team.
            </InfoBox>
```

Delete this entire InfoBox block. The Reality-check note (Step 2 below) replaces its message with cleaner copy in a more prominent location.

- [ ] **Step 2: Add the Reality-check note after the total-dose result**

Find the meal-dose total / "Total Dose" display in the JSX. This is the FINAL result section of the calculator, after carb dose and correction dose are added together. Look for `totalDose` rendered in a result box.

Insert this new Reality-check note IMMEDIATELY AFTER the total-dose StepCard's closing tag (after the entire `</StepCard>` that wraps the "Total Dose" or similar final section), and BEFORE any disclaimer/footer content:

```jsx
          {/* Reality-check note — frames the calculator output as starting points */}
          <p className="text-xs text-white/50 italic text-center mt-6">
            These are your calibrated starting points. Track your real-world response over 1–2 weeks and you'll lock in the version that's truly yours.
          </p>
```

- [ ] **Step 3: Add the Dawn-vs-Foot-to-Floor educational card**

Insert this new educational card IMMEDIATELY AFTER the Reality-check note from Step 2:

```jsx
          {/* Dawn vs Foot-to-Floor educational card */}
          <section className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan mt-6">
            <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">🌅 Why your morning numbers might still need adjusting</p>
            <div className="text-white/70 space-y-3 text-sm leading-relaxed">
              <p>
                <strong className="text-white">Dawn Phenomenon</strong> is a slow glucose rise that happens <em>while you're still asleep</em> (typically 2–4 AM), driven by overnight hormones. If your glucose is <em>already</em> elevated when you check on waking, that's a sign of dawn phenomenon — usually addressed by overnight basal adjustments or bedtime tweaks, not by this calculator.
              </p>
              <p>
                <strong className="text-white">Foot-to-Floor</strong> is the sharp glucose spike that happens <em>after you get out of bed</em>, driven by the cortisol and adrenaline of waking up. Your glucose is fine on waking, then rises 15–60 minutes later. Many T1Ds preempt this with a small fixed bolus on waking.
              </p>
              <p>
                These two get conflated constantly. If you suspect one of them is affecting your mornings, track your numbers around waking for a week and look at the pattern — getting the diagnosis right is the first step toward dosing with confidence.
              </p>
            </div>
          </section>
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 5: Manual verify in browser** *(recommended)*

Open the calculator. Confirm:
- The old InfoBox ("These are starting-point estimates...") inside Step 1 is GONE
- After the total-dose result, the new italic Reality-check note ("These are your calibrated starting points...") appears
- Below the Reality-check note, the Dawn-vs-FOTF educational card appears with cyan left border, the orange-sun emoji header, and three explanatory paragraphs
- Both new pieces are visible in BOTH Beginner mode AND Advanced mode (toggle the mode to confirm)

- [ ] **Step 6: Commit**

```bash
git add src/features/calculators/InsulinCalculator.jsx
git commit -m "feat(magic-ratio): add Reality-check note + Dawn-vs-FOTF educational card

The Reality-check note frames the calculator output as 'calibrated
starting points' to be refined through 1-2 weeks of real-world
tracking. Placed after the total-dose result, replaces the previous
generic InfoBox inside Step 1 with cleaner copy in a more prominent
location.

The Dawn-vs-FOTF card educates users on the distinction between two
commonly-conflated morning phenomena:
  • Dawn Phenomenon — overnight rise (handled by basal adjustments,
    not this calculator)
  • Foot-to-Floor — post-waking cortisol spike (preempted by a small
    fixed bolus on waking)

Always visible in both Beginner and Advanced modes. No funnel CTA —
the email opt-in handles funnel work; this card is pure education.

Implements personalization spec §7.3–§7.4."
```

---

# Wrap-up

After all 3 tasks complete, do a final visual QA pass in the browser:

1. Navigate to http://localhost:3000/calculators/magic-ratio (or `/calculators/insulin`)
2. **Beginner-mode default behavior**:
   - Mode toggle visible at top, Beginner selected
   - Existing inputs work as before (weight, insulin type, BG unit, current BG, carbs, time of day)
   - ISF and 3 I:C ratios show calculated values based on TDD = weight × 0.55
   - Total dose calculation works
3. **Advanced-mode unlocks refinement**:
   - Click Advanced
   - "Advanced Inputs (optional)" StepCard appears with 4 input groups
   - Enter Actual TDD = 30 → confirm ISF and I:C ratios change (TDD source switched)
   - Clear Actual TDD, enter BF% = 25 → confirm ratios change again (LBM-based TDD)
   - Switch Training Status to Highly Trained → ratios become more sensitive (higher ISF, looser I:C)
   - Switch Sex to Female → ratios shift slightly more sensitive
   - Expand cycle phase, pick Follicular → most sensitive ratios
4. **Both modes show the same educational content**:
   - Reality-check italic note below total dose
   - Dawn-vs-FOTF educational card with cyan left border below the note
   - Toggle mode back to Beginner → both pieces still visible
5. **Reset button**:
   - Click Reset → mode returns to Beginner, all Advanced inputs cleared to defaults
6. **Old override is GONE**:
   - No "Use my own ISF and I:C ratios instead" checkbox anywhere
   - No custom-ISF / custom-ICR input fields anywhere
   - Final test: search the page DOM for "Use my own" — should return 0 matches

If all 6 checks pass, the personalization rollout is complete.

---

*End of plan.*
