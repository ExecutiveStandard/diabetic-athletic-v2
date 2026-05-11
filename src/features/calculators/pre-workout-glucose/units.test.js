import { describe, it, expect } from 'vitest'
import { mmolToMgdl, mgdlToMmol, formatGlucose } from './units'

describe('mmolToMgdl', () => {
  it('converts 5.5 mmol/L to 99 mg/dL', () => {
    expect(mmolToMgdl(5.5)).toBe(99)
  })
  it('converts 10.0 mmol/L to 180 mg/dL', () => {
    expect(mmolToMgdl(10.0)).toBe(180)
  })
  it('rounds to nearest integer', () => {
    expect(mmolToMgdl(7.1)).toBe(128)
  })
})

describe('mgdlToMmol', () => {
  it('converts 100 mg/dL to 5.6 mmol/L', () => {
    expect(mgdlToMmol(100)).toBeCloseTo(5.6, 1)
  })
  it('converts 180 mg/dL to 10.0 mmol/L', () => {
    expect(mgdlToMmol(180)).toBeCloseTo(10.0, 1)
  })
})

describe('formatGlucose', () => {
  it('formats mmol/L to 1 decimal', () => {
    expect(formatGlucose(5.55, 'mmol')).toBe('5.6')
  })
  it('formats mg/dL as integer', () => {
    expect(formatGlucose(99.7, 'mgdl')).toBe('100')
  })
})
