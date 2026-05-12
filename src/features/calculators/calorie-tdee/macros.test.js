import { describe, it, expect } from 'vitest'
import {
  computeMacros,
  MACRO_DEFAULTS,
  FIBER_DEFAULT_G,
  SLIDER_RANGES,
} from './macros'

describe('MACRO_DEFAULTS', () => {
  it('has entries for all 3 goal IDs (loss, maintain, gain)', () => {
    expect(MACRO_DEFAULTS.loss).toEqual({ proteinPerKg: 1.8, fatPercent: 0.20 })
    expect(MACRO_DEFAULTS.maintain).toEqual({ proteinPerKg: 1.6, fatPercent: 0.25 })
    expect(MACRO_DEFAULTS.gain).toEqual({ proteinPerKg: 1.6, fatPercent: 0.25 })
  })
})

describe('FIBER_DEFAULT_G', () => {
  it('is 30 (Phil Graham / SCAN 2015 minimum)', () => {
    expect(FIBER_DEFAULT_G).toBe(30)
  })
})

describe('SLIDER_RANGES', () => {
  it('protein range is 1.2–2.5 g/kg with 0.1 step', () => {
    expect(SLIDER_RANGES.protein).toEqual({ min: 1.2, max: 2.5, step: 0.1 })
  })
  it('fat range is 15-35% with 1% step (stored as decimals)', () => {
    expect(SLIDER_RANGES.fat).toEqual({ min: 0.15, max: 0.35, step: 0.01 })
  })
  it('fiber range is 30-40g with 1g step', () => {
    expect(SLIDER_RANGES.fiber).toEqual({ min: 30, max: 40, step: 1 })
  })
})

describe('computeMacros — worked example (75kg male, fat loss, 2082 goalCal)', () => {
  const result = computeMacros({
    goalCalories: 2082,
    bodyweightKg: 75,
    proteinPerKg: 1.8,
    fatPercent: 0.20,
    fiberGrams: 30,
  })

  it('protein = 1.8 × 75 = 135g', () => {
    expect(result.protein).toBeCloseTo(135, 0)
  })
  it('fat = (0.20 × 2082) / 9 ≈ 46g', () => {
    expect(result.fat).toBeCloseTo(46, 0)
  })
  it('carbs = (2082 − 540 − 416) / 4 ≈ 282g', () => {
    expect(result.carbs).toBeCloseTo(281.4, 1)
  })
  it('fiber pass-through = 30g', () => {
    expect(result.fiber).toBe(30)
  })
  it('proteinCal = 540 kcal (135 × 4)', () => {
    expect(result.proteinCal).toBeCloseTo(540, 0)
  })
  it('fatCal = 416 kcal (46.3 × 9)', () => {
    expect(result.fatCal).toBeCloseTo(416, 0)
  })
  it('carbsCal = 1126 kcal (≈ 281.6 × 4)', () => {
    expect(result.carbsCal).toBeCloseTo(1126, 0)
  })
  it('percentages sum to ~100%', () => {
    const total = result.proteinPercent + result.fatPercent + result.carbsPercent
    expect(total).toBeCloseTo(100, 0)
  })
  it('carbsClampedToZero is false in normal case', () => {
    expect(result.carbsClampedToZero).toBe(false)
  })
})

describe('computeMacros — adjusted protein g/kg', () => {
  it('respects slider-adjusted proteinPerKg', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 80,
      proteinPerKg: 2.2,
      fatPercent: 0.25,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(176, 0)  // 2.2 × 80
  })
})

describe('computeMacros — adjusted fat %', () => {
  it('respects slider-adjusted fatPercent', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 70,
      proteinPerKg: 1.6,
      fatPercent: 0.35,
      fiberGrams: 30,
    })
    expect(r.fat).toBeCloseTo(78, 0)  // (0.35 × 2000) / 9 ≈ 77.8
  })
})

describe('computeMacros — guard rail (protein + fat exceed calories)', () => {
  it('clamps carbs to 0 and sets carbsClampedToZero flag', () => {
    // Pathological inputs: very high protein at very low cals
    const r = computeMacros({
      goalCalories: 800,
      bodyweightKg: 100,
      proteinPerKg: 2.5,   // 250g protein = 1000 kcal — already exceeds 800
      fatPercent: 0.30,
      fiberGrams: 30,
    })
    expect(r.carbs).toBe(0)
    expect(r.carbsClampedToZero).toBe(true)
  })
})

describe('computeMacros — boundary slider values', () => {
  it('lowest valid: protein 1.2 g/kg + fat 15%', () => {
    const r = computeMacros({
      goalCalories: 2000,
      bodyweightKg: 70,
      proteinPerKg: 1.2,
      fatPercent: 0.15,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(84, 0)
    expect(r.fat).toBeCloseTo(33, 0)
    expect(r.carbsClampedToZero).toBe(false)
  })
  it('highest valid: protein 2.5 g/kg + fat 35%', () => {
    const r = computeMacros({
      goalCalories: 2500,
      bodyweightKg: 75,
      proteinPerKg: 2.5,
      fatPercent: 0.35,
      fiberGrams: 30,
    })
    expect(r.protein).toBeCloseTo(187.5, 0)
    expect(r.fat).toBeCloseTo(97, 0)
    expect(r.carbsClampedToZero).toBe(false)
  })
})
