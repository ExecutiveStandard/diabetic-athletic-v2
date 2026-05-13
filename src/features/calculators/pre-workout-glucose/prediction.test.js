import { describe, it, expect } from 'vitest'
import {
  predictEndGlucose,
  SEX_IOB_MULTIPLIER,
  CYCLE_IOB_MULTIPLIER,
  TRAINING_BASE_MULTIPLIER,
  FASTED_BASE_MULTIPLIER,
  FASTED_IOB_MULTIPLIER,
  INSULIN_ADJ_IOB_MULTIPLIER,
} from './prediction'

// Helper: standard input shape
const baseInput = {
  startMmol: 7.0,
  trendArrow: 'flat',          // doubleUp / up / flat / down / doubleDown
  workoutType: 'aerobic',      // aerobic / anaerobic / mixed / strength
  intensity: 5,                // 1-10 RPE
  durationMin: 45,
  iobUnits: 0,
  recentCarbs: { grams: 0, minutesAgo: 0 },
  bodyweightKg: 70,
  timeOfDay: 'midday',         // morning / midday / evening
}

describe('predictEndGlucose — basic aerobic scenarios', () => {
  it('moderate aerobic, no IOB, flat trend, no recent carbs → drops glucose', () => {
    const result = predictEndGlucose({ ...baseInput, workoutType: 'aerobic', intensity: 5, durationMin: 45 })
    // base_rate(aerobic, mod) = -0.060; over 45 min = -2.7 mmol/L
    // No other contributions → end = 7.0 + (-2.7) = 4.3
    expect(result.endMmol).toBeCloseTo(4.3, 1)
    expect(result.deltaMmol).toBeCloseTo(-2.7, 1)
  })

  it('hard aerobic with IOB amplifies drop', () => {
    const result = predictEndGlucose({
      ...baseInput,
      workoutType: 'aerobic',
      intensity: 7,
      durationMin: 60,
      iobUnits: 1.0,
    })
    // Combined effect (base aerobic drop + IOB amplification) should produce
    // an end-glucose well below the starting glucose.
    expect(result.endMmol).toBeLessThan(baseInput.startMmol)
    expect(result.deltaMmol).toBeLessThan(-3.0)
  })
})

describe('predictEndGlucose — anaerobic scenarios', () => {
  it('hard anaerobic raises glucose', () => {
    const result = predictEndGlucose({
      ...baseInput,
      workoutType: 'anaerobic',
      intensity: 8,
      durationMin: 30,
    })
    // base_rate(anaerobic, hard) = +0.040; 30 min × 0.040 = +1.2
    expect(result.deltaMmol).toBeGreaterThan(0.5)
  })
})

describe('predictEndGlucose — CGM trend contribution', () => {
  it('falling-fast arrow drops further', () => {
    const flat = predictEndGlucose({ ...baseInput })
    const falling = predictEndGlucose({ ...baseInput, trendArrow: 'doubleDown' })
    expect(falling.endMmol).toBeLessThan(flat.endMmol)
  })
  it('rising-fast arrow drops less', () => {
    const flat = predictEndGlucose({ ...baseInput })
    const rising = predictEndGlucose({ ...baseInput, trendArrow: 'doubleUp' })
    expect(rising.endMmol).toBeGreaterThan(flat.endMmol)
  })
})

describe('predictEndGlucose — recent carb contribution', () => {
  it('recent carbs offset some glucose drop', () => {
    const noCarbs = predictEndGlucose({ ...baseInput })
    const withCarbs = predictEndGlucose({
      ...baseInput,
      recentCarbs: { grams: 30, minutesAgo: 15 },
    })
    expect(withCarbs.endMmol).toBeGreaterThan(noCarbs.endMmol)
  })
  it('carbs older than 90 min contribute nothing', () => {
    const a = predictEndGlucose({ ...baseInput })
    const b = predictEndGlucose({ ...baseInput, recentCarbs: { grams: 30, minutesAgo: 120 } })
    expect(b.endMmol).toBeCloseTo(a.endMmol, 1)
  })
})

describe('predictEndGlucose — output shape', () => {
  it('returns endMmol, deltaMmol, and a non-empty breakdown', () => {
    const result = predictEndGlucose(baseInput)
    expect(typeof result.endMmol).toBe('number')
    expect(typeof result.deltaMmol).toBe('number')
    expect(Array.isArray(result.breakdown)).toBe(true)
    expect(result.breakdown.length).toBeGreaterThan(0)
  })
  it('breakdown items have label and delta', () => {
    const result = predictEndGlucose(baseInput)
    result.breakdown.forEach((item) => {
      expect(item.label).toBeTruthy()
      expect(typeof item.delta).toBe('number')
    })
  })
  it('clamps endMmol to [1.5, 30.0]', () => {
    const veryLow = predictEndGlucose({
      ...baseInput,
      startMmol: 3.0,
      workoutType: 'aerobic',
      intensity: 10,
      durationMin: 180,
      iobUnits: 5,
    })
    expect(veryLow.endMmol).toBeGreaterThanOrEqual(1.5)
  })
})

// ───────────────────────── PERSONALIZATION MULTIPLIERS ─────────────────────────

describe('Multiplier table exports', () => {
  it('SEX_IOB_MULTIPLIER has male=1.00 and female=1.10', () => {
    expect(SEX_IOB_MULTIPLIER.male).toBe(1.00)
    expect(SEX_IOB_MULTIPLIER.female).toBe(1.10)
  })
  it('CYCLE_IOB_MULTIPLIER values: follicular > midCycle = unknown > luteal', () => {
    expect(CYCLE_IOB_MULTIPLIER.follicular).toBe(1.15)
    expect(CYCLE_IOB_MULTIPLIER.midCycle).toBe(1.10)
    expect(CYCLE_IOB_MULTIPLIER.unknown).toBe(1.10)
    expect(CYCLE_IOB_MULTIPLIER.luteal).toBe(1.00)
  })
  it('TRAINING_BASE_MULTIPLIER decreases with fitness', () => {
    expect(TRAINING_BASE_MULTIPLIER.untrained).toBe(1.15)
    expect(TRAINING_BASE_MULTIPLIER.recreational).toBe(1.00)
    expect(TRAINING_BASE_MULTIPLIER.trained).toBe(0.85)
    expect(TRAINING_BASE_MULTIPLIER.highlyTrained).toBe(0.75)
  })
  it('FASTED_BASE_MULTIPLIER: fasted=1.10, fed=1.00', () => {
    expect(FASTED_BASE_MULTIPLIER.fasted).toBe(1.10)
    expect(FASTED_BASE_MULTIPLIER.fed).toBe(1.00)
  })
  it('FASTED_IOB_MULTIPLIER: fasted=0.90, fed=1.00', () => {
    expect(FASTED_IOB_MULTIPLIER.fasted).toBe(0.90)
    expect(FASTED_IOB_MULTIPLIER.fed).toBe(1.00)
  })
  it('INSULIN_ADJ_IOB_MULTIPLIER decreases as adjustment increases', () => {
    expect(INSULIN_ADJ_IOB_MULTIPLIER.none).toBe(1.00)
    expect(INSULIN_ADJ_IOB_MULTIPLIER.modest).toBe(0.85)
    expect(INSULIN_ADJ_IOB_MULTIPLIER.significant).toBe(0.70)
  })
})

// Helper for personalization tests — non-zero IOB so iob_contribution effects are visible
const personalizationInput = {
  startMmol: 7.0,
  trendArrow: 'flat',
  workoutType: 'aerobic',
  intensity: 5,
  durationMin: 45,
  iobUnits: 0.5,
  recentCarbs: { grams: 0, minutesAgo: 0 },
  bodyweightKg: 70,
  timeOfDay: 'midday',
}

describe('predictEndGlucose — Sex multiplier', () => {
  it('female produces a more amplified IOB drop than male (same inputs)', () => {
    const male   = predictEndGlucose({ ...personalizationInput, sex: 'male'   })
    const female = predictEndGlucose({ ...personalizationInput, sex: 'female' })
    expect(female.endMmol).toBeLessThan(male.endMmol)
  })
  it('omitting sex matches sex=male (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const male    = predictEndGlucose({ ...personalizationInput, sex: 'male' })
    expect(omitted.endMmol).toBeCloseTo(male.endMmol, 5)
  })
})

describe('predictEndGlucose — Cycle phase multiplier', () => {
  it('female + follicular drops more than female + luteal (same inputs)', () => {
    const follicular = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'follicular' })
    const luteal     = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'luteal'     })
    expect(follicular.endMmol).toBeLessThan(luteal.endMmol)
  })
  it('male + any cyclePhase value is ignored (no effect)', () => {
    const a = predictEndGlucose({ ...personalizationInput, sex: 'male', cyclePhase: 'follicular' })
    const b = predictEndGlucose({ ...personalizationInput, sex: 'male', cyclePhase: 'luteal'     })
    const c = predictEndGlucose({ ...personalizationInput, sex: 'male' })
    expect(a.endMmol).toBeCloseTo(c.endMmol, 5)
    expect(b.endMmol).toBeCloseTo(c.endMmol, 5)
  })
  it('female + unknown matches female + midCycle (safe midpoint default)', () => {
    const unknown  = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'unknown'  })
    const midCycle = predictEndGlucose({ ...personalizationInput, sex: 'female', cyclePhase: 'midCycle' })
    expect(unknown.endMmol).toBeCloseTo(midCycle.endMmol, 5)
  })
})

describe('predictEndGlucose — Training status multiplier', () => {
  it('highlyTrained produces a smaller drop than untrained (same workout)', () => {
    const highlyTrained = predictEndGlucose({ ...personalizationInput, trainingStatus: 'highlyTrained' })
    const untrained     = predictEndGlucose({ ...personalizationInput, trainingStatus: 'untrained'     })
    expect(highlyTrained.endMmol).toBeGreaterThan(untrained.endMmol)
  })
  it('omitting trainingStatus matches trainingStatus=recreational (backward compatibility)', () => {
    const omitted      = predictEndGlucose(personalizationInput)
    const recreational = predictEndGlucose({ ...personalizationInput, trainingStatus: 'recreational' })
    expect(omitted.endMmol).toBeCloseTo(recreational.endMmol, 5)
  })
})

describe('predictEndGlucose — Fasted/Fed multiplier', () => {
  it('fasted produces a larger drop than fed', () => {
    const fasted = predictEndGlucose({ ...personalizationInput, fastedFed: 'fasted' })
    const fed    = predictEndGlucose({ ...personalizationInput, fastedFed: 'fed'    })
    expect(fasted.endMmol).toBeLessThan(fed.endMmol)
  })
  it('omitting fastedFed matches fastedFed=fed (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const fed     = predictEndGlucose({ ...personalizationInput, fastedFed: 'fed' })
    expect(omitted.endMmol).toBeCloseTo(fed.endMmol, 5)
  })
})

describe('predictEndGlucose — Insulin adjustment multiplier', () => {
  it('significant reduction produces a smaller IOB-driven drop than none', () => {
    const significant = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'significant' })
    const none        = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'none'        })
    expect(significant.endMmol).toBeGreaterThan(none.endMmol)
  })
  it('omitting insulinAdjustment matches insulinAdjustment=none (backward compatibility)', () => {
    const omitted = predictEndGlucose(personalizationInput)
    const none    = predictEndGlucose({ ...personalizationInput, insulinAdjustment: 'none' })
    expect(omitted.endMmol).toBeCloseTo(none.endMmol, 5)
  })
})

describe('predictEndGlucose — Compound multiplier sanity', () => {
  it('best-case scenario (female + follicular + highlyTrained + fed + significant) produces a noticeably milder drop than worst-case (male + untrained + fasted + none)', () => {
    const bestCase = predictEndGlucose({
      ...personalizationInput,
      sex: 'female', cyclePhase: 'follicular',
      trainingStatus: 'highlyTrained',
      fastedFed: 'fed',
      insulinAdjustment: 'significant',
    })
    const worstCase = predictEndGlucose({
      ...personalizationInput,
      sex: 'male',
      trainingStatus: 'untrained',
      fastedFed: 'fasted',
      insulinAdjustment: 'none',
    })
    expect(bestCase.endMmol).toBeGreaterThan(worstCase.endMmol)
    expect(bestCase.endMmol - worstCase.endMmol).toBeGreaterThan(1.0)
  })
})
