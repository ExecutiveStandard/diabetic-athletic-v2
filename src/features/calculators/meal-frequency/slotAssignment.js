// Chronological slot labels for training day by (N, training_time).
// Per spec Appendix A — derived from Nicholas's master sheet (Macro Timing tab).
const TRAINING_LAYOUTS = {
  morning: {
    3: ['Pre-Workout', 'Post-Workout', 'Dinner'],
    4: ['Pre-Workout', 'Post-Workout', 'Lunch', 'Dinner'],
    5: ['Pre-Workout', 'Post-Workout', 'Lunch', 'Snack', 'Dinner'],
    6: ['Pre-Workout', 'Post-Workout', 'Snack', 'Lunch', 'Snack', 'Dinner'],
    7: ['Pre-Workout', 'Post-Workout', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack'],
  },
  afternoon: {
    3: ['Breakfast', 'Pre-Workout', 'Post-Workout'],
    4: ['Breakfast', 'Pre-Workout', 'Post-Workout', 'Dinner'],
    5: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Dinner'],
    6: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Snack', 'Dinner'],
    7: ['Breakfast', 'Snack', 'Pre-Workout', 'Post-Workout', 'Snack', 'Dinner', 'Late Snack'],
  },
  evening: {
    3: ['Breakfast', 'Pre-Workout', 'Post-Workout'],
    4: ['Breakfast', 'Lunch', 'Pre-Workout', 'Post-Workout'],
    5: ['Breakfast', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout'],
    6: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout'],
    7: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Pre-Workout', 'Post-Workout', 'Late Snack'],
  },
}

const REST_LAYOUTS = {
  3: ['Breakfast', 'Lunch', 'Dinner'],
  4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
  5: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner'],
  6: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack'],
  7: ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Late Snack', 'Bedtime Snack'],
}

export function getTrainingDayLayout(N, trainingTime) {
  const labels = TRAINING_LAYOUTS[trainingTime]?.[N]
  if (!labels) {
    throw new Error(`No training-day layout for N=${N} time=${trainingTime}`)
  }
  const preIdx = labels.indexOf('Pre-Workout')
  const postIdx = labels.indexOf('Post-Workout')
  return { labels: [...labels], preIdx, postIdx }
}

export function getRestDayLayout(N) {
  const labels = REST_LAYOUTS[N]
  if (!labels) throw new Error(`No rest-day layout for N=${N}`)
  return [...labels]
}
