import { Link } from 'react-router-dom'
import { formatGlucose, mmolToMgdl } from './units'

export default function FuelPlanResults({ fuelPlan, prediction, glucoseUnit, activityType }) {
  const display = (mmol) =>
    glucoseUnit === 'mmol'
      ? `${formatGlucose(mmol, 'mmol')} mmol/L`
      : `${formatGlucose(mmolToMgdl(mmol), 'mgdl')} mg/dL`

  // Safety branches — override everything else
  if (
    fuelPlan.status === 'delay' ||
    fuelPlan.status === 'caution-low' ||
    fuelPlan.status === 'high-bg-warning'
  ) {
    const headerText = {
      delay: "⚠️ Don't start your workout yet — treat the hypo first",
      'caution-low': '⚠️ Caution zone — eat a snack before starting',
      'high-bg-warning': '⚠️ Check for ketones before starting',
    }[fuelPlan.status]

    return (
      <div className="space-y-4">
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-yellow-400">
          <p className="text-yellow-400 uppercase tracking-wider text-xs font-bold mb-2">
            {headerText}
          </p>
          <p className="text-white text-base leading-relaxed">{fuelPlan.warning}</p>
        </div>
        {fuelPlan.iobNote && (
          <p className="text-white/50 italic text-sm">{fuelPlan.iobNote}</p>
        )}
      </div>
    )
  }

  // Normal output — fuel or no-fuel
  return (
    <div className="space-y-4">
      {/* HERO — Your Fuel Plan */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Your Fuel Plan</p>
        {fuelPlan.status === 'no-fuel' ? (
          <>
            <p className="text-2xl md:text-3xl font-black text-white mb-2">
              ✅ No pre-workout fuel needed
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              {{
                aerobic: "Your BG is in a good starting range. You should be able to complete your aerobic session without pre-workout fuel — recheck at 20 minutes if you feel low, and have 15g of fast carbs on hand just in case.",
                mixed: "Your BG is in a good starting range. Mixed sessions can swing in either direction — recheck at the halfway point and top up with 10–15g if you've dropped to 5 mmol/L or lower.",
                anaerobic: "Your BG is in a good starting range. Anaerobic work can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.",
                strength: "Your BG is in a good starting range. Strength training can spike your glucose during and after the session — watch for needing correction insulin in the cool-down window. Don't pre-bolus pre-workout in case the spike doesn't materialize.",
              }[activityType] || "Your BG is in a good starting range. Recheck at 20 minutes if you feel low, and have 15g of fast carbs on hand just in case."}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            {/* STEP 1 — Rescue */}
            {fuelPlan.rescue && (
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  💉 Eat <span className="text-da-cyan">{fuelPlan.rescue.grams}g</span> of fast carbs now
                </p>
                <p className="text-white/70 text-sm mt-1">{fuelPlan.rescue.note}</p>
                <p className="text-white/50 text-xs italic mt-2">
                  Don't know your insulin ratios yet?{' '}
                  <Link to="/calculators/magic-ratio" className="text-da-cyan underline">
                    Use the Magic Ratio Calculator
                  </Link>{' '}
                  to find them — they'll personalize this even further.
                </p>
              </div>
            )}

            {/* STEP 2 — Activity fuel (split-dose when grams > threshold) */}
            {fuelPlan.activityFuel && fuelPlan.activityFuel.split && (
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  💪{' '}
                  {fuelPlan.rescue ? "Once you're in range, fuel your workout: " : 'Fuel your workout: '}
                  <span className="text-da-cyan">{fuelPlan.activityFuel.grams}g</span> total, split across two doses
                </p>
                <ul className="mt-2 space-y-1 text-white/90">
                  <li>
                    🥤 <span className="text-da-cyan font-bold">{fuelPlan.activityFuel.split.preWorkoutGrams}g</span> 10–15 min before you start
                  </li>
                  <li>
                    🔁 <span className="text-da-cyan font-bold">{fuelPlan.activityFuel.split.midWorkoutGrams}g</span> at the {fuelPlan.activityFuel.split.midAtMinutes}-min mark of your workout
                  </li>
                </ul>
                <p className="text-white/60 text-sm italic mt-2">
                  Splitting the dose keeps your BG from spiking pre-workout and gives you sustained fuel through the session. Glucose tabs, gels, sports drink, or chews work well — anything that absorbs fast.
                </p>
              </div>
            )}
            {fuelPlan.activityFuel && !fuelPlan.activityFuel.split && (
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  💪{' '}
                  {fuelPlan.rescue ? "Once you're in range, eat " : 'Eat '}
                  <span className="text-da-cyan">{fuelPlan.activityFuel.grams}g</span>
                  {fuelPlan.rescue ? ' to fuel the workout itself' : ` of fast-acting carbs ${fuelPlan.activityFuel.timingText} to fuel the workout`}
                </p>
                <p className="text-white/60 text-sm italic mt-1">
                  Glucose tabs, juice, dextrose, banana, sports drink — anything that absorbs fast.
                </p>
              </div>
            )}

            {/* STEP 3 — Top-ups during workout */}
            {fuelPlan.topUps.length > 0 && (
              <div className="space-y-1">
                {fuelPlan.topUps.map((t, i) => (
                  <p key={i} className="text-lg text-white/90">
                    🔁 At {t.atMinutes} min: <span className="text-da-cyan font-bold">{t.grams}g</span> top-up
                  </p>
                ))}
                <p className="text-white/60 text-sm italic mt-1">
                  Carry your top-ups with you — gels and chews are easier mid-workout.
                </p>
              </div>
            )}

            {/* TOTAL — only shown when at least one component fired */}
            {fuelPlan.totalGrams > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-white/90 font-bold">
                  Total carbs for this workout: <span className="text-da-cyan">{fuelPlan.totalGrams}g</span>
                  {(() => {
                    const parts = []
                    if (fuelPlan.rescue) parts.push(`${fuelPlan.rescue.grams}g rescue`)
                    if (fuelPlan.activityFuel) parts.push(`${fuelPlan.activityFuel.grams}g activity fuel`)
                    if (fuelPlan.topUps.length > 0) {
                      const topUpSum = fuelPlan.topUps.reduce((s, t) => s + t.grams, 0)
                      parts.push(`${topUpSum}g in top-ups`)
                    }
                    return parts.length > 1 ? ` (${parts.join(' + ')})` : ''
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison row — only when a fuel plan was actually recommended */}
      {fuelPlan.status === 'fuel' && (
        <div className="bg-da-card rounded-2xl p-6 md:p-8">
          <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">What This Fuel Plan Does</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Without this fuel</p>
              <p className="text-2xl font-black text-white">{display(fuelPlan.predictedEndWithoutFuel)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">With this fuel</p>
              <p className="text-2xl font-black text-da-cyan">{display(fuelPlan.predictedEndWithFuel)} ✓</p>
            </div>
          </div>
        </div>
      )}

      {/* IOB context note */}
      {fuelPlan.iobNote && (
        <p className="text-white/50 italic text-sm px-2">{fuelPlan.iobNote}</p>
      )}

      {/* Why */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Why</p>
        <ul className="space-y-2">
          {prediction.breakdown.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className={`font-bold ${item.delta < 0 ? 'text-red-400' : item.delta > 0 ? 'text-da-gold' : 'text-white/60'}`}>
                {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)} mmol/L
              </span>
              <span className="text-white/70 flex-1">{item.label} — <span className="text-white/40">{item.reasoning}</span></span>
            </li>
          ))}
        </ul>
      </div>

      {/* During-workout tips */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">During Your Workout</p>
        <p className="text-white/70">
          Recheck your BG at 20 minutes if you feel low. If you're trending fast in either direction, adjust on the fly — these numbers are calibrated starting points, not commandments.
        </p>
        {(activityType === 'aerobic' || activityType === 'mixed') && (
          <p className="text-white/70 mt-3">
            <span className="text-da-gold font-semibold">Hypo-prevention tip:</span> A 10-second all-out sprint at the start of your session — or any time you start drifting low — triggers counter-regulatory hormones that bump your BG up. It's a free, drug-free way to head off a hypo without breaking the workout.
          </p>
        )}
      </div>

      {/* Post-workout brief */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">Post-Workout Brief</p>
        <p className="text-white/70">
          📉 Watch for a delayed glucose drop 4–6 hours after finishing — glycogen replenishment continues even after the workout ends. Recheck at 1 hour and 4 hours after stopping. Your post-workout bolus needs may be reduced by 50–75%. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to recalibrate.
        </p>
      </div>
    </div>
  )
}
