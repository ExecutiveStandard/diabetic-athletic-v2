# Opt-In Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build gated opt-in landing pages (Phase 1: UI complete with stubbed submit) for each of the six lead-magnet calculators using a single reusable `<OptInGate>` component.

**Architecture:** One reusable presentational component (`src/components/OptInGate.jsx`) wraps each calculator's existing UI as `children`. Form submission goes through a stubbed function (`src/lib/optInSubmit.js`) that resolves after ~600ms — Phase 2 will swap this for a real Bento integration without changing the component. Per-calculator copy lives in a central data module (`src/features/calculators/optInContent.js`). Each calculator file is restructured: its existing JSX moves into an internal `*Actual()` subcomponent, and the new default export wraps it in `<OptInGate>`.

**Tech Stack:** React 19 + Vite + TailwindCSS. No new dependencies. localStorage for per-calculator opt-in memory.

**Spec source-of-truth:** [`docs/superpowers/specs/2026-05-17-opt-in-pages-design.md`](../specs/2026-05-17-opt-in-pages-design.md)

---

## File Structure

```
src/
├── components/
│   └── OptInGate.jsx                          # CREATE (Task 2)
├── lib/
│   └── optInSubmit.js                         # CREATE (Task 1)
└── features/
    └── calculators/
        ├── optInContent.js                    # CREATE (Task 1)
        ├── CalorieCalculator.jsx              # MODIFY (Task 3)
        ├── ProteinCalculator.jsx              # MODIFY (Task 4)
        ├── InsulinCalculator.jsx              # MODIFY (Task 5)
        ├── CardioCalculator.jsx               # MODIFY (Task 6)
        ├── PreWorkoutGlucoseCalculator.jsx    # MODIFY (Task 7)
        └── MealFrequencyCalculator.jsx        # MODIFY (Task 8)
```

No tests required (per spec §12 — Phase 1 is browser-verified). No route changes. No new dependencies.

---

## Slug → Calculator File Mapping

This table is the source-of-truth for the wrapping tasks (Tasks 3–8):

| Slug | File | Existing default-export function name | New `*Actual()` name |
|---|---|---|---|
| `calorie` | `CalorieCalculator.jsx` | `CalorieCalculator` | `CalorieCalculatorActual` |
| `protein` | `ProteinCalculator.jsx` | `ProteinCalculator` | `ProteinCalculatorActual` |
| `magic-ratio` | `InsulinCalculator.jsx` | `InsulinCalculator` | `InsulinCalculatorActual` |
| `cardio` | `CardioCalculator.jsx` | `CardioCalculator` | `CardioCalculatorActual` |
| `pre-workout-glucose` | `PreWorkoutGlucoseCalculator.jsx` | `PreWorkoutGlucoseCalculator` | `PreWorkoutGlucoseCalculatorActual` |
| `meal-frequency` | `MealFrequencyCalculator.jsx` | `MealFrequencyCalculator` | `MealFrequencyCalculatorActual` |

The Magic Ratio calculator has two routes (`/calculators/magic-ratio` and `/calculators/insulin`) pointing to the same `InsulinCalculator` component. Wrapping the component once via Task 5 makes BOTH routes show the gate — slug `magic-ratio` is used for both because they're functionally one calculator.

---

## Task 1: Stub submit function + per-calculator content module

Spec reference: §6.1 (stub), §8 (per-calculator content)

**Files:**
- Create: `src/lib/optInSubmit.js`
- Create: `src/features/calculators/optInContent.js`

Both files are pure data / a one-function stub. No UI. Together they form the data backbone the `OptInGate` component will consume in Task 2.

- [ ] **Step 1: Create the stub submit function**

Create `src/lib/optInSubmit.js` with this exact content:

```js
// Phase 1 stub. Pretends to submit, resolves after ~600ms so the
// spinner state in the OptInGate has time to feel real.
//
// Phase 2 will replace this function's body with a real POST to
// /api/subscribe (a Cloudflare Worker function that calls Bento's
// API server-side). The function signature stays the same — the
// OptInGate component does not need to change.
export async function submitOptIn({ firstName, email, calcSlug }) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { ok: true }
}
```

- [ ] **Step 2: Create the per-calculator content module**

Create `src/features/calculators/optInContent.js` with this exact content:

```js
// Per-calculator opt-in copy + placeholder visuals.
// Keyed by slug — matches the slugs used in App.jsx routes and the
// localStorage flag keys (optin:<slug>).
export const OPT_IN_CONTENT = {
  calorie: {
    headline: 'Your Personalized Daily Calorie Target',
    subhead: 'Stop guessing what to eat. Get a precise calorie and macro target built around your real body, your real activity, and your real goals — in 60 seconds.',
    bullets: [
      'Calculate your true TDEE using the Mifflin-St Jeor formula',
      'Get personalized protein, fat, and carb targets for your goal',
      'Built-in macro breakdown — see what your day should actually look like',
      'Designed for T1Ds ready to eat with purpose',
    ],
    ctaText: 'Get My Calorie Target',
    placeholderIcon: '🔥',
    placeholderTagline: 'Your daily target, dialed in',
  },
  protein: {
    headline: 'How Much Protein Does Your Body Actually Need?',
    subhead: "Generic protein recommendations don't account for living with Type 1 diabetes. Get a target built for your body, your activity level, and your goals.",
    bullets: [
      'Calculated using body fat % for accuracy, not just bodyweight',
      'Adjusts for your activity — from light to intense',
      'Built specifically for the T1D body',
      'Visual body-fat reference guide built in',
    ],
    ctaText: 'Get My Protein Target',
    placeholderIcon: '🥩',
    placeholderTagline: 'Built for your body, not the average one',
  },
  'magic-ratio': {
    headline: 'Discover Your Magic Insulin Ratios',
    subhead: 'Stop guessing your I:C and ISF. Get calibrated starting points for your insulin-to-carb ratio and insulin sensitivity factor — built on proven T1D dosing math — then refine them with real-world data.',
    bullets: [
      'Calculates ISF and I:C ratios for morning, afternoon, and evening',
      'Beginner mode for fast estimates; Advanced mode for personalization',
      'Factors in body fat %, training status, sex, and cycle phase',
      'For T1Ds who treat dosing as a skill to master',
    ],
    ctaText: 'Find My Magic Ratios',
    placeholderIcon: '💉',
    placeholderTagline: 'Your starting points, calibrated',
  },
  cardio: {
    headline: 'Predict Your Glucose Response — By Heart Rate Zone',
    subhead: "Cardio isn't just cardio. The intensity you train at determines whether your BG drops, holds steady, or spikes. Find your personalized heart rate zones and see what each one will do to your glucose — before you lace up.",
    bullets: [
      'Calculates your personalized heart rate zones',
      'Predicts your glucose response at each zone (drop, hold, or spike)',
      'Shows why intensity — not just exercise — drives BG changes',
      'For T1Ds ready to train smarter',
    ],
    ctaText: 'See My Glucose Response',
    placeholderIcon: '❤️',
    placeholderTagline: 'Intensity matters. See why.',
  },
  'pre-workout-glucose': {
    headline: 'Fuel Your Workout. Skip the BG Crash.',
    subhead: "Stop the guesswork before you train. Calculate exactly what to eat (and how much insulin to take or skip) before your next session — built around your body, your insulin, and the workout you're about to do.",
    bullets: [
      'Carbs + insulin adjustment for your specific pre-workout glucose',
      'Adapts for resistance, HIIT, and aerobic zone sessions',
      'Accounts for insulin on board (IOB)',
      'Personalizes for sex, cycle, training status, and fasted vs fed',
    ],
    ctaText: 'Calculate My Pre-Workout',
    placeholderIcon: '⚡',
    placeholderTagline: 'Train with confidence, not guesswork',
  },
  'meal-frequency': {
    headline: 'How Many Meals Should You Eat Today?',
    subhead: 'On training days, around-workout fueling changes everything. Get a meal frequency and timing plan built around your training schedule and total daily intake.',
    bullets: [
      "Calculates optimal meal count for your day's calorie target",
      'Adjusts for training days vs rest days',
      'Peri-workout meal weighting baked in',
      'Tuned to the timing demands of T1D management',
    ],
    ctaText: 'Plan My Meals',
    placeholderIcon: '🍴',
    placeholderTagline: 'Meal timing that serves your training',
  },
}
```

- [ ] **Step 3: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds (no JSX touched yet, just two new ES modules — should compile cleanly).

- [ ] **Step 4: Commit**

```bash
git add src/lib/optInSubmit.js src/features/calculators/optInContent.js
git commit -m "feat(opt-in): add submit stub + per-calculator content module

Stub: src/lib/optInSubmit.js exports submitOptIn({firstName, email,
calcSlug}) that resolves after 600ms. Phase 2 will swap this for a
real Bento integration without changing the function signature.

Content: src/features/calculators/optInContent.js exports OPT_IN_CONTENT
keyed by slug. Each entry has headline, subhead, bullets, ctaText,
placeholderIcon, placeholderTagline.

Implements opt-in spec sections 6.1 and 8."
```

---

## Task 2: Build the `<OptInGate>` component

Spec reference: §5 (full component design), §10 (split layout), §11 (Tailwind brand tokens)

**Files:**
- Create: `src/components/OptInGate.jsx`

This is the largest single task. It produces one self-contained presentational component that handles three states (gated / submitting / unlocked), reads and writes localStorage, pre-fills for returning users, renders a placeholder card when the image is missing, and falls back gracefully on submit failure.

- [ ] **Step 1: Create the OptInGate component file**

Create `src/components/OptInGate.jsx` with this exact content:

```jsx
import { useEffect, useState } from 'react'
import { submitOptIn } from '../lib/optInSubmit'

// Reusable opt-in gate. Wraps any calculator (passed as children) with a
// split-layout landing page that captures first name + email before
// revealing the calculator.
//
// Per-calculator memory lives in localStorage:
//   - optin:<slug>   → presence means this calc is unlocked for this browser
//   - optinName      → cross-calc pre-fill name
//   - optinEmail     → cross-calc pre-fill email
//
// Three internal states: 'gated' | 'submitting' | 'unlocked'
export default function OptInGate({
  slug,
  headline,
  subhead,
  bullets = [],
  ctaText = 'Unlock',
  imageSrc = null,
  imageAlt = '',
  placeholderIcon = '✨',
  placeholderTagline = '',
  children,
}) {
  // Compute initial state synchronously from localStorage so the gate
  // never flashes for already-opted-in users.
  const [status, setStatus] = useState(() => {
    if (typeof window === 'undefined') return 'gated'
    return localStorage.getItem(`optin:${slug}`) ? 'unlocked' : 'gated'
  })

  const [firstName, setFirstName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('optinName') || ''
  })
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('optinEmail') || ''
  })

  const [fieldErrors, setFieldErrors] = useState({ firstName: '', email: '' })
  const [submitError, setSubmitError] = useState('')
  const [showBanner, setShowBanner] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const isReturningUser =
    status === 'gated' &&
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem('optinName')) &&
    Boolean(localStorage.getItem('optinEmail'))

  // Fade out the success banner after 5s
  useEffect(() => {
    if (!showBanner) return
    const t = setTimeout(() => setShowBanner(false), 5000)
    return () => clearTimeout(t)
  }, [showBanner])

  function validate() {
    const errors = { firstName: '', email: '' }
    const trimmedName = firstName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (trimmedName.length < 1) errors.firstName = 'Please enter your first name'
    if (trimmedName.length > 50) errors.firstName = 'Name is too long'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      errors.email = 'Please enter a valid email address'
    return { errors, trimmedName, trimmedEmail }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const { errors, trimmedName, trimmedEmail } = validate()
    if (errors.firstName || errors.email) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({ firstName: '', email: '' })
    setStatus('submitting')
    try {
      const res = await submitOptIn({
        firstName: trimmedName,
        email: trimmedEmail,
        calcSlug: slug,
      })
      if (!res?.ok) throw new Error('submit failed')
      localStorage.setItem(`optin:${slug}`, '1')
      localStorage.setItem('optinName', trimmedName)
      localStorage.setItem('optinEmail', trimmedEmail)
      setShowBanner(true)
      setStatus('unlocked')
    } catch (err) {
      setSubmitError(
        "Something went wrong — try again in a moment, or email nick@diabeticathletic.com if it persists.",
      )
      setStatus('gated')
    }
  }

  // ─────────────────────────── UNLOCKED ───────────────────────────
  if (status === 'unlocked') {
    return (
      <>
        {showBanner && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-da-cyan text-da-dark font-bold px-6 py-3 rounded-lg shadow-lg text-sm">
            ✓ You're in — the calculator is unlocked below.
          </div>
        )}
        {children}
      </>
    )
  }

  // ─────────────────────────── GATED / SUBMITTING ───────────────────────────
  const submitting = status === 'submitting'

  return (
    <div className="min-h-screen bg-da-dark py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left column — content + form */}
        <div className="order-2 md:order-1">
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            {headline}
          </h1>
          <p className="text-white/70 text-base md:text-lg leading-relaxed mb-6">
            {subhead}
          </p>

          {bullets.length > 0 && (
            <ul className="space-y-3 mb-8">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80 text-sm md:text-base">
                  <span className="text-da-cyan font-bold mt-0.5">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {isReturningUser && (
            <p className="text-da-cyan text-sm mb-4">
              Welcome back, {firstName} — confirm to unlock.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                maxLength={50}
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition disabled:opacity-50"
              />
              {fieldErrors.firstName && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition disabled:opacity-50"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-da-gradient text-da-dark font-black uppercase tracking-wider py-4 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Unlocking…' : `${ctaText} →`}
            </button>

            {submitError && (
              <p className="text-red-400 text-sm mt-3">{submitError}</p>
            )}

            <p className="text-white/40 text-xs mt-4 text-center">
              We respect your inbox. Unsubscribe anytime. No spam, ever.
            </p>
          </form>
        </div>

        {/* Right column — image OR placeholder card */}
        <div className="order-1 md:order-2">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="w-full h-auto rounded-2xl"
            />
          ) : (
            <div className="bg-da-card rounded-2xl p-12 border-l-4 border-da-cyan flex flex-col items-center justify-center text-center min-h-[360px]">
              <div className="text-7xl mb-4">{placeholderIcon}</div>
              {placeholderTagline && (
                <p className="text-white/70 text-lg font-medium italic max-w-xs">
                  {placeholderTagline}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds with no errors, no warnings. The component is not yet used by any calculator, so the bundle size barely changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/OptInGate.jsx
git commit -m "feat(opt-in): add reusable OptInGate component

Split-layout opt-in gate that wraps any calculator. States:
gated / submitting / unlocked. Reads + writes localStorage for
per-calc memory (optin:<slug>) and cross-calc pre-fill
(optinName, optinEmail). Falls back to a styled placeholder card
when no imageSrc is provided. Form validation, error state, and
success banner all included.

Implements opt-in spec section 5."
```

---

## Task 3: Wrap Calorie Calculator

Spec reference: §9 (wrapping pattern)

**Files:**
- Modify: `src/features/calculators/CalorieCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/CalorieCalculator.jsx`. Find the existing import block at the top. After the LAST existing import line, add these two lines:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Still in `src/features/calculators/CalorieCalculator.jsx`, find the existing line:

```jsx
export default function CalorieCalculator() {
```

Replace it with:

```jsx
function CalorieCalculatorActual() {
```

(Drop `export default`. Rename to `CalorieCalculatorActual`. The function body stays exactly the same.)

- [ ] **Step 3: Add the new default export wrapper**

In the same file, ADD this new default-export function immediately AFTER the last existing import line and BEFORE the `CalorieCalculatorActual` function (or any other top-level declarations):

```jsx
export default function CalorieCalculator() {
  return (
    <OptInGate slug="calorie" {...OPT_IN_CONTENT.calorie}>
      <CalorieCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run from worktree root: `npm run build`
Expected: build succeeds. No errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/CalorieCalculator.jsx
git commit -m "feat(opt-in): gate Calorie & TDEE calculator with OptInGate

Existing calculator JSX is now CalorieCalculatorActual(). The default
export wraps it in <OptInGate slug=\"calorie\"> using copy from
optInContent.js. Same URL, same behavior post-opt-in."
```

---

## Task 4: Wrap Protein Calculator

Spec reference: §9 (wrapping pattern)

**Files:**
- Modify: `src/features/calculators/ProteinCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/ProteinCalculator.jsx`. Find the existing import block. After the LAST existing import line, add:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Find the existing line:

```jsx
export default function ProteinCalculator() {
```

Replace with:

```jsx
function ProteinCalculatorActual() {
```

- [ ] **Step 3: Add the new default export wrapper**

ADD this new function immediately AFTER the last import line:

```jsx
export default function ProteinCalculator() {
  return (
    <OptInGate slug="protein" {...OPT_IN_CONTENT.protein}>
      <ProteinCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/ProteinCalculator.jsx
git commit -m "feat(opt-in): gate Protein calculator with OptInGate

Existing calculator JSX is now ProteinCalculatorActual(). The default
export wraps it in <OptInGate slug=\"protein\"> using copy from
optInContent.js."
```

---

## Task 5: Wrap Magic Ratio (Insulin) Calculator

Spec reference: §9 (wrapping pattern). Note: this single component is mounted at both `/calculators/magic-ratio` and `/calculators/insulin` routes — wrapping it once gates both.

**Files:**
- Modify: `src/features/calculators/InsulinCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/InsulinCalculator.jsx`. Find the existing import block. After the LAST existing import line, add:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Find the existing line:

```jsx
export default function InsulinCalculator() {
```

Replace with:

```jsx
function InsulinCalculatorActual() {
```

- [ ] **Step 3: Add the new default export wrapper**

ADD this new function immediately AFTER the last import line (it can go above the module-level constants like `ISF_NUMERATORS`, that's fine — React component placement isn't ordered with respect to module-level data):

```jsx
export default function InsulinCalculator() {
  return (
    <OptInGate slug="magic-ratio" {...OPT_IN_CONTENT['magic-ratio']}>
      <InsulinCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/InsulinCalculator.jsx
git commit -m "feat(opt-in): gate Magic Ratio calculator with OptInGate

Existing calculator JSX is now InsulinCalculatorActual(). The default
export wraps it in <OptInGate slug=\"magic-ratio\"> using copy from
optInContent.js. Both /calculators/magic-ratio and /calculators/insulin
routes now show the gate (they mount the same component)."
```

---

## Task 6: Wrap Cardio Calculator

Spec reference: §9 (wrapping pattern)

**Files:**
- Modify: `src/features/calculators/CardioCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/CardioCalculator.jsx`. After the LAST existing import line, add:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Find the existing line:

```jsx
export default function CardioCalculator() {
```

Replace with:

```jsx
function CardioCalculatorActual() {
```

- [ ] **Step 3: Add the new default export wrapper**

ADD this new function immediately AFTER the last import line:

```jsx
export default function CardioCalculator() {
  return (
    <OptInGate slug="cardio" {...OPT_IN_CONTENT.cardio}>
      <CardioCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/CardioCalculator.jsx
git commit -m "feat(opt-in): gate Cardio calculator with OptInGate

Existing calculator JSX is now CardioCalculatorActual(). The default
export wraps it in <OptInGate slug=\"cardio\"> using copy from
optInContent.js."
```

---

## Task 7: Wrap Workout Fueling (Pre-Workout Glucose) Calculator

Spec reference: §9 (wrapping pattern). Note: file is named `PreWorkoutGlucoseCalculator.jsx` but the calculator is branded "Workout Fueling Calculator." The slug matches the file/URL: `pre-workout-glucose`.

**Files:**
- Modify: `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/PreWorkoutGlucoseCalculator.jsx`. After the LAST existing import line, add:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Find the existing line:

```jsx
export default function PreWorkoutGlucoseCalculator() {
```

Replace with:

```jsx
function PreWorkoutGlucoseCalculatorActual() {
```

- [ ] **Step 3: Add the new default export wrapper**

ADD this new function immediately AFTER the last import line:

```jsx
export default function PreWorkoutGlucoseCalculator() {
  return (
    <OptInGate slug="pre-workout-glucose" {...OPT_IN_CONTENT['pre-workout-glucose']}>
      <PreWorkoutGlucoseCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/PreWorkoutGlucoseCalculator.jsx
git commit -m "feat(opt-in): gate Workout Fueling calculator with OptInGate

Existing calculator JSX is now PreWorkoutGlucoseCalculatorActual().
The default export wraps it in <OptInGate slug=\"pre-workout-glucose\">
using copy from optInContent.js."
```

---

## Task 8: Wrap Meal Frequency Planner

Spec reference: §9 (wrapping pattern). This is the final calculator. After this task, all six calculators are gated.

**Files:**
- Modify: `src/features/calculators/MealFrequencyCalculator.jsx`

- [ ] **Step 1: Add the two imports at the top of the file**

Open `src/features/calculators/MealFrequencyCalculator.jsx`. After the LAST existing import line, add:

```jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'
```

- [ ] **Step 2: Rename the existing default export to the `*Actual()` internal name**

Find the existing line:

```jsx
export default function MealFrequencyCalculator() {
```

Replace with:

```jsx
function MealFrequencyCalculatorActual() {
```

- [ ] **Step 3: Add the new default export wrapper**

ADD this new function immediately AFTER the last import line:

```jsx
export default function MealFrequencyCalculator() {
  return (
    <OptInGate slug="meal-frequency" {...OPT_IN_CONTENT['meal-frequency']}>
      <MealFrequencyCalculatorActual />
    </OptInGate>
  )
}
```

- [ ] **Step 4: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculators/MealFrequencyCalculator.jsx
git commit -m "feat(opt-in): gate Meal Frequency planner with OptInGate

Existing calculator JSX is now MealFrequencyCalculatorActual(). The
default export wraps it in <OptInGate slug=\"meal-frequency\"> using
copy from optInContent.js.

All six calculators are now gated behind opt-in pages."
```

---

# Wrap-up

After all 8 tasks complete, do a full visual QA pass in the browser. Run `npm run dev` from the worktree and walk through:

**Per-calculator initial visit (one fresh browser / private window per scenario):**
1. Visit `/calculators/calorie` → opt-in gate appears, blank form, placeholder card with 🔥 icon on the right (or below on mobile)
2. Fill in first name + email → click submit → spinner appears for ~600ms → calculator unlocks below + green success banner fades in at top
3. Refresh the page → calculator shows immediately, no gate
4. Visit `/calculators/protein` → gate appears again BUT the form is pre-filled with the name + email entered for calorie, with a "Welcome back, [Name] — confirm to unlock" note above
5. Click submit → calculator unlocks
6. Repeat for `/calculators/magic-ratio`, `/calculators/cardio`, `/calculators/pre-workout-glucose`, `/calculators/meal-frequency`

**Edge cases:**
- Visit `/calculators/insulin` (the alias route) → same gate as `/calculators/magic-ratio` (slug `magic-ratio`); opting in for one unlocks the other
- Mobile viewport (resize browser to <768px or use device emulation) → layout stacks (image/placeholder on top, content + form below)
- Submit with blank first name → inline error appears
- Submit with invalid email → inline error appears
- Clear all localStorage in DevTools → all gates return to blank-form state
- View a calculator after clearing localStorage and confirm no calculator UI is visible until opt-in succeeds (gate strictly blocks)

**Visual checks:**
- Each calculator's placeholder card shows the right emoji per `OPT_IN_CONTENT`
- Headlines feel coach-like and on-brand (no "T1D athletes" framing)
- Privacy note ("We respect your inbox…") appears under every submit button
- Brand colors are correct: cyan accents, dark background, gradient submit button

If all of the above passes, the opt-in feature is ready. Phase 2 (real Bento integration) is a separate plan.

---

*End of plan.*
