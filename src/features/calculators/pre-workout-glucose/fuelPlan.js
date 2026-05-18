// Builds a fuel plan from the prediction inputs + the prediction engine's
// end-glucose output. Pure function — no React, no state, no side effects.
//
// Spec: docs/superpowers/specs/2026-05-17-workout-fueling-redesign-design.md
// Tests: ./fuelPlan.test.js

const SAFETY_FLOOR_MMOL = 5.0
const SAFETY_CEILING_MMOL = 15.0
const ANAEROBIC_FLOOR_MMOL = 6.0
const REFERENCE_WEIGHT_KG = 70

const PRE_WORKOUT_MAX_G = 60
const TOP_UP_MIN_G = 10
const TOP_UP_MAX_G = 40

const MIXED_DOSE_MULTIPLIER = 0.6
const TOP_UP_PER_KG_PER_INTERVAL = 0.3   // g/kg per 30-min interval
const TOP_UP_INTERVAL_MIN = 30

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// 5g of fast carbs raises BG by ~1 mmol/L for a 70kg adult. Scales by weight.
function gramsToCloseGap(gapMmol, weightKg) {
  if (gapMmol <= 0) return 0
  const raw = 5 * gapMmol * (weightKg / REFERENCE_WEIGHT_KG)
  return clamp(roundTo5(raw), 0, PRE_WORKOUT_MAX_G)
}

function buildTopUps(durationMinutes, weightKg, activityType) {
  if (activityType === 'anaerobic' || activityType === 'strength') return []
  if (durationMinutes <= 60) return []

  const perTopUpRaw = TOP_UP_PER_KG_PER_INTERVAL * weightKg
  const perTopUp = clamp(roundTo5(perTopUpRaw), TOP_UP_MIN_G, TOP_UP_MAX_G)

  // Top-ups scheduled every 30 min, but NOT in the final 60-min window.
  // 61–90 min → one at 30 min; 91–120 min → two at 30, 60 min; etc.
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

export function buildFuelPlan({
  startGlucoseMmol,
  predictedEndMmol,
  activityType,
  durationMinutes,
  bodyweightKg,
  iobUnits,
}) {
  // Safety branch: starting BG below safe floor
  if (startGlucoseMmol < SAFETY_FLOOR_MMOL) {
    return {
      status: 'delay',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote: buildIobNote(iobUnits),
      warning:
        "Don't start your workout yet. Your BG is below 5 mmol/L. Eat 15-20g of fast-acting carbs, wait 15 minutes, then recheck. Begin only once your BG is above 5 mmol/L.",
    }
  }

  // Safety branch: starting BG above safe ceiling
  if (startGlucoseMmol > SAFETY_CEILING_MMOL) {
    return {
      status: 'high-bg-warning',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel: predictedEndMmol,
      iobNote: buildIobNote(iobUnits),
      warning:
        'Check for ketones before starting. Your BG is above 15 mmol/L. If ketones are present, follow your diabetes team\'s guidance — don\'t exercise until cleared. If absent, keep this session light (low intensity only) and recheck BG mid-session.',
    }
  }

  const iobNote = buildIobNote(iobUnits)

  // Compute the aerobic baseline: fuel to cover the predicted drop during the workout.
  // (startGlucoseMmol − predictedEndMmol) = how far BG is expected to fall.
  const predictedDrop = startGlucoseMmol - predictedEndMmol
  const aerobicGrams = gramsToCloseGap(predictedDrop, bodyweightKg)

  let preWorkoutGrams = 0

  if (activityType === 'aerobic') {
    preWorkoutGrams = aerobicGrams
  } else if (activityType === 'mixed') {
    preWorkoutGrams = clamp(
      roundTo5(aerobicGrams * MIXED_DOSE_MULTIPLIER),
      0,
      PRE_WORKOUT_MAX_G,
    )
  } else if (activityType === 'anaerobic') {
    // Anaerobic: 0g unless starting BG is below the anaerobic floor (6.0)
    if (startGlucoseMmol < ANAEROBIC_FLOOR_MMOL) {
      const protectiveGap = ANAEROBIC_FLOOR_MMOL - startGlucoseMmol
      preWorkoutGrams = gramsToCloseGap(protectiveGap, bodyweightKg)
    }
  }

  const topUps = buildTopUps(durationMinutes, bodyweightKg, activityType)

  // Project what BG will be at workout end if user follows the recommendation
  const liftPerGram = (1 / 5) * (REFERENCE_WEIGHT_KG / bodyweightKg)
  const predictedEndWithFuel = predictedEndMmol + preWorkoutGrams * liftPerGram

  if (preWorkoutGrams === 0 && topUps.length === 0) {
    return {
      status: 'no-fuel',
      preWorkout: null,
      topUps: [],
      predictedEndWithoutFuel: predictedEndMmol,
      predictedEndWithFuel,
      iobNote,
      warning: null,
    }
  }

  return {
    status: 'fuel',
    preWorkout:
      preWorkoutGrams > 0
        ? {
            grams: preWorkoutGrams,
            timingText: activityType === 'aerobic' ? '15 minutes before you start' : '10 minutes before you start',
          }
        : null,
    topUps,
    predictedEndWithoutFuel: predictedEndMmol,
    predictedEndWithFuel,
    iobNote,
    warning: null,
  }
}
