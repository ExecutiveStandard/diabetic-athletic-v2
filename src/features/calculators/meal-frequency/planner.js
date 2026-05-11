import { getTrainingDayLayout, getRestDayLayout } from './slotAssignment'
import { distributeTrainingDay, distributeRestDay, caloriesFromMacros } from './distribution'

const CARB_WARN_THRESHOLD = 50

function checkMacroConsistency(stated, macros) {
  const implied = caloriesFromMacros(macros)
  const delta = implied - stated
  return {
    macroCalorieDelta: delta,
    macroConsistencyWarning: Math.abs(delta) / Math.max(1, stated) > 0.10,
  }
}

export function buildDayPlan(input) {
  const {
    calories, protein, carbs, fat, fiber,
    N, dayType, trainingTime, carbWeight = 0.65, fatWeight = 0.15,
  } = input

  const consistency = checkMacroConsistency(calories, { protein, carbs, fat })

  if (dayType === 'rest') {
    const labels = getRestDayLayout(N)
    const per = distributeRestDay({ protein, carbs, fat, fiber, N })
    const meals = labels.map((name, i) => ({
      idx: i,
      name,
      role: 'regular',
      carbsType: 'mixed',
      protein:  per.protein,
      carbs:    per.carbs,
      fat:      per.fat,
      fiber:    per.fiber,
      calories: per.calories,
      warnOverFifty: per.carbs > CARB_WARN_THRESHOLD,
    }))
    return { meals, ...consistency }
  }

  // Training day
  const layout = getTrainingDayLayout(N, trainingTime)
  const dist = distributeTrainingDay({ protein, carbs, fat, fiber, N, carbWeight, fatWeight })

  const meals = layout.labels.map((name, i) => {
    const isPre  = i === layout.preIdx
    const isPost = i === layout.postIdx
    const isPeri = isPre || isPost
    const macros = isPeri ? dist.peri : dist.regular
    return {
      idx: i,
      name,
      role: isPeri ? 'peri' : 'regular',
      carbsType: isPre ? 'simple' : isPost ? 'complex' : 'mixed',
      protein:  macros.protein,
      carbs:    macros.carbs,
      fat:      macros.fat,
      fiber:    macros.fiber,
      calories: macros.calories,
      warnOverFifty: macros.carbs > CARB_WARN_THRESHOLD,
    }
  })

  return { meals, ...consistency }
}
