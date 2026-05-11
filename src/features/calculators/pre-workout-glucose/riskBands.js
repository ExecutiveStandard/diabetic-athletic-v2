// All thresholds in mmol/L. Boundaries are inclusive on the lower end.
export const BANDS = {
  'severe-hypo': {
    id: 'severe-hypo',
    label: 'Severe Hypo',
    color: '#E74C3C', // red
    range: { min: -Infinity, max: 3.3 },
    action: 'DO NOT START — treat low first',
  },
  'hypo-risk': {
    id: 'hypo-risk',
    label: 'Hypo Risk',
    color: '#F39C12', // orange
    range: { min: 3.3, max: 4.5 },
    action: 'Consume 15–30g fast carbs now and recheck in 15 min',
  },
  ideal: {
    id: 'ideal',
    label: 'Ideal',
    color: '#46C0ED', // brand cyan
    range: { min: 4.5, max: 9.0 },
    action: 'Cleared to start',
  },
  'acceptable-hyper': {
    id: 'acceptable-hyper',
    label: 'Acceptable Hyper',
    color: '#FCC826', // brand gold
    range: { min: 9.0, max: 13.9 },
    action: 'OK to start — recheck at 30 min',
  },
  'hyper-risk': {
    id: 'hyper-risk',
    label: 'Hyper Risk',
    color: '#F39C12',
    range: { min: 13.9, max: 16.7 },
    action: 'Consider correcting before starting',
  },
  'ketone-danger': {
    id: 'ketone-danger',
    label: 'Danger — Check Ketones',
    color: '#E74C3C',
    range: { min: 16.7, max: Infinity },
    action: 'Check ketones — postpone if ketones present',
  },
}

export function bandFor(glucoseMmol) {
  for (const band of Object.values(BANDS)) {
    if (glucoseMmol >= band.range.min && glucoseMmol < band.range.max) {
      return band
    }
  }
  return BANDS['ketone-danger']
}
