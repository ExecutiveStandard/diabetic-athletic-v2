// 1 mmol/L = 18 mg/dL (standard conversion factor)
export function mmolToMgdl(mmol) {
  return Math.round(mmol * 18)
}

export function mgdlToMmol(mgdl) {
  return mgdl / 18
}

export function formatGlucose(value, unit) {
  if (unit === 'mgdl') return Math.round(value).toString()
  return (Math.round(value * 10) / 10).toFixed(1)
}
