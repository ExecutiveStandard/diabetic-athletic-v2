import { describe, it, expect } from 'vitest'
import { bandFor, BANDS } from './riskBands'

describe('bandFor (mmol/L input)', () => {
  it('returns severe-hypo for glucose < 3.3', () => {
    expect(bandFor(3.0).id).toBe('severe-hypo')
  })
  it('returns hypo-risk for 3.3–4.5', () => {
    expect(bandFor(4.0).id).toBe('hypo-risk')
  })
  it('returns ideal for 4.5–9.0', () => {
    expect(bandFor(6.0).id).toBe('ideal')
  })
  it('returns acceptable-hyper for 9.0–13.9', () => {
    expect(bandFor(11.0).id).toBe('acceptable-hyper')
  })
  it('returns hyper-risk for 13.9–16.7', () => {
    expect(bandFor(15.0).id).toBe('hyper-risk')
  })
  it('returns ketone-danger for > 16.7', () => {
    expect(bandFor(18.0).id).toBe('ketone-danger')
  })
  it('boundary: 3.3 is hypo-risk (not severe-hypo)', () => {
    expect(bandFor(3.3).id).toBe('hypo-risk')
  })
  it('boundary: 4.5 is ideal', () => {
    expect(bandFor(4.5).id).toBe('ideal')
  })
})

describe('BANDS', () => {
  it('exports all 6 bands', () => {
    expect(Object.keys(BANDS).length).toBe(6)
  })
  it('each band has a color and action', () => {
    Object.values(BANDS).forEach((band) => {
      expect(band.color).toBeTruthy()
      expect(band.action).toBeTruthy()
    })
  })
})
