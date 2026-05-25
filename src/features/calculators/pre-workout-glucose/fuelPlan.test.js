import { describe, it, expect } from 'vitest'
import { buildFuelPlan } from './fuelPlan'

function plan(overrides = {}) {
  return buildFuelPlan({
    startGlucoseMmol: 6.5,
    predictedEndMmol: 4.0,
    activityType: 'aerobic',
    durationMinutes: 45,
    bodyweightKg: 70,
    iobUnits: 0,
    ...overrides,
  })
}

describe('buildFuelPlan — return shape', () => {
  it('returns rescue, activityFuel, topUps, totalGrams + the existing fields', () => {
    const r = plan()
    expect(r).toHaveProperty('status')
    expect(r).toHaveProperty('rescue')
    expect(r).toHaveProperty('activityFuel')
    expect(r).toHaveProperty('topUps')
    expect(r).toHaveProperty('totalGrams')
    expect(r).toHaveProperty('predictedEndWithoutFuel')
    expect(r).toHaveProperty('predictedEndWithFuel')
    expect(r).toHaveProperty('iobNote')
    expect(r).toHaveProperty('warning')
    expect(r).not.toHaveProperty('preWorkout')
  })
})

describe('buildFuelPlan — safety branches', () => {
  it('BG < 5 → delay status, no rescue, no fuel, no top-ups', () => {
    const r = plan({ startGlucoseMmol: 4.5 })
    expect(r.status).toBe('delay')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.totalGrams).toBe(0)
    expect(r.warning).toContain("Don't start your workout yet")
  })

  it('BG > 15 → high-bg-warning status, no rescue, no fuel, no top-ups', () => {
    const r = plan({ startGlucoseMmol: 16.0 })
    expect(r.status).toBe('high-bg-warning')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.totalGrams).toBe(0)
    expect(r.warning).toContain('ketones')
  })

  it('BG exactly 5.0 → fuel status (boundary on safe side)', () => {
    const r = plan({ startGlucoseMmol: 5.0, predictedEndMmol: 3.5 })
    expect(r.status).toBe('fuel')
  })
})

describe('buildFuelPlan — rescue dose (BG < 6)', () => {
  it('BG 4.9, 70kg → ~10g rescue', () => {
    const r = plan({ startGlucoseMmol: 4.9, bodyweightKg: 70 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.rescue.grams).toBeLessThanOrEqual(15)
  })

  it('BG 4.9, 87kg → ~15g rescue (heavier user, scaled up)', () => {
    const r = plan({ startGlucoseMmol: 4.9, bodyweightKg: 87 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.rescue.grams).toBeLessThanOrEqual(20)
  })

  it('BG 5.5, 70kg → ~5g rescue (smaller gap)', () => {
    const r = plan({ startGlucoseMmol: 5.5, bodyweightKg: 70 })
    expect(r.rescue).not.toBeNull()
    expect(r.rescue.grams).toBe(5)
  })

  it('BG 6.0 → no rescue (boundary, healthy range)', () => {
    const r = plan({ startGlucoseMmol: 6.0 })
    expect(r.rescue).toBeNull()
  })

  it('BG 7.5 → no rescue (clearly healthy)', () => {
    const r = plan({ startGlucoseMmol: 7.5 })
    expect(r.rescue).toBeNull()
  })

  it('rescue carries a note mentioning recheck in 15 min', () => {
    const r = plan({ startGlucoseMmol: 4.9 })
    expect(r.rescue.note).toContain('15 min')
  })
})

describe('buildFuelPlan — activity fuel (aerobic)', () => {
  it('70kg, 20 min aerobic, predicted end at target → ~10g endurance baseline', () => {
    // predictedEnd 7.5 makes gap formula return 0, isolating endurance baseline
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, durationMinutes: 20, bodyweightKg: 70 })
    expect(r.activityFuel).not.toBeNull()
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(5)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(10)
  })

  it('70kg, 40 min aerobic, predicted end at target → ~15g endurance baseline', () => {
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, durationMinutes: 40, bodyweightKg: 70 })
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(10)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(20)
  })

  it('87kg, 40 min aerobic, predicted end at target → ~20g endurance baseline', () => {
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, durationMinutes: 40, bodyweightKg: 87 })
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(15)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(25)
  })

  it('70kg, 10 min aerobic, predicted end at target → 5g floor', () => {
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, durationMinutes: 10, bodyweightKg: 70 })
    expect(r.activityFuel).not.toBeNull()
    expect(r.activityFuel.grams).toBe(5)
  })

  it('activity fuel capped at 60g per single pre-workout dose', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 90, bodyweightKg: 100 })
    expect(r.activityFuel.grams).toBeLessThanOrEqual(60)
  })

  it('activity fuel has timingText "10-15 min before" (substring "before")', () => {
    const r = plan({ startGlucoseMmol: 7.0, durationMinutes: 40 })
    expect(r.activityFuel.timingText.toLowerCase()).toContain('before')
  })
})

describe('buildFuelPlan — activity fuel scales up when predicted end is below target (gap-aware)', () => {
  it('88kg, 30 min aerobic, predicted end 1.5 (e.g. high IOB) → ~40g to land at ~7.5', () => {
    // Reported scenario: BG 11.7, IOB 5.36u, predicted to crash to 1.5
    // Endurance baseline alone would give ~20g — not enough to recover.
    // Gap formula: 5 × (7.5 − 1.5) × (88/70) ≈ 37.7g → rounds to 40g.
    const r = plan({
      startGlucoseMmol: 11.7,
      predictedEndMmol: 1.5,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 88,
    })
    expect(r.activityFuel).not.toBeNull()
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(35)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(45)
  })

  it('normal scenario (no IOB, modest drop) still uses endurance baseline (not over-fueling)', () => {
    // 70kg, BG 7.0, predicted end 5.0 (modest 2 mmol/L drop from exercise alone)
    // Endurance: 0.4 × 70 × 0.5 = 14g → 15g
    // Gap: 5 × (7.5 − 5.0) × 1 = 12.5g → 15g
    // MAX = 15g (both formulas agree closely; doesn't blow up)
    const r = plan({
      startGlucoseMmol: 7.0,
      predictedEndMmol: 5.0,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(10)
    expect(r.activityFuel.grams).toBeLessThanOrEqual(20)
  })
})

describe('buildFuelPlan — split dose for large activity fuel amounts', () => {
  it('activity fuel > 25g splits into pre-workout + mid-workout', () => {
    const r = plan({
      startGlucoseMmol: 11.7,
      predictedEndMmol: 1.5,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 88,
    })
    expect(r.activityFuel.split).not.toBeNull()
    expect(r.activityFuel.split.preWorkoutGrams + r.activityFuel.split.midWorkoutGrams).toBe(r.activityFuel.grams)
    expect(r.activityFuel.split.midAtMinutes).toBeGreaterThan(0)
    expect(r.activityFuel.split.midAtMinutes).toBeLessThan(30)
  })

  it('activity fuel ≤ 25g does not split (single pre-workout dose)', () => {
    const r = plan({
      startGlucoseMmol: 7.0,
      predictedEndMmol: 5.0,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.activityFuel.split).toBeNull()
  })
})

describe('buildFuelPlan — activity fuel (mixed)', () => {
  it('mixed activityFuel is ~60% of aerobic at same duration/weight', () => {
    const aerobic = plan({ startGlucoseMmol: 7.0, durationMinutes: 60, activityType: 'aerobic', bodyweightKg: 70 })
    const mixed = plan({ startGlucoseMmol: 7.0, durationMinutes: 60, activityType: 'mixed', bodyweightKg: 70 })
    expect(mixed.activityFuel.grams).toBeLessThan(aerobic.activityFuel.grams)
    expect(mixed.activityFuel.grams).toBeGreaterThanOrEqual(15)
    expect(mixed.activityFuel.grams).toBeLessThanOrEqual(25)
  })

  it('mixed minimum dose floor is 5g for short sessions at target', () => {
    // predictedEnd 7.5 isolates the endurance floor from gap-aware top-up
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, durationMinutes: 15, activityType: 'mixed', bodyweightKg: 70 })
    expect(r.activityFuel.grams).toBe(5)
  })
})

describe('buildFuelPlan — anaerobic + strength', () => {
  it('anaerobic at healthy BG → no rescue, no activity fuel, no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.status).toBe('no-fuel')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
    expect(r.totalGrams).toBe(0)
  })

  it('anaerobic at low BG (5.0) → rescue only, no activity fuel', () => {
    const r = plan({ startGlucoseMmol: 5.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.status).toBe('fuel')
    expect(r.rescue).not.toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('strength at healthy BG → no rescue, no activity fuel, no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'strength', durationMinutes: 30 })
    expect(r.status).toBe('no-fuel')
    expect(r.rescue).toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('strength at low BG (5.0) → rescue only, no activity fuel', () => {
    const r = plan({ startGlucoseMmol: 5.0, activityType: 'strength', durationMinutes: 30 })
    expect(r.status).toBe('fuel')
    expect(r.rescue).not.toBeNull()
    expect(r.activityFuel).toBeNull()
  })

  it('anaerobic never gets mid-workout top-ups even at 90+ min', () => {
    const r = plan({ activityType: 'anaerobic', durationMinutes: 120, startGlucoseMmol: 7.0 })
    expect(r.topUps).toEqual([])
  })
})

describe('buildFuelPlan — top-ups', () => {
  it('60 min aerobic → 0 top-ups (boundary)', () => {
    const r = plan({ durationMinutes: 60, activityType: 'aerobic' })
    expect(r.topUps).toEqual([])
  })

  it('90 min aerobic → 1 top-up at 30 min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(1)
    expect(r.topUps[0].atMinutes).toBe(30)
  })

  it('120 min aerobic → 2 top-ups at 30 + 60 min', () => {
    const r = plan({ durationMinutes: 120, activityType: 'aerobic' })
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60])
  })

  it('150 min aerobic → 3 top-ups at 30, 60, 90 min', () => {
    const r = plan({ durationMinutes: 150, activityType: 'aerobic' })
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60, 90])
  })

  it('mixed sessions also get top-ups for > 60 min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'mixed' })
    expect(r.topUps.length).toBe(1)
  })
})

describe('buildFuelPlan — totalGrams', () => {
  it('totalGrams = rescue + activityFuel + sum of top-ups', () => {
    const r = plan({ startGlucoseMmol: 4.9, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    const expected = (r.rescue?.grams || 0) + (r.activityFuel?.grams || 0) + r.topUps.reduce((s, t) => s + t.grams, 0)
    expect(r.totalGrams).toBe(expected)
  })

  it('totalGrams is 0 for no-fuel status', () => {
    const r = plan({ startGlucoseMmol: 7.0, activityType: 'anaerobic', durationMinutes: 30 })
    expect(r.totalGrams).toBe(0)
  })

  it('totalGrams covers a complete worked example (BG 4.9, aerobic 40 min, 87kg)', () => {
    const r = plan({ startGlucoseMmol: 4.9, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    expect(r.rescue.grams).toBeGreaterThanOrEqual(10)
    expect(r.activityFuel.grams).toBeGreaterThanOrEqual(20)
    expect(r.totalGrams).toBe(r.rescue.grams + r.activityFuel.grams)
  })
})

describe('buildFuelPlan — predictedEnd projection', () => {
  it('predictedEndWithFuel matches predictedEndWithoutFuel when no fuel recommended', () => {
    const r = plan({ startGlucoseMmol: 7.5, predictedEndMmol: 7.5, activityType: 'aerobic', durationMinutes: 30, bodyweightKg: 70 })
    if (r.status === 'no-fuel') {
      expect(r.predictedEndWithFuel).toBe(r.predictedEndWithoutFuel)
    }
  })

  it('predictedEndWithFuel is higher than predictedEndWithoutFuel when fuel was recommended', () => {
    const r = plan({ startGlucoseMmol: 4.9, predictedEndMmol: 2.3, durationMinutes: 40, activityType: 'aerobic', bodyweightKg: 87 })
    expect(r.predictedEndWithFuel).toBeGreaterThan(r.predictedEndWithoutFuel)
  })
})

describe('buildFuelPlan — IOB note', () => {
  it('iobNote present when iobUnits > 0', () => {
    const r = plan({ iobUnits: 1.5 })
    expect(r.iobNote).toContain('1.5')
  })

  it('iobNote is null when iobUnits is 0', () => {
    const r = plan({ iobUnits: 0 })
    expect(r.iobNote).toBeNull()
  })
})
