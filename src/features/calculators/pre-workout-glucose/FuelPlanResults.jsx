import { Link } from 'react-router-dom'
import { formatGlucose, mmolToMgdl } from './units'

const IOB_SIGNIFICANT_THRESHOLD = 1.0   // units above which we call IOB a "dominant driver"

function fmtIob(n) {
  return Number(n).toFixed(1).replace(/\.0$/, '')
}

// Always show both units side-by-side. The brand audience spans the UK,
// South Africa (mmol/L) AND the US (mg/dL), so we never hide one unit
// behind the user's selector — we show both everywhere a BG value appears.
function dual(mmol) {
  return `${formatGlucose(mmol, 'mmol')} mmol/L (${mmolToMgdl(mmol)} mg/dL)`
}

// Returns the "What to expect during your workout" narrative based on the
// fuel plan + activity type. Different content for different scenarios.
function buildExpectationCopy(fuelPlan, activityType) {
  const iobUnits = fuelPlan.iobUnits || 0
  const iobSignificant = iobUnits >= IOB_SIGNIFICANT_THRESHOLD

  if (activityType === 'aerobic' || activityType === 'mixed') {
    const intro = activityType === 'aerobic'
      ? 'Aerobic exercise pulls glucose out of your bloodstream over the course of your session.'
      : 'Mixed sessions blend the BG-lowering effect of aerobic work with the BG-raising effect of high-intensity bursts — net direction is usually downward but less predictable than pure aerobic.'

    const iobLine = iobSignificant
      ? ` Your active insulin (${fmtIob(iobUnits)}u) amplifies that drop substantially — it's the dominant variable in your fuel plan today.`
      : ''

    return {
      emoji: '📉',
      title: 'What to expect during your workout',
      paragraphs: [
        `${intro}${iobLine} Expect your BG to fall fastest in the first 15–25 minutes, then taper as your body's counter-regulatory hormones (glucagon, cortisol, adrenaline) start defending against the drop. By the end of your session you should land in the 7–8 mmol/L (126–144 mg/dL) window.`,
        'Your pre-workout fuel does most of the work — trust the curve.',
      ],
    }
  }

  if (activityType === 'anaerobic' || activityType === 'strength') {
    const intro = activityType === 'anaerobic'
      ? 'Anaerobic work generates lactate plus a cortisol and adrenaline spike.'
      : 'Strength training stimulates a counter-regulatory hormone response (cortisol, growth hormone, catecholamines).'

    return {
      emoji: '📈',
      title: 'What to expect during your workout',
      paragraphs: [
        `${intro} These hormones push BG up, not down. You may see your glucose rise during and immediately after the session.`,
        'Then 1–4 hours after you finish, your BG may drop as the spike subsides and glycogen replenishment kicks in. Watch for needing correction insulin in the cool-down window, and watch for delayed lows later.',
      ],
    }
  }

  return null
}

// Picks the dominant variable from the prediction breakdown — the item
// with the largest absolute glucose delta. Used to lead the "Why" narrative.
function dominantBreakdownItem(breakdown) {
  if (!breakdown || breakdown.length === 0) return null
  return breakdown.reduce((max, item) => Math.abs(item.delta) > Math.abs(max.delta) ? item : max, breakdown[0])
}

// High-risk-start scenario: lower-end BG + substantial IOB + aerobic/mixed
// activity. The user can still proceed (and the fuel plan is calibrated)
// but a smarter call may exist — delay until IOB drops, or switch to
// anaerobic/strength which raises BG instead. Surfaces the kind of
// strategic coaching the audience won't find elsewhere.
//
// Thresholds align with the brand's own exercise guide:
// - Lower-end BG = below 8 mmol/L (the "near target" band for aerobic risk)
// - Significant IOB = 2+ units (enough to amplify the exercise drop)
function isHighRiskAerobicStart(fuelPlan, activityType) {
  if (activityType !== 'aerobic' && activityType !== 'mixed') return false
  if (fuelPlan.status !== 'fuel') return false  // skip if no fuel needed anyway
  return (fuelPlan.startGlucoseMmol < 8.0) && ((fuelPlan.iobUnits || 0) >= 2)
}

export default function FuelPlanResults({ fuelPlan, prediction, glucoseUnit, activityType }) {
  // Show both units side-by-side in every BG display, regardless of which
  // unit the user selected for input. UK + South Africa + US audience.
  const display = (mmol) => dual(mmol)

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

  const expectation = buildExpectationCopy(fuelPlan, activityType)
  const dominant = dominantBreakdownItem(prediction.breakdown)
  const dominantDirection = dominant?.delta < 0 ? 'pulling your BG down' : dominant?.delta > 0 ? 'pushing your BG up' : 'a small influence'
  const highRiskAerobic = isHighRiskAerobicStart(fuelPlan, activityType)

  // Normal output — fuel or no-fuel
  return (
    <div className="space-y-4">
      {/* STRATEGIC COACHING — appears above the fuel plan when the start
          conditions are high-risk: low-end BG + significant IOB + aerobic.
          Presents smarter alternatives before showing the fuel numbers. */}
      {highRiskAerobic && (
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-gold">
          <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-3">🎯 Coach's strategic note — consider these alternatives first</p>
          <p className="text-white/85 text-sm md:text-base leading-relaxed mb-4">
            You're starting at <strong className="text-white">{dual(fuelPlan.startGlucoseMmol)}</strong> with <strong className="text-white">{fmtIob(fuelPlan.iobUnits)}u of active insulin</strong> going into a {activityType} session. Aerobic exercise pulls glucose down AND that active insulin amplifies the drop — a textbook setup for a tough mid-workout low. The fuel plan below is calibrated for this scenario, but a smarter call may exist:
          </p>
          <div className="space-y-3 text-sm md:text-base">
            <div>
              <p className="text-da-cyan font-bold mb-1">Option 1 — Delay 1–2 hours</p>
              <p className="text-white/75 leading-relaxed">
                Rapid-acting insulin has a ~3–4 hour duration. Waiting 1–2 hours roughly halves your IOB, making the same workout meaningfully safer. If your schedule allows, this is the cleanest path.
              </p>
            </div>
            <div>
              <p className="text-da-cyan font-bold mb-1">Option 2 — Switch to strength or anaerobic training today</p>
              <p className="text-white/75 leading-relaxed">
                Strength and anaerobic sessions trigger counter-regulatory hormones (cortisol, adrenaline, growth hormone) that push glucose <em>up</em>. Your existing IOB becomes an asset that prevents the spike — instead of a risk that drives you low. You still train, just smarter for today's conditions.
              </p>
            </div>
            <div>
              <p className="text-da-cyan font-bold mb-1">Option 3 — Proceed with the fuel plan below</p>
              <p className="text-white/75 leading-relaxed">
                If neither alternative works today, the fuel plan is dialled for your inputs. Watch your CGM closely — the contingency dose is more likely to be needed in this scenario than usual, and follow the decision criteria carefully.
              </p>
            </div>
          </div>
          <p className="text-white/50 italic text-xs mt-4">
            Reading conditions and adjusting the plan — instead of forcing the plan through bad conditions — is what separates athletic glucose management from reactive damage control.
          </p>
        </div>
      )}

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
                mixed: "Your BG is in a good starting range. Mixed sessions can swing in either direction — recheck at the halfway point and top up with 10–15g if you've dropped to 5 mmol/L (90 mg/dL) or lower.",
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

            {/* STEP 2 — Activity fuel (split-dose: primary + on-hand contingency) */}
            {fuelPlan.activityFuel && fuelPlan.activityFuel.split && (
              <div className="space-y-4">
                {/* PRIMARY DOSE — the one that does the real work */}
                <div>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    💪{' '}
                    {fuelPlan.rescue ? "Once you're in range, eat " : 'Eat '}
                    <span className="text-da-cyan">{fuelPlan.activityFuel.split.preWorkoutGrams}g</span> of fast-acting carbs 10–15 min before you start
                  </p>
                  <p className="text-white/60 text-sm italic mt-1">
                    This is your primary dose — it carries the workout. Glucose tabs, juice, dextrose, banana, sports drink — anything that absorbs fast.
                  </p>
                </div>

                {/* CONTINGENCY — clearly framed as optional, with decision criteria */}
                <div className="bg-da-darker rounded-xl p-4 border border-white/10">
                  <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">🥤 Carry on hand — take only if needed</p>
                  <p className="text-white/90 text-base mb-2">
                    Bring an additional <span className="text-da-cyan font-bold">{fuelPlan.activityFuel.split.midWorkoutGrams}g</span> of fast-acting carbs with you. At the <strong className="text-white">{fuelPlan.activityFuel.split.midAtMinutes}-min mark</strong>, check your BG and trend before deciding:
                  </p>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>
                      <strong className="text-da-cyan">Above {dual(7.0)}, or flat / trending up</strong> — don't take it. Your primary dose is doing its job.
                    </li>
                    <li>
                      <strong className="text-da-cyan">Between {dual(5.0)} and {dual(7.0)}, trending down</strong> — take 10g and recheck in 10 minutes.
                    </li>
                    <li>
                      <strong className="text-da-cyan">Below {dual(5.0)}</strong> — take the full {fuelPlan.activityFuel.split.midWorkoutGrams}g now <strong className="text-white">AND pause your workout</strong> until your CGM arrow trends up or you're back above {dual(6.0)}.
                    </li>
                    <li>
                      <strong className="text-da-cyan">No CGM?</strong> If you feel any low symptoms (shaky, sweaty, lightheaded), take 15–25g of carbs <strong className="text-white">AND stop or pause your workout</strong> until you feel stable and your BG is back above {dual(6.0)}.
                    </li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60 leading-relaxed">
                      <strong className="text-da-gold">📝 Coach's note on dose sizing:</strong> A standard hypo at rest is typically treated with <strong className="text-white">10–15g</strong> of fast-acting carbs. But during an aerobic workout, your muscles are still burning glucose — so a mid-exercise low needs more (<strong className="text-white">15–25g</strong>) to treat the hypo <em>and</em> fuel continued activity. If symptoms are severe or you don't feel safe continuing, stop the session entirely, treat as a standard hypo (10–15g), and plan to train another day. If you recover quickly and want to finish, take the higher end (20–25g) so you have enough fuel to complete the workout.
                    </p>
                  </div>
                </div>
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

            {/* STEP 3 — Top-ups during workout (reframed as optional safety) */}
            {fuelPlan.topUps.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mt-2">Optional safety top-ups (have on hand, take only if trending low)</p>
                {fuelPlan.topUps.map((t, i) => (
                  <p key={i} className="text-lg text-white/90">
                    🔁 At {t.atMinutes} min: <span className="text-da-cyan font-bold">{t.grams}g</span>
                  </p>
                ))}
                <p className="text-white/60 text-sm italic mt-1">
                  Carry these with you — gels and chews are easier mid-workout. You may not need them; your pre-workout fuel is the primary plan.
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
                      parts.push(`${topUpSum}g optional top-ups`)
                    }
                    return parts.length > 1 ? ` (${parts.join(' + ')})` : ''
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WHAT TO EXPECT — narrative coaching block */}
      {expectation && fuelPlan.status === 'fuel' && (
        <div className="bg-da-card rounded-2xl p-6 md:p-8">
          <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">
            {expectation.emoji} {expectation.title}
          </p>
          {expectation.paragraphs.map((para, i) => (
            <p key={i} className="text-white/80 text-sm md:text-base leading-relaxed mb-3 last:mb-0">{para}</p>
          ))}
        </div>
      )}

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

      {/* Why — narrative lead + supporting bullets */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">Why this plan</p>
        {dominant && (
          <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4">
            The biggest driver here is <strong className="text-white">{dominant.label}</strong> — {dominantDirection} by an estimated <strong className="text-white">{dominant.delta > 0 ? '+' : ''}{dominant.delta.toFixed(1)} mmol/L ({dominant.delta > 0 ? '+' : ''}{mmolToMgdl(dominant.delta)} mg/dL)</strong>. {dominant.reasoning}. The other factors below fine-tune the prediction from there.
          </p>
        )}
        <ul className="space-y-2">
          {prediction.breakdown.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className={`font-bold whitespace-nowrap ${item.delta < 0 ? 'text-red-400' : item.delta > 0 ? 'text-da-gold' : 'text-white/60'}`}>
                {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)} mmol/L
                <span className="block text-[10px] opacity-70 font-normal">({item.delta > 0 ? '+' : ''}{mmolToMgdl(item.delta)} mg/dL)</span>
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

      {/* How to dial this in — testing methodology */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-gold/40">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">🧪 How to dial this in</p>
        <p className="text-white/80 text-sm md:text-base leading-relaxed">
          Real-world fuel needs vary person to person. Run this same workout — same fuel, same starting conditions — <strong className="text-white">2–3 times</strong> to learn your body's actual pattern. If you consistently finish above 8 mmol/L (144 mg/dL), scale the fuel down slightly. If you finish below 7 mmol/L (126 mg/dL) or feel low, scale up. <strong className="text-white">The number on this page is your starting point, not the final answer.</strong>
        </p>
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
