const TARGET_MMOL = 5.5
const REFERENCE_WEIGHT_KG = 70
const MIN_GRAMS = 10
const MAX_GRAMS = 60

function roundTo5(n) {
  return Math.round(n / 5) * 5
}

export function gramsNeeded(predictedMmol, bodyweightKg) {
  if (predictedMmol >= 4.5) return 0
  const gap = TARGET_MMOL - predictedMmol
  const weightFactor = bodyweightKg / REFERENCE_WEIGHT_KG
  const raw = gap * 5 * weightFactor
  const rounded = roundTo5(raw)
  return Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, rounded))
}
