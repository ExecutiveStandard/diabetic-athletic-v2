// All coefficients are v1 starting values drawn from Riddell 2017 / EXTOD / ADA.
// They are expected to be refined based on real-world feedback.

// ───────────── PERSONALIZATION MULTIPLIERS ─────────────
// Coefficients are starting values drawn from Riddell 2017 /
// Yardley 2018 / EXTOD / Goldfarb cycle-phase literature. Conservative
// midpoints within published ranges; subject to feedback-based refinement.

export const SEX_IOB_MULTIPLIER = {
  male:   1.00,  // baseline
  female: 1.10,  // ~10% more insulin sensitive at baseline
}

export const CYCLE_IOB_MULTIPLIER = {
  follicular: 1.15,  // most insulin sensitive (low estrogen + progesterone)
  midCycle:   1.10,  // near-ovulation, intermediate
  luteal:     1.00,  // least sensitive (high progesterone)
  unknown:    1.10,  // safe midpoint default
}

export const TRAINING_BASE_MULTIPLIER = {
  untrained:     1.15,
  recreational:  1.00,  // baseline
  trained:       0.85,
  highlyTrained: 0.75,
}

export const FASTED_BASE_MULTIPLIER = {
  fasted: 1.10,  // larger glucose drop (lower glycogen, less substrate)
  fed:    1.00,  // baseline
}

export const FASTED_IOB_MULTIPLIER = {
  fasted: 0.90,  // catecholamines partially offset IOB
  fed:    1.00,  // baseline
}

export const INSULIN_ADJ_IOB_MULTIPLIER = {
  none:        1.00,  // baseline
  modest:      0.85,  // 25-50% reduction
  significant: 0.70,  // 50-80% reduction
}

const BASE_RATE_PER_MIN = {
  aerobic:   { easy: -0.025, moderate: -0.060, hard: -0.080, veryHard: -0.090 },
  anaerobic: { easy:  0.000, moderate:  0.015, hard:  0.040, veryHard:  0.060 },
  mixed:     { easy: -0.015, moderate: -0.040, hard: -0.050, veryHard: -0.045 },
  strength:  { easy: -0.005, moderate:  0.005, hard:  0.020, veryHard:  0.030 },
}

const IOB_AMPLIFIER = {
  aerobic:   2.5,
  mixed:     1.8,
  strength:  1.5,
  anaerobic: 1.0,
}

const INTENSITY_SCALER = {
  easy: 0.7, moderate: 1.0, hard: 1.2, veryHard: 1.3,
}

const TREND_PER_MIN = {
  doubleUp:    +0.067,
  up:          +0.033,
  flat:         0.000,
  down:        -0.033,
  doubleDown:  -0.067,
}

const TYPE_CARB_UTILIZATION = {
  aerobic:   0.6,
  mixed:     0.7,
  strength:  0.85,
  anaerobic: 0.95,
}

const TIME_OF_DAY_PER_MIN = {
  morning:  +0.010,
  midday:    0.000,
  evening:  -0.005,
}

function intensityBand(rpe) {
  if (rpe <= 3) return 'easy'
  if (rpe <= 6) return 'moderate'
  if (rpe <= 8) return 'hard'
  return 'veryHard'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function predictEndGlucose({
  startMmol,
  trendArrow,
  workoutType,
  intensity,
  durationMin,
  iobUnits,
  recentCarbs,
  bodyweightKg,
  timeOfDay,
  // NEW personalization inputs — all optional. If omitted, multipliers default
  // to 1.00 and the function output matches its pre-personalization behavior.
  sex,
  cyclePhase,
  trainingStatus,
  fastedFed,
  insulinAdjustment,
}) {
  const intensityKey = intensityBand(intensity)
  const breakdown = []

  // Resolve personalization multipliers. Each defaults to 1.00 if its input
  // is omitted, so this preserves backward compatibility for callers that
  // don't supply the new inputs.
  const sexMult        = SEX_IOB_MULTIPLIER[sex] ?? 1.00
  const cycleMult      = sex === 'female' ? (CYCLE_IOB_MULTIPLIER[cyclePhase] ?? 1.10) : 1.00
  const trainingMult   = TRAINING_BASE_MULTIPLIER[trainingStatus] ?? 1.00
  const fastedBaseMult = FASTED_BASE_MULTIPLIER[fastedFed] ?? 1.00
  const fastedIobMult  = FASTED_IOB_MULTIPLIER[fastedFed] ?? 1.00
  const insulinAdjMult = INSULIN_ADJ_IOB_MULTIPLIER[insulinAdjustment] ?? 1.00

  // 1. Base rate from workout type × intensity over duration
  const basePerMin = BASE_RATE_PER_MIN[workoutType][intensityKey]
  const baseDelta = basePerMin * durationMin * trainingMult * fastedBaseMult
  breakdown.push({
    label: `${durationMin}min ${workoutType} at ${intensityKey} intensity`,
    delta: baseDelta,
    reasoning: 'Glucose-rate response per minute of this workout type × intensity',
  })

  // 2. IOB contribution (amplified by workout type, scaled by intensity)
  const iobAmp = IOB_AMPLIFIER[workoutType]
  const iScaler = INTENSITY_SCALER[intensityKey]
  const iobDelta = -iobUnits * 1.8 * (durationMin / 60) * iobAmp * iScaler
                   * sexMult * cycleMult * fastedIobMult * insulinAdjMult
  if (iobUnits > 0) {
    breakdown.push({
      label: `${iobUnits}u IOB during ${workoutType}`,
      delta: iobDelta,
      reasoning: 'Active insulin amplified by exercise-driven uptake',
    })
  }

  // 3. CGM trend projection (capped at 60 min of projection)
  const projMin = Math.min(durationMin, 60)
  const trendDelta = (TREND_PER_MIN[trendArrow] || 0) * projMin
  if (trendDelta !== 0) {
    breakdown.push({
      label: `CGM trend (${trendArrow})`,
      delta: trendDelta,
      reasoning: 'Projects current arrow direction across early workout window',
    })
  }

  // 4. Recent-carb contribution (decays over 90 min)
  let carbDelta = 0
  if (recentCarbs && recentCarbs.grams > 0 && recentCarbs.minutesAgo < 90) {
    const availFrac = Math.max(0, 1 - recentCarbs.minutesAgo / 90)
    const utilization = TYPE_CARB_UTILIZATION[workoutType]
    carbDelta = recentCarbs.grams * 0.15 * availFrac * utilization
    breakdown.push({
      label: `${recentCarbs.grams}g carbs ${recentCarbs.minutesAgo}min ago`,
      delta: carbDelta,
      reasoning: 'Residual glucose available from recent intake',
    })
  }

  // 5. Time of day factor
  const todPerMin = TIME_OF_DAY_PER_MIN[timeOfDay] || 0
  const todDelta = todPerMin * durationMin
  if (todDelta !== 0) {
    breakdown.push({
      label: `${timeOfDay} circadian factor`,
      delta: todDelta,
      reasoning: timeOfDay === 'morning'
        ? 'Dawn-phenomenon counter-regulatory hormones'
        : 'End-of-day insulin sensitivity drift',
    })
  }

  const deltaMmol = baseDelta + iobDelta + trendDelta + carbDelta + todDelta
  const endMmol = clamp(startMmol + deltaMmol, 1.5, 30.0)

  // Sort breakdown by absolute contribution (largest impact first)
  breakdown.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return { endMmol, deltaMmol, breakdown }
}
