import { describe, it, expect } from 'vitest'
import { buildDayPlan } from './planner'

const sheetExample = {
  calories: 1700, protein: 100, carbs: 100, fat: 100, fiber: 30,
  N: 4, carbWeight: 0.65, fatWeight: 0.15,
}

describe('buildDayPlan — non-training (rest) day', () => {
  it('N=3 rest day matches sheet (566.67 cal × 3)', () => {
    const { meals } = buildDayPlan({ ...sheetExample, N: 3, dayType: 'rest' })
    expect(meals.length).toBe(3)
    meals.forEach((m) => {
      expect(m.calories).toBeCloseTo(566.67, 1)
      expect(m.protein).toBeCloseTo(33.33, 1)
      expect(m.carbs).toBeCloseTo(33.33, 1)
      expect(m.fat).toBeCloseTo(33.33, 1)
      expect(m.fiber).toBeCloseTo(10, 1)
      expect(m.role).toBe('regular')
    })
  })
  it('assigns chronological labels for rest day', () => {
    const { meals } = buildDayPlan({ ...sheetExample, N: 3, dayType: 'rest' })
    expect(meals[0].name).toBe('Breakfast')
    expect(meals[1].name).toBe('Lunch')
    expect(meals[2].name).toBe('Dinner')
  })
})

describe('buildDayPlan — training day matches sheet (N=4, evening)', () => {
  const input = { ...sheetExample, dayType: 'training', trainingTime: 'evening' }

  it('produces 4 meals in correct order', () => {
    const { meals } = buildDayPlan(input)
    expect(meals.length).toBe(4)
    expect(meals[0].name).toBe('Breakfast')
    expect(meals[1].name).toBe('Lunch')
    expect(meals[2].name).toBe('Pre-Workout')
    expect(meals[3].name).toBe('Post-Workout')
  })

  it('Pre-Workout meal macros match sheet (297.5 cal / 25P / 32.5C / 7.5F / 7.5fib)', () => {
    const { meals } = buildDayPlan(input)
    const pre = meals[2]
    expect(pre.calories).toBeCloseTo(297.5, 1)
    expect(pre.protein).toBeCloseTo(25, 1)
    expect(pre.carbs).toBeCloseTo(32.5, 1)
    expect(pre.fat).toBeCloseTo(7.5, 1)
    expect(pre.fiber).toBeCloseTo(7.5, 1)
    expect(pre.role).toBe('peri')
    expect(pre.carbsType).toBe('simple')
  })

  it('Post-Workout meal macros match sheet (297.5 cal / 25P / 32.5C / 7.5F)', () => {
    const { meals } = buildDayPlan(input)
    const post = meals[3]
    expect(post.calories).toBeCloseTo(297.5, 1)
    expect(post.carbs).toBeCloseTo(32.5, 1)
    expect(post.role).toBe('peri')
    expect(post.carbsType).toBe('complex')
  })

  it('Regular meals match sheet (552.5 cal / 25P / 17.5C / 42.5F)', () => {
    const { meals } = buildDayPlan(input)
    const reg1 = meals[0]
    const reg2 = meals[1]
    for (const r of [reg1, reg2]) {
      expect(r.calories).toBeCloseTo(552.5, 1)
      expect(r.carbs).toBeCloseTo(17.5, 1)
      expect(r.fat).toBeCloseTo(42.5, 1)
      expect(r.role).toBe('regular')
      expect(r.carbsType).toBe('mixed')
    }
  })

  it('daily totals match sheet exactly', () => {
    const { meals } = buildDayPlan(input)
    const sum = (k) => meals.reduce((s, m) => s + m[k], 0)
    expect(sum('calories')).toBeCloseTo(1700, 1)
    expect(sum('protein')).toBeCloseTo(100, 1)
    expect(sum('carbs')).toBeCloseTo(100, 1)
    expect(sum('fat')).toBeCloseTo(100, 1)
    expect(sum('fiber')).toBeCloseTo(30, 1)
  })
})

describe('buildDayPlan — slot ordering by training time', () => {
  it('morning training places Pre/Post first', () => {
    const { meals } = buildDayPlan({ ...sheetExample, dayType: 'training', trainingTime: 'morning' })
    expect(meals[0].name).toBe('Pre-Workout')
    expect(meals[1].name).toBe('Post-Workout')
  })
  it('afternoon training places Pre/Post in slots 2-3', () => {
    const { meals } = buildDayPlan({ ...sheetExample, dayType: 'training', trainingTime: 'afternoon' })
    expect(meals[1].name).toBe('Pre-Workout')
    expect(meals[2].name).toBe('Post-Workout')
  })
})

describe('buildDayPlan — warning flags', () => {
  it('flags meals with > 50g carbs', () => {
    // N=3 rest day with 300g carbs → 100g/meal > 50g
    const { meals } = buildDayPlan({
      ...sheetExample, carbs: 300, N: 3, dayType: 'rest',
    })
    meals.forEach((m) => expect(m.warnOverFifty).toBe(true))
  })
  it('does not flag meals at or below 50g', () => {
    const { meals } = buildDayPlan({
      ...sheetExample, carbs: 100, N: 3, dayType: 'rest',
    })
    meals.forEach((m) => expect(m.warnOverFifty).toBe(false))
  })
})

describe('buildDayPlan — macro-calorie consistency', () => {
  it('returns macroCalorieDelta showing the discrepancy', () => {
    // Macros imply: 100*4 + 100*4 + 100*9 = 1700 (matches stated calories)
    const r = buildDayPlan({ ...sheetExample, dayType: 'rest' })
    expect(Math.abs(r.macroCalorieDelta)).toBeLessThan(10)
  })
  it('flags consistency warning when delta exceeds 10%', () => {
    // Stated 1700 cal but macros imply 1300 cal (76g P, 76g C, 76g F)
    const r = buildDayPlan({
      calories: 1700, protein: 76, carbs: 76, fat: 76, fiber: 25,
      N: 3, dayType: 'rest',
    })
    expect(r.macroConsistencyWarning).toBe(true)
  })
})
