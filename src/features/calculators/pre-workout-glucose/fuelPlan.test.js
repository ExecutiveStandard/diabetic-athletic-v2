import { describe, it, expect } from 'vitest'
import { buildFuelPlan } from './fuelPlan'

// Helper for shorter test calls
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

describe('buildFuelPlan — safety branches', () => {
  it('returns status=delay when starting BG < 5 mmol/L', () => {
    const r = plan({ startGlucoseMmol: 4.5 })
    expect(r.status).toBe('delay')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.warning).toContain("Don't start your workout yet")
  })

  it('returns status=high-bg-warning when starting BG > 15 mmol/L', () => {
    const r = plan({ startGlucoseMmol: 16.0 })
    expect(r.status).toBe('high-bg-warning')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
    expect(r.warning).toContain('ketones')
  })

  it('BG exactly 5.0 → fuel status (boundary inclusive on safe side)', () => {
    const r = plan({ startGlucoseMmol: 5.0, predictedEndMmol: 3.5 })
    expect(r.status).toBe('fuel')
  })

  it('BG exactly 15.0 → fuel/no-fuel status (boundary inclusive on safe side)', () => {
    const r = plan({ startGlucoseMmol: 15.0, predictedEndMmol: 12.0 })
    expect(r.status).not.toBe('high-bg-warning')
  })
})

describe('buildFuelPlan — aerobic, no top-ups (≤60 min)', () => {
  it('70kg, BG 6.5, predicted end 4.0, 45min aerobic → ~18-20g pre-workout', () => {
    const r = plan({
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout).not.toBeNull()
    expect(r.preWorkout.grams).toBeGreaterThanOrEqual(15)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(20)
    expect(r.topUps).toEqual([])
  })

  it('70kg, BG 5.0, predicted end 3.0, 30min aerobic → ~12g pre-workout', () => {
    const r = plan({
      startGlucoseMmol: 5.0,
      predictedEndMmol: 3.0,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout.grams).toBeGreaterThanOrEqual(10)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(15)
  })

  it('70kg, BG 7.5, predicted end 7.5, 30min aerobic → no fuel needed (in target range)', () => {
    const r = plan({
      startGlucoseMmol: 7.5,
      predictedEndMmol: 7.5,
      activityType: 'aerobic',
      durationMinutes: 30,
      bodyweightKg: 70,
    })
    expect(r.status).toBe('no-fuel')
    expect(r.preWorkout).toBeNull()
  })
})

describe('buildFuelPlan — aerobic, with top-ups (>60 min)', () => {
  it('90min aerobic → 1 top-up at 30min', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic' })
    expect(r.status).toBe('fuel')
    expect(r.topUps.length).toBe(1)
    expect(r.topUps[0].atMinutes).toBe(30)
  })

  it('120min aerobic → 2 top-ups at 30 and 60min', () => {
    const r = plan({ durationMinutes: 120, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(2)
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60])
  })

  it('150min aerobic → 3 top-ups at 30, 60, 90min', () => {
    const r = plan({ durationMinutes: 150, activityType: 'aerobic' })
    expect(r.topUps.length).toBe(3)
    expect(r.topUps.map((t) => t.atMinutes)).toEqual([30, 60, 90])
  })

  it('60min aerobic → 0 top-ups (boundary)', () => {
    const r = plan({ durationMinutes: 60, activityType: 'aerobic' })
    expect(r.topUps).toEqual([])
  })

  it('top-up grams scale with bodyweight: 70kg → ~20g per top-up', () => {
    const r = plan({ durationMinutes: 90, activityType: 'aerobic', bodyweightKg: 70 })
    expect(r.topUps[0].grams).toBeGreaterThanOrEqual(15)
    expect(r.topUps[0].grams).toBeLessThanOrEqual(25)
  })
})

describe('buildFuelPlan — anaerobic', () => {
  it('BG ≥ 6 mmol/L → no-fuel status, no top-ups', () => {
    const r = plan({
      startGlucoseMmol: 7.0,
      predictedEndMmol: 6.5,
      activityType: 'anaerobic',
      durationMinutes: 30,
    })
    expect(r.status).toBe('no-fuel')
    expect(r.preWorkout).toBeNull()
    expect(r.topUps).toEqual([])
  })

  it('BG < 6 mmol/L → fuel status with protective top-up to bring BG to ~6', () => {
    const r = plan({
      startGlucoseMmol: 5.0,
      predictedEndMmol: 4.5,
      activityType: 'anaerobic',
      durationMinutes: 30,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout).not.toBeNull()
    expect(r.preWorkout.grams).toBeGreaterThan(0)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(15)
  })

  it('anaerobic never gets mid-workout top-ups even at 90+ min', () => {
    const r = plan({
      activityType: 'anaerobic',
      durationMinutes: 120,
      startGlucoseMmol: 7.0,
    })
    expect(r.topUps).toEqual([])
  })
})

describe('buildFuelPlan — strength', () => {
  it('strength never gets mid-workout top-ups even at 90+ min', () => {
    const r = plan({
      activityType: 'strength',
      durationMinutes: 120,
      startGlucoseMmol: 7.0,
      predictedEndMmol: 6.5,
    })
    expect(r.topUps).toEqual([])
  })

  it('strength at low BG (<6) → protective top-up to bring BG to ~6', () => {
    const r = plan({
      startGlucoseMmol: 5.0,
      predictedEndMmol: 4.5,
      activityType: 'strength',
      durationMinutes: 30,
    })
    expect(r.status).toBe('fuel')
    expect(r.preWorkout).not.toBeNull()
    expect(r.preWorkout.grams).toBeGreaterThan(0)
    expect(r.preWorkout.grams).toBeLessThanOrEqual(15)
  })
})

describe('buildFuelPlan — mixed', () => {
  it('mixed dose is ~60% of equivalent aerobic dose', () => {
    const inputs = {
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
      durationMinutes: 60,
      bodyweightKg: 70,
    }
    const aerobic = plan({ ...inputs, activityType: 'aerobic' })
    const mixed = plan({ ...inputs, activityType: 'mixed' })
    expect(mixed.preWorkout.grams).toBeLessThan(aerobic.preWorkout.grams)
    expect(mixed.preWorkout.grams).toBeGreaterThanOrEqual(
      Math.round(aerobic.preWorkout.grams * 0.5 / 5) * 5,
    )
  })

  it('mixed sessions DO get mid-workout top-ups for sessions > 60 min', () => {
    const r = plan({
      activityType: 'mixed',
      durationMinutes: 90,
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
    })
    expect(r.topUps.length).toBe(1)
  })
})

describe('buildFuelPlan — bodyweight scaling', () => {
  it('50kg user needs less fuel than 70kg for same prediction', () => {
    const inputs = {
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    }
    const lighter = plan({ ...inputs, bodyweightKg: 50 })
    const ref = plan({ ...inputs, bodyweightKg: 70 })
    expect(lighter.preWorkout.grams).toBeLessThanOrEqual(ref.preWorkout.grams)
  })

  it('100kg user needs more fuel than 70kg for same prediction', () => {
    const inputs = {
      startGlucoseMmol: 6.5,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    }
    const heavier = plan({ ...inputs, bodyweightKg: 100 })
    const ref = plan({ ...inputs, bodyweightKg: 70 })
    expect(heavier.preWorkout.grams).toBeGreaterThanOrEqual(ref.preWorkout.grams)
  })
})

describe('buildFuelPlan — predictedEnd projection', () => {
  it('predictedEndWithoutFuel matches the input', () => {
    const r = plan({ predictedEndMmol: 4.0 })
    expect(r.predictedEndWithoutFuel).toBe(4.0)
  })

  it('predictedEndWithFuel is higher than predictedEndWithoutFuel when fuel is recommended', () => {
    const r = plan({
      startGlucoseMmol: 6.0,
      predictedEndMmol: 4.0,
      activityType: 'aerobic',
      durationMinutes: 45,
    })
    expect(r.predictedEndWithFuel).toBeGreaterThan(r.predictedEndWithoutFuel)
  })

  it('predictedEndWithFuel equals predictedEndWithoutFuel when no fuel is recommended', () => {
    const r = plan({
      startGlucoseMmol: 7.5,
      predictedEndMmol: 7.5,
      activityType: 'aerobic',
      durationMinutes: 30,
    })
    expect(r.predictedEndWithFuel).toBe(r.predictedEndWithoutFuel)
  })
})

describe('buildFuelPlan — IOB note', () => {
  it('returns iobNote when iobUnits > 0', () => {
    const r = plan({ iobUnits: 1.5 })
    expect(r.iobNote).toContain('1.5')
    expect(r.iobNote).toContain('active insulin')
  })

  it('iobNote is null when iobUnits is 0', () => {
    const r = plan({ iobUnits: 0 })
    expect(r.iobNote).toBeNull()
  })
})
