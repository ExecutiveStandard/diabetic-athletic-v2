export function caloriesFromMacros({ protein, carbs, fat }) {
  return (protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9
}

export function distributeTrainingDay({ protein, carbs, fat, fiber, N, carbWeight, fatWeight }) {
  const regulars = Math.max(1, N - 2)

  // CARBS — weighted toward peri
  const periCarbs    = (carbWeight * carbs) / 2
  const regularCarbs = ((1 - carbWeight) * carbs) / regulars

  // FAT — weighted away from peri
  const periFat    = (fatWeight * fat) / 2
  const regularFat = ((1 - fatWeight) * fat) / regulars

  // PROTEIN & FIBER — equal across all N meals
  const equalProtein = protein / N
  const equalFiber   = fiber / N

  const peri = {
    protein:  equalProtein,
    carbs:    periCarbs,
    fat:      periFat,
    fiber:    equalFiber,
    calories: caloriesFromMacros({ protein: equalProtein, carbs: periCarbs, fat: periFat }),
  }

  const regular = {
    protein:  equalProtein,
    carbs:    regularCarbs,
    fat:      regularFat,
    fiber:    equalFiber,
    calories: caloriesFromMacros({ protein: equalProtein, carbs: regularCarbs, fat: regularFat }),
  }

  return { peri, regular }
}

export function distributeRestDay({ protein, carbs, fat, fiber, N }) {
  const p = protein / N
  const c = carbs / N
  const f = fat / N
  const fib = fiber / N
  return {
    protein: p,
    carbs:   c,
    fat:     f,
    fiber:   fib,
    calories: caloriesFromMacros({ protein: p, carbs: c, fat: f }),
  }
}
