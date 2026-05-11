import { describe, it, expect } from 'vitest'
import { computeIob, DIA_MINUTES } from './iobDecay'

describe('DIA_MINUTES', () => {
  it('rapid is 240 min', () => {
    expect(DIA_MINUTES.rapid).toBe(240)
  })
  it('ultra is 210 min', () => {
    expect(DIA_MINUTES.ultra).toBe(210)
  })
})

describe('computeIob', () => {
  it('returns full bolus at 0 minutes elapsed', () => {
    expect(computeIob(5, 0, 'rapid')).toBe(5)
  })
  it('returns 0 when elapsed >= DIA (rapid, 240+ min)', () => {
    expect(computeIob(5, 240, 'rapid')).toBe(0)
    expect(computeIob(5, 300, 'rapid')).toBe(0)
  })
  it('returns half at half DIA (rapid, 120 min)', () => {
    expect(computeIob(5, 120, 'rapid')).toBeCloseTo(2.5, 2)
  })
  it('returns 25% at 75% DIA (rapid, 180 min)', () => {
    expect(computeIob(5, 180, 'rapid')).toBeCloseTo(1.25, 2)
  })
  it('uses ultra-rapid DIA when type=ultra', () => {
    // 105 min = 50% of 210 → half remaining
    expect(computeIob(4, 105, 'ultra')).toBeCloseTo(2.0, 2)
  })
  it('clamps negative elapsed to 0', () => {
    expect(computeIob(5, -30, 'rapid')).toBe(5)
  })
})
