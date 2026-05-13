// Goal-specific macro defaults — tuned for Type 1 diabetic athletes by
// Diabetic Athletic, drawing on established T1D sport-nutrition guidelines.
// Goal IDs match CalorieCalculator.jsx's existing GOALS array.
export const MACRO_DEFAULTS = {
  loss:     { proteinPerKg: 1.8, fatPercent: 0.20 },
  maintain: { proteinPerKg: 1.6, fatPercent: 0.25 },
  gain:     { proteinPerKg: 1.6, fatPercent: 0.25 },
}

// Default fiber grams — SCAN 2015 (UK Scientific Advisory Committee on
// Nutrition) recommends a minimum of 30g/day for general health.
export const FIBER_DEFAULT_G = 30

// Slider bounds. fatPercent is stored as a decimal (0.15 = 15%).
export const SLIDER_RANGES = {
  protein: { min: 1.2,  max: 2.5,  step: 0.1  },
  fat:     { min: 0.15, max: 0.35, step: 0.01 },
  fiber:   { min: 30,   max: 40,   step: 1    },
}

const KCAL_PER_G_PROTEIN = 4
const KCAL_PER_G_CARBS   = 4
const KCAL_PER_G_FAT     = 9

export function computeMacros({
  goalCalories,
  bodyweightKg,
  proteinPerKg,
  fatPercent,
  fiberGrams,
}) {
  const protein    = bodyweightKg * proteinPerKg
  const fat        = (fatPercent * goalCalories) / KCAL_PER_G_FAT
  const proteinCal = protein * KCAL_PER_G_PROTEIN
  const fatCal     = fat * KCAL_PER_G_FAT

  const remainingCal = goalCalories - proteinCal - fatCal
  const carbsClampedToZero = remainingCal < 0
  const carbs = carbsClampedToZero ? 0 : remainingCal / KCAL_PER_G_CARBS
  const carbsCal = carbs * KCAL_PER_G_CARBS

  return {
    protein,
    carbs,
    fat,
    fiber: fiberGrams,
    proteinCal,
    carbsCal,
    fatCal,
    proteinPercent: (proteinCal / goalCalories) * 100,
    carbsPercent:   (carbsCal   / goalCalories) * 100,
    fatPercent:     (fatCal     / goalCalories) * 100,
    carbsClampedToZero,
  }
}
