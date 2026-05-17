# Opt-In Pages — Design Spec

**Date:** 2026-05-17
**Status:** Approved
**Phase:** 1 (UI complete, submit stubbed; Bento wire-up deferred to Phase 2)

---

## 1. Goal

Build a gated opt-in landing page for each of the site's six lead-magnet calculators. Each opt-in page collects first name + email, sets a per-calculator localStorage flag, and immediately unlocks the calculator below. **In Phase 1, the form submission is stubbed** (no real email delivery) so the UI/UX is testable end-to-end and the site looks complete. **In Phase 2**, the stub is replaced by a server-side call to Bento (the user's email service) — without any change to the `OptInGate` component itself.

## 2. Audience and Voice

The audience for Diabetic Athletic is **people living with Type 1 diabetes who want to transition from a diabetic lifestyle to an athletic mindset** — physically, emotionally, and mentally. They are NOT pre-existing athletes who happen to have T1D. The brand is the bridge between the two states.

**Copy implications:**
- Do not use "for T1D athletes" or "designed for athletes with T1D" — excludes the actual audience.
- Acceptable framings: "for T1Ds ready to take an athletic approach", "for T1Ds who treat diabetes as a skill to master", "for T1Ds making the shift from diabetic to athletic."
- Honor the transformation theme (diabetic → athletic) as the brand's reason for existing.
- Don't assume the reader already trains hard, lifts heavy, or is in shape. Many won't be.

## 3. Non-Goals

- Real Bento integration (deferred to Phase 2)
- Cloudflare Worker function for `/api/subscribe` (deferred to Phase 2)
- Bento credential management / env vars (deferred to Phase 2)
- AI-generated per-calculator hero images (separate work stream — pure-CSS placeholder cards used in Phase 1)
- Email confirmation / double-opt-in (deferred)
- Per-calculator nurture sequence setup in Bento (user-managed in Bento dashboard, outside scope)
- Returning-user pre-fill across browser/device (Phase 1 uses localStorage only — not cross-device)

## 4. Architecture

**One reusable component does the work.** A new React component `OptInGate` wraps each calculator. The actual calculator code is unchanged — it's passed as `children`. This isolates the opt-in concern from the calculator concerns and keeps both files focused.

```
src/components/OptInGate.jsx          ← NEW, reusable
src/lib/optInSubmit.js                ← NEW, stub for Phase 1
src/features/calculators/*.jsx        ← MODIFIED, each wraps itself in OptInGate
```

**Routing is unchanged.** The existing `/calculators/<name>` URLs continue to point to the calculator components. The gate lives inside each calculator component — same URL, two states.

**Per-calculator content lives in a data module** so each calculator's wrapper stays minimal:

```
src/features/calculators/optInContent.js   ← NEW, content per calc slug
```

## 5. The `<OptInGate>` Component

### 5.1 Props (public API)

| Prop | Type | Purpose |
|---|---|---|
| `slug` | string | Unique calc id (e.g., `'magic-ratio'`). Drives the localStorage flag (`optin:magic-ratio`) and the future Bento tag (`calc-magic-ratio`). |
| `headline` | string | H1 promise |
| `subhead` | string | Supporting line under the headline |
| `bullets` | string[] | 3–4 short value statements rendered with checkmark icons |
| `ctaText` | string | Submit button label |
| `imageSrc` | string \| null | Path to right-column image. When `null` or 404, falls back to styled placeholder card. |
| `imageAlt` | string | Alt text for the image |
| `placeholderIcon` | string | Emoji shown on the placeholder card when no image (e.g., `'💉'`) |
| `placeholderTagline` | string | Short value-prop overlay on placeholder card (e.g., `'Discover your starting ratios in 60 seconds'`) |
| `children` | ReactNode | The actual calculator — revealed once gate passes |

### 5.2 Three Internal States

1. **Gated** *(default first visit)*: Split-layout opt-in renders. Left column = headline + subhead + bullets + form. Right column = image (or placeholder card). The calculator is NOT rendered yet — saves DOM weight and prevents the user from inspecting/extracting the calc before opting in.
2. **Submitting**: Submit button shows spinner + label `"Unlocking…"`. Form is disabled. Brief — typically <1 second in Phase 1 (the stub resolves after ~600ms to make the spinner feel real).
3. **Unlocked**: Gate disappears entirely. Calculator (`children`) renders. A small confirmation banner fades in at the top for ~5 seconds: *"✓ You're in — the calculator is unlocked below."*

### 5.3 Returning-User Pre-Fill

On mount:

1. If `localStorage['optin:<slug>']` is set → skip the gate entirely, render `children` on first paint.
2. Else if `localStorage['optinName']` and `localStorage['optinEmail']` are set (from any prior calculator opt-in) → pre-fill the form, add a small note: *"Welcome back, [Name] — confirm to unlock."* They click once, the (stubbed) submit runs, localStorage flag is set for this calc slug, calculator unlocks.
3. Else → blank form, full opt-in flow.

### 5.4 Error Handling

If the submit promise rejects (Phase 1: never; Phase 2: network errors, Bento outage, validation failures), an inline error message appears below the form: *"Something went wrong — try again in a moment, or email nick@diabeticathletic.com if it persists."* **The calculator is NOT unlocked on failure.** This protects the lead-magnet integrity — opt-in must succeed before the value is delivered.

### 5.5 Privacy Fine-Print

Small grey text below the submit button: *"We respect your inbox. Unsubscribe anytime. No spam, ever."* (Editable per calculator if needed, but identical default across all six.)

### 5.6 Form Validation

- First name: required, min 1 char, max 50 chars, trimmed
- Email: required, validated against standard regex (the same one Bento uses), trimmed and lowercased
- Validation errors render inline below each field on submit attempt — no toast/modal

## 6. Phase 1 Stub vs Phase 2 Bento

### 6.1 `src/lib/optInSubmit.js` (Phase 1)

```js
// Phase 1 stub. Pretends to submit, resolves after ~600ms.
// Replace with real Bento integration in Phase 2.
export async function submitOptIn({ firstName, email, calcSlug }) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { ok: true }
}
```

The OptInGate component calls `submitOptIn()` and awaits the promise. It doesn't know or care what the function does inside.

### 6.2 Phase 2 (future, not in this spec's scope)

The same `submitOptIn()` function is rewritten to POST to a Cloudflare Worker function (`/api/subscribe`), which calls the Bento API server-side with credentials stored as Cloudflare Worker environment variables. **No changes to the OptInGate component or any calculator.** Only the contents of `optInSubmit.js` and the addition of a Worker function.

## 7. Right-Column Image Strategy

### 7.1 Phase 1: Pure-CSS Placeholder Cards

When `imageSrc` is `null` or fails to load, render a styled placeholder:

- Full-height card with `bg-da-card` brand styling, rounded corners, subtle cyan left border
- Large centered emoji (`placeholderIcon` prop)
- Short tagline below (`placeholderTagline` prop)
- Subtle background gradient or pattern so it doesn't feel flat

Looks intentional and on-brand. Functional from day one without any image assets.

### 7.2 Phase 2: AI-Generated Images

Drop generated `.webp` files into `public/images/opt-in/<slug>.webp` and the component automatically uses them (the `<img>` resolves; the placeholder fallback never fires). Zero code change per swap.

### 7.3 File Structure

```
public/images/opt-in/                  ← directory created, empty in Phase 1
├── calorie.webp                       ← Phase 2
├── protein.webp                       ← Phase 2
├── magic-ratio.webp                   ← Phase 2
├── cardio.webp                        ← Phase 2
├── pre-workout-glucose.webp           ← Phase 2
└── meal-frequency.webp                ← Phase 2
```

## 8. Per-Calculator Content

All copy lives in `src/features/calculators/optInContent.js` as a single object keyed by slug. Each calculator imports its own entry.

```js
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
    subhead: 'Stop the guesswork before you train. Calculate exactly what to eat (and how much insulin to take or skip) before your next session — built around your body, your insulin, and the workout you\'re about to do.',
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

## 9. Calculator Wrapping Pattern

Each calculator file imports the content for its slug and wraps its existing UI:

```jsx
// e.g. InsulinCalculator.jsx
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function InsulinCalculator() {
  return (
    <OptInGate slug="magic-ratio" {...OPT_IN_CONTENT['magic-ratio']}>
      <InsulinCalculatorActual />
    </OptInGate>
  )
}

function InsulinCalculatorActual() {
  // ...existing calculator JSX, untouched
}
```

The existing calculator JSX moves into an internal `*Actual()` sub-component so the file's default export is the wrapped version. No external file (router, blog link, share URL) needs to change.

## 10. Layout (Split Layout)

On desktop (≥768px):

```
┌──────────────────────┬──────────────────────┐
│  HEADLINE            │                      │
│  subhead             │  [image or           │
│                      │   placeholder        │
│  ✓ bullet 1          │   card]              │
│  ✓ bullet 2          │                      │
│  ✓ bullet 3          │                      │
│  ✓ bullet 4          │                      │
│                      │                      │
│  [ First name     ]  │                      │
│  [ Email          ]  │                      │
│  [  CTA TEXT  →   ]  │                      │
│                      │                      │
│  small privacy note  │                      │
└──────────────────────┴──────────────────────┘
```

On mobile (<768px): single column. Image (or placeholder) renders at the top, content + form stack below.

Brand tokens used: `bg-da-dark` (page bg), `bg-da-card` (placeholder card bg), `text-da-cyan` (accents, checkmarks), `bg-da-gradient` (submit button bg), `text-da-dark` (button text on cyan bg), `border-da-cyan` (placeholder card border).

## 11. Routing Impact

None. All routes in `src/App.jsx` remain unchanged. The gate is purely component-level.

## 12. Testing

No new unit tests required for Phase 1 — the OptInGate is presentational + uses localStorage; behavior is best verified in the browser. Manual QA covers:

- First visit shows gate, blank form
- Submit unlocks the calculator
- Refresh: calculator shows immediately (localStorage flag persists)
- Open a DIFFERENT calculator: gate shows, but form pre-filled with name/email
- Clear localStorage: gate returns to blank-form state
- Mobile: layout stacks correctly
- Placeholder card renders when image is missing
- Error state (force the stub to reject) does not unlock the calculator

Phase 2 will warrant a Worker function integration test.

## 13. Out of Scope (Explicitly)

- Cross-device opt-in memory (would require account auth — not in plan)
- A/B testing infrastructure for headline variants
- Analytics events on opt-in submit (separate concern, future)
- Bot/spam protection (deferred to Phase 2 Worker function — honeypot field will be added there)
- Different layouts per calculator (all six use the same split-layout pattern)
