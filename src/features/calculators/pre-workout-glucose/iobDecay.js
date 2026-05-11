export const DIA_MINUTES = {
  rapid: 240,
  ultra: 210,
}

export function computeIob(bolusUnits, elapsedMinutes, insulinType) {
  const dia = DIA_MINUTES[insulinType] || DIA_MINUTES.rapid
  const elapsed = Math.max(0, elapsedMinutes)
  if (elapsed >= dia) return 0
  return bolusUnits * (1 - elapsed / dia)
}
