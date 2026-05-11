import { describe, it, expect } from 'vitest'
import { predictEndGlucose } from './prediction'

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
