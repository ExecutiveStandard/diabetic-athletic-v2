import { describe, it, expect } from 'vitest'
import { getTrainingDayLayout, getRestDayLayout } from './slotAssignment'

describe('getTrainingDayLayout — N=4 (sheet default)', () => {
  it('morning → [Pre, Post, Lunch, Dinner], preIdx=0 postIdx=1', () => {
    const r = getTrainingDayLayout(4, 'morning')
    expect(r.labels).toEqual(['Pre-Workout', 'Post-Workout', 'Lunch', 'Dinner'])
    expect(r.preIdx).toBe(0)
    expect(r.postIdx).toBe(1)
  })
  it('afternoon → [Breakfast, Pre, Post, Dinner], preIdx=1 postIdx=2', () => {
    const r = getTrainingDayLayout(4, 'afternoon')
    expect(r.labels).toEqual(['Breakfast', 'Pre-Workout', 'Post-Workout', 'Dinner'])
    expect(r.preIdx).toBe(1)
    expect(r.postIdx).toBe(2)
  })
  it('evening → [Breakfast, Lunch, Pre, Post], preIdx=2 postIdx=3', () => {
    const r = getTrainingDayLayout(4, 'evening')
    expect(r.labels).toEqual(['Breakfast', 'Lunch', 'Pre-Workout', 'Post-Workout'])
    expect(r.preIdx).toBe(2)
    expect(r.postIdx).toBe(3)
  })
})

describe('getTrainingDayLayout — other N values', () => {
  it('N=3 morning → 3 slots, preIdx=0 postIdx=1', () => {
    const r = getTrainingDayLayout(3, 'morning')
    expect(r.labels.length).toBe(3)
    expect(r.preIdx).toBe(0)
    expect(r.postIdx).toBe(1)
  })
  it('N=5 evening → preIdx=3 postIdx=4', () => {
    const r = getTrainingDayLayout(5, 'evening')
    expect(r.labels.length).toBe(5)
    expect(r.preIdx).toBe(3)
    expect(r.postIdx).toBe(4)
  })
  it('N=6 afternoon → preIdx=2 postIdx=3', () => {
    const r = getTrainingDayLayout(6, 'afternoon')
    expect(r.labels.length).toBe(6)
    expect(r.preIdx).toBe(2)
    expect(r.postIdx).toBe(3)
  })
  it('N=7 evening → preIdx=4 postIdx=5', () => {
    const r = getTrainingDayLayout(7, 'evening')
    expect(r.labels.length).toBe(7)
    expect(r.preIdx).toBe(4)
    expect(r.postIdx).toBe(5)
  })
  it('Pre and Post are always adjacent', () => {
    for (const N of [3, 4, 5, 6, 7]) {
      for (const t of ['morning', 'afternoon', 'evening']) {
        const r = getTrainingDayLayout(N, t)
        expect(r.postIdx - r.preIdx).toBe(1)
      }
    }
  })
})

describe('getRestDayLayout', () => {
  it('N=3 → Breakfast, Lunch, Dinner', () => {
    expect(getRestDayLayout(3)).toEqual(['Breakfast', 'Lunch', 'Dinner'])
  })
  it('N=4 → Breakfast, Lunch, Snack, Dinner', () => {
    expect(getRestDayLayout(4)).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner'])
  })
  it('N=5 → 5 chronological labels', () => {
    expect(getRestDayLayout(5).length).toBe(5)
  })
  it('N=7 → 7 chronological labels', () => {
    expect(getRestDayLayout(7).length).toBe(7)
  })
})
