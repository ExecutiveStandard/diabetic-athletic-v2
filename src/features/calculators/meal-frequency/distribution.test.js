import { describe, it, expect } from 'vitest'
import { distributeTrainingDay, distributeRestDay, caloriesFromMacros } from './distribution'

describe('caloriesFromMacros', () => {
  it('25g P, 32.5g C, 7.5g F = 297.5 cal', () => {
    expect(caloriesFromMacros({ protein: 25, carbs: 32.5, fat: 7.5 })).toBeCloseTo(297.5, 1)
  })
  it('25g P, 17.5g C, 42.5g F = 552.5 cal', () => {
    expect(caloriesFromMacros({ protein: 25, carbs: 17.5, fat: 42.5 })).toBeCloseTo(552.5, 1)
  })
})

describe('distributeTrainingDay — matches Nicholas master sheet example', () => {
  // 1700 cal / 100g P / 100g C / 100g F / 30g fiber, N=4, weights 0.65 / 0.15
  const input = {
    protein: 100, carbs: 100, fat: 100, fiber: 30,
    N: 4, carbWeight: 0.65, fatWeight: 0.15,
  }

  it('produces peri and regular macro buckets matching the sheet', () => {
    const r = distributeTrainingDay(input)
    expect(r.peri.protein).toBeCloseTo(25, 1)
    expect(r.peri.carbs).toBeCloseTo(32.5, 1)
    expect(r.peri.fat).toBeCloseTo(7.5, 1)
    expect(r.peri.fiber).toBeCloseTo(7.5, 1)
    expect(r.peri.calories).toBeCloseTo(297.5, 1)

    expect(r.regular.protein).toBeCloseTo(25, 1)
    expect(r.regular.carbs).toBeCloseTo(17.5, 1)
    expect(r.regular.fat).toBeCloseTo(42.5, 1)
    expect(r.regular.fiber).toBeCloseTo(7.5, 1)
    expect(r.regular.calories).toBeCloseTo(552.5, 1)
  })

  it('preserves daily totals across 2 peri + 2 regular meals', () => {
    const r = distributeTrainingDay(input)
    const totalP = 2 * r.peri.protein + 2 * r.regular.protein
    const totalC = 2 * r.peri.carbs + 2 * r.regular.carbs
    const totalF = 2 * r.peri.fat + 2 * r.regular.fat
    const totalFib = 2 * r.peri.fiber + 2 * r.regular.fiber
    expect(totalP).toBeCloseTo(100, 1)
    expect(totalC).toBeCloseTo(100, 1)
    expect(totalF).toBeCloseTo(100, 1)
    expect(totalFib).toBeCloseTo(30, 1)
  })
})

describe('distributeTrainingDay — N=5', () => {
  it('preserves daily totals with 2 peri + 3 regulars', () => {
    const r = distributeTrainingDay({
      protein: 150, carbs: 200, fat: 80, fiber: 35,
      N: 5, carbWeight: 0.65, fatWeight: 0.15,
    })
    const totalP = 2 * r.peri.protein + 3 * r.regular.protein
    const totalC = 2 * r.peri.carbs + 3 * r.regular.carbs
    const totalF = 2 * r.peri.fat + 3 * r.regular.fat
    expect(totalP).toBeCloseTo(150, 1)
    expect(totalC).toBeCloseTo(200, 1)
    expect(totalF).toBeCloseTo(80, 1)
  })
})

describe('distributeRestDay — matches Nicholas master sheet example', () => {
  // 1700 cal / 100g P / 100g C / 100g F / 30g fiber, N=3
  it('N=3 → each meal = 33.3g of every macro and 566.67 cal', () => {
    const r = distributeRestDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30, N: 3,
    })
    expect(r.protein).toBeCloseTo(33.33, 1)
    expect(r.carbs).toBeCloseTo(33.33, 1)
    expect(r.fat).toBeCloseTo(33.33, 1)
    expect(r.fiber).toBeCloseTo(10, 1)
    expect(r.calories).toBeCloseTo(566.67, 1)
  })
})

describe('distributeTrainingDay — extreme weights', () => {
  it('carbWeight=0.5 → peri and regulars get equal carb amounts at N=4', () => {
    const r = distributeTrainingDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30,
      N: 4, carbWeight: 0.5, fatWeight: 0.5,
    })
    expect(r.peri.carbs).toBeCloseTo(r.regular.carbs, 1)
    expect(r.peri.fat).toBeCloseTo(r.regular.fat, 1)
  })
  it('fatWeight=0 → peri meals have zero fat', () => {
    const r = distributeTrainingDay({
      protein: 100, carbs: 100, fat: 100, fiber: 30,
      N: 4, carbWeight: 0.65, fatWeight: 0,
    })
    expect(r.peri.fat).toBe(0)
  })
})
