import { describe, it, expect } from 'vitest'
import { defaultMealCount, suggestMealCount, DEFAULTS } from './mealCount'

describe('DEFAULTS', () => {
  it('training default is 4', () => {
    expect(DEFAULTS.training).toBe(4)
  })
  it('rest default is 3', () => {
    expect(DEFAULTS.rest).toBe(3)
  })
})

describe('defaultMealCount', () => {
  it('training day → 4', () => {
    expect(defaultMealCount('training')).toBe(4)
  })
  it('rest day → 3', () => {
    expect(defaultMealCount('rest')).toBe(3)
  })
})

describe('suggestMealCount — training day', () => {
  it('low carbs (100g) at default N=4 → no bump needed', () => {
    // Regular meal carbs at N=4, 0.65 weight: 0.35 × 100 / 2 = 17.5g (≤45g)
    expect(suggestMealCount({ dayType: 'training', dailyCarbs: 100, carbWeight: 0.65 })).toEqual({
      N: 4, reason: 'default', peri: 32.5, regular: 17.5,
    })
  })
  it('moderate carbs (200g) at default N=4 → no bump needed', () => {
    // Regular: 0.35 × 200 / 2 = 35g (≤45g). Peri: 0.65 × 200 / 2 = 65g (over 45 but THIS is the peri-weight problem)
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 200, carbWeight: 0.65 })
    expect(r.peri).toBeCloseTo(65, 1)
    expect(r.regular).toBeCloseTo(35, 1)
    expect(r.peri).toBeGreaterThan(45)
    expect(r.suggestReducePeriWeight).toBe(true)
  })
  it('high carbs (300g) at N=4 → suggest bump for regulars', () => {
    // Regular at N=4: 0.35 × 300 / 2 = 52.5g (over 45)
    // Bump to N=5: 0.35 × 300 / 3 = 35g (ok)
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 300, carbWeight: 0.65 })
    expect(r.N).toBeGreaterThanOrEqual(5)
    expect(r.regular).toBeLessThanOrEqual(45)
  })
  it('caps suggestion at N=7 even if math wants higher', () => {
    const r = suggestMealCount({ dayType: 'training', dailyCarbs: 1000, carbWeight: 0.65 })
    expect(r.N).toBeLessThanOrEqual(7)
  })
})

describe('suggestMealCount — rest day', () => {
  it('low carbs (100g) at default N=3 → no bump', () => {
    // 100 / 3 = 33.3g (≤45g)
    const r = suggestMealCount({ dayType: 'rest', dailyCarbs: 100 })
    expect(r.N).toBe(3)
    expect(r.perMeal).toBeCloseTo(33.3, 1)
  })
  it('high carbs (200g) at N=3 → suggest bump', () => {
    // 200 / 3 = 66.7g (over 45)
    // Bump to N=5: 200/5 = 40g (ok)
    const r = suggestMealCount({ dayType: 'rest', dailyCarbs: 200 })
    expect(r.N).toBeGreaterThanOrEqual(5)
    expect(r.perMeal).toBeLessThanOrEqual(45)
  })
})
