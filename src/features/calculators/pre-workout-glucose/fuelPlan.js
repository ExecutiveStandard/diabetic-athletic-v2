// Builds a fuel plan from the prediction inputs + the prediction engine's
// end-glucose output. Pure function — no React, no state, no side effects.
//
// Output shape splits the recommendation into:
//   rescue      — carbs needed NOW to bring BG into safe pre-workout range
//   activityFuel — carbs needed to power the workout itself
//   topUps      — mid-workout top-ups for sessions > 60 min
//   totalGrams  — sum of all of the above
//
// Spec: docs/superpowers/specs/2026-05-22-workout-fueling-rescue-fuel-split-design.md
// Tests: ./fuelPlan.test.js

const TARGET_RESCUE_MMOL = 6.5
const TARGET_END_MMOL = 7.5
const RESCUE_FLOOR_MMOL = 6.0
// Two-stage low-BG handling. Below TRUE_HYPO = treat the hypo, do NOT
// exercise yet. Between TRUE_HYPO and CAUTION_FLOOR = caution zone (eat to
// bring BG up to >= 6 mmol/L, then exercise carefully).
const TRUE_HYPO_MMOL = 3.9
const CAUTION_FLOOR_MMOL = 5.0
const SAFETY_CEILING_MMOL = 14.0
const REFERENCE_WEIGHT_KG = 70

const RESCUE_MIN_G = 5
const RESCUE_MAX_G = 25
const ACTIVITY_FUEL_MIN_G = 5
const ACTIVITY_FUEL_MAX_G = 60   // bumped from 40 to allow gap-closing in high-IOB scenarios
const TOP_UP_MIN_G = 10
const TOP_UP_MAX_G = 40
const SPLIT_DOSE_THRESHOLD_G = 25  // amounts above this get split pre/mid-workout

const ACTIVITY_FUEL_PER_KG_PER_HOUR = 0.4
const MIXED_ACTIVITY_MULTIPLIER = 0.6
const TOP_UP_PER_KG_PER_INTERVAL = 0.3
const TOP_UP_INTERVAL_MIN = 30

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function gramsToCloseGap(gapMmol, weightKg) {
  if (gapMmol <= 0) return 0
  return 5 * gapMmol * (weightKg / REFERENCE_WEIGHT_KG)
}

function buildRescue(startGlucoseMmol, weightKg) {
  if (startGlucoseMmol >= RESCUE_FLOOR_MMOL) return null
  const gap = TARGET_RESCUE_MMOL - startGlucoseMmol
  const raw = gramsToCloseGap(gap, weightKg)
  const grams = clamp(roundTo5(raw), RESCUE_MIN_G, RESCUE_MAX_G)
  return {
    grams,
    note: `Recheck in 15 min. Wait until you're at 6.5 mmol/L (117 mg/dL) or higher before starting.`,
  }
}

function buildActivityFuel(activityType, durationMinutes, weightKg, predictedEndMmol) {
  if (activityType === 'anaerobic' || activityType === 'strength') return null
  if (!durationMinutes || durationMinutes <= 0) return null

  // Two formulas — use whichever is larger:
  // 1. Endurance baseline (covers normal exercise glucose burn)
  const enduranceBase = ACTIVITY_FUEL_PER_KG_PER_HOUR * weightKg * (durationMinutes / 60)
  // 2. Top-up to target END glucose (handles high-IOB / large-predicted-drop scenarios)
  const gapBase = gramsToCloseGap(TARGET_END_MMOL - predictedEndMmol, weightKg)
  const base = Math.max(enduranceBase, gapBase)

  const adjusted = activityType === 'mixed' ? base * MIXED_ACTIVITY_MULTIPLIER : base
  const totalGrams = clamp(roundTo5(adjusted), ACTIVITY_FUEL_MIN_G, ACTIVITY_FUEL_MAX_G)

  // Split-dose for larger amounts — primary pre-workout dose + smaller on-hand
  // contingency. 60/40 split favors the primary dose (the one that does the
  // real work), keeping the contingency as a smaller safety net the user can
  // tap into if they actually trend low mid-workout.
  if (totalGrams > SPLIT_DOSE_THRESHOLD_G && durationMinutes >= 20) {
    const prePart = roundTo5(totalGrams * 0.6)
    const midPart = totalGrams - prePart
    const midAtMin = Math.round(durationMinutes / 2 / 5) * 5  // round to nearest 5 min
    return {
      grams: totalGrams,
      timingText: '10–15 min before you start',
      split: {
        preWorkoutGrams: prePart,
        midWorkoutGrams: midPart,
        midAtMinutes: midAtMin,
      },
    }
  }

  return {
    grams: totalGrams,
    timingText: '10–15 min before you start',
    split: null,
  }
}

function buildTopUps(durationMinutes, weightKg, activityType) {
  if (activityType === 'anaerobic' || activityType === 'strength') return []
  if (durationMinutes <= 60) return []

  const perTopUpRaw = TOP_UP_PER_KG_PER_INTERVAL * weightKg
  const perTopUp = clamp(roundTo5(perTopUpRaw), TOP_UP_MIN_G, TOP_UP_MAX_G)

  const topUps = []
  for (let t = TOP_UP_INTERVAL_MIN; t <= durationMinutes - 60; t += TOP_UP_INTERVAL_MIN) {
    topUps.push({ atMinutes: t, grams: perTopUp })
  }
  return topUps
}

function buildIobNote(iobUnits) {
  if (!iobUnits || iobUnits <= 0) return null
  const formatted = Number(iobUnits).toFixed(1).replace(/\.0$/, '')
  return `You have ~${formatted}u of active insulin from a recent bolus. For future workouts at this time of day, consider reducing your pre-meal bolus by ~50% to lower hypo risk during exercise.`
}

function computeTotal(rescue, activityFuel, topUps) {
  const r = rescue?.grams || 0
  const f = activityFuel?.grams || 0
  const t = topUps.reduce((s, tu) => s + tu.grams, 0)
  return r + f + t
}

export function buildFuelPlan({
  startGlucoseMmol,
  predictedEndMmol,
  activityType,
  durationMinutes,
  bodyweightKg,
  iobUnits,
}) {
  const iobNote = buildIobNote(iobUnits)

  // True hypo — treat first, do NOT exercise yet
  if (startGlucoseMmol < TRUE_HYPO_MMOL) {
    return {
      status: 'delay',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote,
      iobUnits: iobUnits || 0,
      warning:
        "Treat the hypo first. Your BG is below 3.9 mmol/L (70 mg/dL). Eat 20g of fast-acting carbs, wait 15 minutes, then recheck. Begin exercise only once your BG is above 5 mmol/L (90 mg/dL) and you feel stable.",
    }
  }

  // Caution zone — between true hypo and the safe-to-start floor.
  // The user can still exercise but should eat a small protective snack
  // first to bring BG into a safer range, and approach the session with
  // care (especially aerobic work).
  if (startGlucoseMmol < CAUTION_FLOOR_MMOL) {
    return {
      status: 'caution-low',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote,
      iobUnits: iobUnits || 0,
      warning:
        "Eat a small protective snack before starting. Your BG is in the caution zone (3.9–5.0 mmol/L / 70–90 mg/dL). Eat 15–20g of fast-acting carbs, wait 15 minutes for your BG to climb above 5.0 mmol/L (90 mg/dL), then re-enter your new BG here for a full fuel plan. Approach aerobic work with extra care today.",
    }
  }

  // Hyperglycemia ceiling — check ketones, exercise light if at all
  if (startGlucoseMmol > SAFETY_CEILING_MMOL) {
    return {
      status: 'high-bg-warning',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote,
      iobUnits: iobUnits || 0,
      warning:
        'Check for ketones before starting. Your BG is above 14 mmol/L (252 mg/dL), the threshold where exercise risks worsening hyperglycemia. If ketones are present, follow your diabetes team\'s guidance — don\'t exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session.',
    }
  }

  const rescue = buildRescue(startGlucoseMmol, bodyweightKg)
  const activityFuel = buildActivityFuel(activityType, durationMinutes, bodyweightKg, predictedEndMmol)
  const topUps = buildTopUps(durationMinutes, bodyweightKg, activityType)
  const totalGrams = computeTotal(rescue, activityFuel, topUps)

  // Predicted-end projection: model what BG will be at workout end if user
  // follows the activityFuel + topUps plan. The rescue dose just brings them
  // to start in range; it doesn't change the trajectory through the workout.
  const liftPerGram = (1 / 5) * (REFERENCE_WEIGHT_KG / bodyweightKg)
  const activeFuelGrams = (activityFuel?.grams || 0) + topUps.reduce((s, t) => s + t.grams, 0)
  const predictedEndWithFuel = predictedEndMmol + activeFuelGrams * liftPerGram

  if (totalGrams === 0) {
    return {
      status: 'no-fuel',
      rescue: null,
      activityFuel: null,
      topUps: [],
      totalGrams: 0,
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel,
      iobNote,
      iobUnits: iobUnits || 0,
      warning: null,
    }
  }

  return {
    status: 'fuel',
    rescue,
    activityFuel,
    topUps,
    totalGrams,
    predictedEndWithoutFuel: predictedEndMmol,
    predictedEndWithFuel,
    iobNote,
    iobUnits: iobUnits || 0,
    warning: null,
  }
}
