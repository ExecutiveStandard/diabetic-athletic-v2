export const DEFAULTS = {
  training: 4,
  rest: 3,
}

export const TARGET_CARB_CEILING = 45  // top of dosing-accuracy sweet spot

export function defaultMealCount(dayType) {
  return dayType === 'training' ? DEFAULTS.training : DEFAULTS.rest
}

function computeTrainingMeals(dailyCarbs, carbWeight, N) {
  const peri = (carbWeight * dailyCarbs) / 2
  const regular = ((1 - carbWeight) * dailyCarbs) / Math.max(1, N - 2)
  return { peri, regular }
}

export function suggestMealCount({ dayType, dailyCarbs, carbWeight }) {
  if (dayType === 'rest') {
    let N = DEFAULTS.rest
    while (dailyCarbs / N > TARGET_CARB_CEILING && N < 7) {
      N += 1
    }
    return {
      N,
      perMeal: dailyCarbs / N,
      reason: N === DEFAULTS.rest ? 'default' : 'bumped-for-carb-ceiling',
    }
  }

  // Training day
  let N = DEFAULTS.training
  while (true) {
    const { peri, regular } = computeTrainingMeals(dailyCarbs, carbWeight, N)
    if (regular <= TARGET_CARB_CEILING || N >= 7) {
      const result = {
        N,
        peri,
        regular,
        reason: N === DEFAULTS.training ? 'default' : 'bumped-for-regular-carb-ceiling',
      }
      if (peri > TARGET_CARB_CEILING) {
        result.suggestReducePeriWeight = true
      }
      return result
    }
    N += 1
  }
}
