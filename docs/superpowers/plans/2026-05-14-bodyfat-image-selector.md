# Body Fat Image Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the protein calculator's inline body-fat-% slider-plus-reference-image pattern into a reusable `BodyFatSelector` component, host its images locally (replacing the MyClickFunnels CDN), and integrate the component into the Magic Ratio Calculator's Advanced inputs.

**Architecture:** Two sequential tasks. Task 1 introduces the reusable component, drops in the two locally-hosted WebP images the user has already provided, and migrates the existing protein calculator off its inline pattern + remote URLs. Task 2 adds the same component to the Magic Ratio Calculator's Advanced section, reordering the Sex toggle above the Body Fat % input so the reference image already shows the right sex when the user looks at it.

**Tech Stack:** React 19 + Vite + TailwindCSS. No new dependencies. WebP images served from `public/`.

**User-provided source assets:**
- `/Users/nicholascaracandas/Desktop/CLAUDE FILES/Diabetic Athletic Home page/male fat percentage.webp` (~522 KB)
- `/Users/nicholascaracandas/Desktop/CLAUDE FILES/Diabetic Athletic Home page/female fat percentage .webp` (~460 KB — note the trailing space before the extension in the source filename)

---

## File Structure

```
public/
└── images/
    └── bodyfat/
        ├── male.webp                       # CREATE (moved + renamed from source)
        └── female.webp                     # CREATE (moved + renamed from source)

src/
├── components/
│   └── BodyFatSelector.jsx                 # CREATE (reusable slider + image selector)
└── features/
    └── calculators/
        ├── ProteinCalculator.jsx           # MODIFY (swap inline slider for component, drop CDN URLs)
        └── InsulinCalculator.jsx           # MODIFY (replace BF% number input, reorder Sex above BF%)
```

No new tests. The component is presentational (no math, no state of its own). Manual browser verification is sufficient.

---

## Task 1: Add reusable BodyFatSelector + migrate protein calculator

**Files:**
- Create: `public/images/bodyfat/male.webp` (copy)
- Create: `public/images/bodyfat/female.webp` (copy + rename to drop trailing space)
- Create: `src/components/BodyFatSelector.jsx`
- Modify: `src/features/calculators/ProteinCalculator.jsx`

This task introduces the component and migrates the protein calculator off the inline pattern. After Task 1, the protein calc still looks and behaves identically from the user's perspective but is now sourced from the new component + local images.

- [ ] **Step 1: Copy the male body fat image into the public folder**

Run from worktree root (`/Users/nicholascaracandas/Desktop/CLAUDE FILES/Diabetic Athletic Home page/.worktrees/phase-1`):

```bash
mkdir -p public/images/bodyfat
cp "/Users/nicholascaracandas/Desktop/CLAUDE FILES/Diabetic Athletic Home page/male fat percentage.webp" public/images/bodyfat/male.webp
```

Expected: `public/images/bodyfat/male.webp` exists, ~522 KB.

- [ ] **Step 2: Copy the female body fat image into the public folder**

Run (note the trailing space in the source filename — the destination name is the cleaned-up `female.webp`):

```bash
cp "/Users/nicholascaracandas/Desktop/CLAUDE FILES/Diabetic Athletic Home page/female fat percentage .webp" public/images/bodyfat/female.webp
```

Expected: `public/images/bodyfat/female.webp` exists, ~460 KB.

- [ ] **Step 3: Verify both images are in place**

Run: `ls -lh public/images/bodyfat/`
Expected output should show two .webp files (`male.webp`, `female.webp`).

- [ ] **Step 4: Create the BodyFatSelector component**

Create `src/components/BodyFatSelector.jsx` with this content:

```jsx
// Reusable body-fat-percentage selector — a slider plus a reference image
// that swaps based on the caller's sex prop. Used by ProteinCalculator and
// InsulinCalculator (Magic Ratio).
const BODY_FAT_IMAGES = {
  male:   '/images/bodyfat/male.webp',
  female: '/images/bodyfat/female.webp',
}

export default function BodyFatSelector({ sex, value, onChange, label = 'Body Fat Percentage' }) {
  const min = 5
  const max = 60
  const safeSex = sex === 'female' ? 'female' : 'male'

  return (
    <div>
      <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-1">
        {label}
      </label>
      <p className="text-white/50 text-xs mb-4">
        Use the picture below to help estimate.
      </p>

      {/* Slider with floating value badge */}
      <div className="relative pt-8 pb-2">
        <div
          className="absolute -top-1 transform -translate-x-1/2 px-3 py-1 rounded-md bg-da-gradient text-da-dark text-xs font-black"
          style={{ left: `${((value - min) / (max - min)) * 100}%` }}
        >
          {value}%
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full accent-da-cyan h-2"
        />
        <div className="flex justify-between text-xs text-white/40 mt-2">
          <span>{min}%</span>
          <span>{max}%</span>
        </div>
      </div>

      {/* Reference image */}
      <div className="mt-6 bg-da-darker rounded-lg p-4 border border-white/5 flex items-center justify-center">
        <img
          src={BODY_FAT_IMAGES[safeSex]}
          alt={`${safeSex} body fat percentage reference chart`}
          className="max-w-full h-auto rounded"
          style={{ maxHeight: '320px' }}
        />
      </div>
    </div>
  )
}
```

**Interface contract:**
- `sex`: `'male' | 'female'` — controls which reference image renders. Falls back to `'male'` for any other value.
- `value`: integer between 5 and 60.
- `onChange`: function called with the new integer when the slider moves.
- `label`: optional override (defaults to "Body Fat Percentage").

The component is **presentational**. It does not own the value — the parent does. This matches how `ProteinCalculator` and `InsulinCalculator` already structure their state.

- [ ] **Step 5: Update ProteinCalculator imports**

Open `src/features/calculators/ProteinCalculator.jsx`. At the top of the file, after the existing React import line, add a new import for the BodyFatSelector. Find the imports block (around line 1):

```jsx
import React, { useState, useMemo } from 'react'
```

Add a new line immediately after:

```jsx
import BodyFatSelector from '../../components/BodyFatSelector'
```

- [ ] **Step 6: Remove the obsolete BODY_FAT_IMAGES constant from ProteinCalculator**

Still in `src/features/calculators/ProteinCalculator.jsx`, find this block (currently around lines 26–31):

```jsx
// Original Diabetic Athletic body-fat reference images (hosted on the
// MyClickFunnels CDN — same URLs used in the GHL widget).
const BODY_FAT_IMAGES = {
  male:   'https://statics.myclickfunnels.com/workspace/JELxgK/image/3795379/file/174198207fb42981ce293b7d0c1eb1fb.png',
  female: 'https://statics.myclickfunnels.com/workspace/JELxgK/image/3795382/file/9234b73ede43e6798d40f03e0caa533c.png',
}
```

Delete it entirely (the comment lines AND the const block). The component now owns the image URLs.

- [ ] **Step 7: Replace the inline body-fat slider JSX with `<BodyFatSelector />`**

Still in `src/features/calculators/ProteinCalculator.jsx`, find the inline body-fat slider JSX (currently around lines 462–503):

```jsx
          {/* ============== Body Fat % Slider ============== */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-1">
              Body Fat Percentage
            </label>
            <p className="text-white/50 text-xs mb-4">
              Use the picture below to help estimate.
            </p>

            {/* Slider */}
            <div className="relative pt-8 pb-2">
              <div
                className="absolute -top-1 transform -translate-x-1/2 px-3 py-1 rounded-md bg-da-gradient text-da-dark text-xs font-black"
                style={{ left: `${((bodyFat - 5) / (60 - 5)) * 100}%` }}
              >
                {bodyFat}%
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={bodyFat}
                onChange={(e) => setBodyFat(parseInt(e.target.value))}
                className="w-full accent-da-cyan h-2"
              />
              <div className="flex justify-between text-xs text-white/40 mt-2">
                <span>5%</span>
                <span>60%</span>
              </div>
            </div>

            {/* Reference image */}
            <div className="mt-6 bg-da-darker rounded-lg p-4 border border-white/5 flex items-center justify-center">
              <img
                src={BODY_FAT_IMAGES[gender]}
                alt={`${gender} body fat percentage reference chart`}
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '320px' }}
              />
            </div>
          </div>
```

Replace that entire block with:

```jsx
          {/* ============== Body Fat % Selector ============== */}
          <BodyFatSelector
            sex={gender}
            value={bodyFat}
            onChange={setBodyFat}
          />
```

(The component renders the same UX. Only the call site changes.)

- [ ] **Step 8: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds with no errors, no warnings. If TypeScript complains about a missing module, double-check the import path matches the new file location.

- [ ] **Step 9: Manual browser verify (recommended)**

Run `npm run dev` and open the protein calculator page. Confirm:
- The Body Fat Percentage section renders identically to before
- The reference image swaps when the user toggles Male/Female
- The slider works (drag, click, keyboard arrows)
- The value badge above the slider shows the current % and tracks position
- The image loads (no broken-image icon — Network tab should show 200 OK for `/images/bodyfat/male.webp` or `/images/bodyfat/female.webp`)

- [ ] **Step 10: Commit**

```bash
git add public/images/bodyfat/male.webp public/images/bodyfat/female.webp src/components/BodyFatSelector.jsx src/features/calculators/ProteinCalculator.jsx
git commit -m "refactor(calculators): extract BodyFatSelector + host images locally

Lifted the body-fat % slider + reference-image pattern out of
ProteinCalculator into a reusable presentational component in
src/components/BodyFatSelector.jsx. The component takes sex, value,
and onChange props — caller owns the state. Same UX as before.

Moved the male/female reference images from the MyClickFunnels CDN
into public/images/bodyfat/. Locally-hosted assets remove the
dependency on the old GoHighLevel workspace and let the calculator
load faster on first visit.

Prepares the component for reuse in InsulinCalculator (Magic Ratio)."
```

---

## Task 2: Integrate BodyFatSelector into Magic Ratio Calculator

**Files:**
- Modify: `src/features/calculators/InsulinCalculator.jsx`

This task replaces the existing Body Fat % `<input type="number">` in the Magic Ratio Calculator's Advanced section with the new `BodyFatSelector` component, and reorders the Advanced inputs so the Sex toggle sits above Body Fat % (so the reference image already shows the right sex when the user looks at it).

**Note on state type:** the existing `bodyFatPercent` state in `InsulinCalculator.jsx` is a string (`useState('')`), and `calcTDD` parses it with `parseFloat() || 0`. The new `BodyFatSelector` calls `onChange` with an integer. The simplest migration is to:
- Keep the state name `bodyFatPercent` but change its initial value to a sensible numeric default (`20`) so the slider has somewhere to start
- Update the `calcTDD` call site so it passes the number directly (no `parseFloat`)
- Update `reset()` to reset back to `20`

This is a minor state-shape change. There is no persistence layer, so no migration needed.

- [ ] **Step 1: Add BodyFatSelector import**

Open `src/features/calculators/InsulinCalculator.jsx`. Find the imports block at the top. Add a new line:

```jsx
import BodyFatSelector from '../../components/BodyFatSelector'
```

(Match the existing import style — single line, no surrounding blank lines.)

- [ ] **Step 2: Change `bodyFatPercent` initial value from `''` to `20`**

Find this useState declaration (currently around line 217):

```jsx
  const [bodyFatPercent,    setBodyFatPercent]    = useState('')
```

Replace with:

```jsx
  const [bodyFatPercent,    setBodyFatPercent]    = useState(20)
```

(Default of 20% lands the slider in a neutral spot — neither very lean nor high body fat.)

- [ ] **Step 3: Update the `tdd` useMemo to pass `bodyFatPercent` as a number, not via parseFloat**

Find this line inside the `tdd` useMemo (around line 231):

```jsx
      bodyFatPercent: isAdvanced ? parseFloat(bodyFatPercent) || 0 : 0,
```

Replace with:

```jsx
      bodyFatPercent: isAdvanced ? bodyFatPercent : 0,
```

(The slider always provides a valid integer between 5 and 60, so no `parseFloat` or `|| 0` fallback is needed.)

- [ ] **Step 4: Update `reset()` so Body Fat % returns to 20 on reset**

Find this line inside the `reset()` function (currently around line 285):

```jsx
    setActualTdd(''); setBodyFatPercent(''); setTrainingStatus('recreational')
```

Replace with:

```jsx
    setActualTdd(''); setBodyFatPercent(20); setTrainingStatus('recreational')
```

- [ ] **Step 5: Reorder the Advanced inputs JSX — Sex block moves above the Body Fat % block**

Find the Advanced Inputs JSX inside the `{mode === 'advanced' && ( ... )}` block. The current order is:

1. Actual TDD (around line 497)
2. Body Fat % (around lines 516–531) — the number input being replaced
3. Training Status (around lines 533–548)
4. Sex (+ Cycle expander) (around lines 550–586)

The new order will be:

1. Actual TDD (unchanged)
2. Sex (+ Cycle expander) (moved up)
3. Body Fat % (rebuilt as `BodyFatSelector`)
4. Training Status (unchanged)

First, locate the current Body Fat % block (the one currently sitting between Actual TDD and Training Status). The block is wrapped in a `<div className="mb-4">` and contains a `<label>`, an `<input type="number" ...>`, and a `<p>` italic hint. It looks like:

```jsx
              {/* Body Fat % */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                  Body Fat % (optional)
                </label>
                <input
                  type="number" step="0.5" min="5" max="60"
                  value={bodyFatPercent}
                  onChange={(e) => setBodyFatPercent(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
                />
                <p className="text-white/40 text-xs mt-1 italic">
                  For a more accurate TDD estimate if you know your body fat %. Skip if you provided actual TDD above.
                </p>
              </div>
```

**Delete that entire block.** It will be re-added in the new position in Step 6.

- [ ] **Step 6: Insert the new BodyFatSelector block AFTER the Sex block**

In the same file, find the Sex block (the one whose label says "Sex" and contains the two `male`/`female` buttons plus the Female-only cycle expander). It ends with the closing `</div>` of the wrapping `<div>` that contains both the Sex selector and the cycle expander. That outer `<div>` opens with `<div>` (no className, or check the actual code) and closes with a matching `</div>`.

**After the closing `</div>` of the Sex block** AND **before the Training Status block** (the one whose label says "Training Status"), insert a new block wrapping the `BodyFatSelector`:

```jsx
              {/* Body Fat % — moved below Sex so the reference image already
                  reflects the chosen sex */}
              <div className="mb-4 mt-4">
                <BodyFatSelector
                  sex={sex}
                  value={bodyFatPercent}
                  onChange={setBodyFatPercent}
                  label="Body Fat % (optional)"
                />
                <p className="text-white/40 text-xs mt-2 italic">
                  Skip if you provided Actual TDD above — body fat % is only used to refine the estimated TDD.
                </p>
              </div>
```

The expected final order inside the `{mode === 'advanced' && ( ... )}` block is:

1. Intro `<p>` ("The more we know about you...")
2. Actual TDD block
3. Sex block (with cycle expander)
4. Body Fat % block (new `BodyFatSelector`) ← inserted here
5. Training Status block

- [ ] **Step 7: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds with no errors, no warnings.

- [ ] **Step 8: Manual browser verify**

Run `npm run dev` and open the Magic Ratio Calculator (`/calculators/magic-ratio` or `/calculators/insulin`). Toggle to Advanced mode. Confirm:
- The Advanced Inputs StepCard appears with the new order: Actual TDD → Sex → Body Fat % → Training Status
- The Body Fat % section shows the slider + reference image (no longer a number input)
- The slider defaults to 20%
- Switching Sex Male ↔ Female immediately swaps the reference image
- Dragging the slider updates the value badge in real time
- The calculated ISF and I:C ratios in the Step 1 ratios display update as the BF% slider moves (math wiring still works)
- Clicking the Reset button returns BF% to 20% (and other Advanced state to defaults)

- [ ] **Step 9: Edge-case spot check — Beginner mode unaffected**

Toggle back to Beginner mode. Confirm:
- The Advanced Inputs StepCard disappears
- The ISF and I:C ratios reflect the weight × 0.55 calculation only (not the BF% slider value from Advanced)
- The slider value is still 20 when you toggle back to Advanced (state is preserved across toggles by design)

- [ ] **Step 10: Commit**

```bash
git add src/features/calculators/InsulinCalculator.jsx
git commit -m "feat(magic-ratio): swap Body Fat % to image-based selector + reorder

Replaced the Body Fat % number input in the Magic Ratio Calculator's
Advanced section with the new BodyFatSelector component (slider plus
sex-aware reference image, same UX as the protein calculator).

Reordered the Advanced inputs so Sex sits above Body Fat %, ensuring
the reference image already reflects the chosen sex by the time the
user is looking at the slider.

State shape: bodyFatPercent is now an integer (default 20) instead of
a string. parseFloat() is dropped from the tdd useMemo. reset()
returns the slider to 20."
```

---

# Wrap-up

After both tasks complete:

1. **Diff scope:** Only `public/images/bodyfat/*.webp`, `src/components/BodyFatSelector.jsx`, `src/features/calculators/ProteinCalculator.jsx`, and `src/features/calculators/InsulinCalculator.jsx` should be touched.
2. **Full visual QA:**
   - Open the protein calculator → BF% selector renders, image swaps with gender, slider works.
   - Open the Magic Ratio calculator → toggle Advanced → same selector renders below Sex, image swaps when Sex changes.
   - Network tab: both `/images/bodyfat/male.webp` and `/images/bodyfat/female.webp` return 200 OK.
3. **Optional cleanup:** the user has the original `male fat percentage.webp` and `female fat percentage .webp` files on their Desktop project root. After confirming the local copies render correctly, the originals can be deleted from the project root (they're not referenced by code). Leave that decision to the user — do NOT auto-delete.

---

*End of plan.*
