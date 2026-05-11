import { describe, it, expect } from 'vitest'
import { gramsNeeded } from './carbRecommendation'

describe('gramsNeeded', () => {
  it('returns 0 when predicted is already at or above 4.5 mmol/L', () => {
    expect(gramsNeeded(5.0, 70)).toBe(0)
    expect(gramsNeeded(4.5, 70)).toBe(0)
  })
  it('recommends carbs for hypo-risk prediction (4.0 mmol/L, 70kg)', () => {
    // target = 5.5; gap = 1.5 mmol/L; 1.5 × 5 × (70/70) = 7.5 → clamped to 10
    expect(gramsNeeded(4.0, 70)).toBe(10)
  })
  it('recommends more carbs for lower prediction (3.0 mmol/L, 70kg)', () => {
    // target = 5.5; gap = 2.5; 2.5 × 5 × 1 = 12.5 → rounded to 15
    expect(gramsNeeded(3.0, 70)).toBe(15)
  })
  it('scales with body weight (3.0 mmol/L, 100kg)', () => {
    // gap = 2.5; 2.5 × 5 × (100/70) = 17.86 → round to 20
    expect(gramsNeeded(3.0, 100)).toBe(20)
  })
  it('clamps minimum to 10g', () => {
    expect(gramsNeeded(4.4, 70)).toBeGreaterThanOrEqual(10)
  })
  it('clamps maximum to 60g', () => {
    expect(gramsNeeded(1.0, 120)).toBeLessThanOrEqual(60)
  })
})
