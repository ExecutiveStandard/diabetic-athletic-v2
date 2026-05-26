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

// Affirming coaching for anaerobic / strength when start conditions would
// have been risky for aerobic. Rewards the user for picking the safer
// activity type today and gives them confidence in the choice.
function shouldShowSmartChoiceNote(fuelPlan, activityType) {
  if (activityType !== 'anaerobic' && activityType !== 'strength') return false
  const iob = fuelPlan.iobUnits || 0
  const startBG = fuelPlan.startGlucoseMmol
  // Same conditions that would have triggered the aerobic soft/strong warning
  return startBG < 8.0 && iob >= 2
}

// Two-tier strategic coaching for aerobic / mixed start conditions.
//
// STRONG (red, firm "don't do this aerobic today"): IOB alone would crash
//   the user before exercise even factors in. Heuristic: 1 unit of insulin
//   ≈ 1 mmol/L drop for an average adult T1D ISF (literature: 0.8-1.5
//   mmol/L per unit). If startBG minus iobUnits*1 lands at or below
//   4 mmol/L, the user is heading toward hypo from the IOB alone.
//
// SOFT (gold, "consider alternatives first"): start conditions are
//   sub-optimal but not catastrophic — BG < 8, IOB >= 2u, on top of
//   aerobic/mixed.
//
// Returns 'strong' | 'soft' | null. Mutually exclusive.
function getStrategicRiskLevel(fuelPlan, activityType) {
  if (activityType !== 'aerobic' && activityType !== 'mixed') return null
  if (fuelPlan.status !== 'fuel') return null

  const iob = fuelPlan.iobUnits || 0
  const startBG = fuelPlan.startGlucoseMmol
  const iobImpliedEnd = startBG - (iob * 1.0)

  if (iobImpliedEnd <= 4.0) return 'strong'
  if (startBG < 8.0 && iob >= 2) return 'soft'
  return null
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

    // Activity-aware supplementary note for high-BG (>14 mmol/L).
    // Aerobic at low intensity can actually help bring BG down via
    // muscle glucose uptake, while anaerobic / strength will push it
    // higher via the cortisol spike. The advice differs significantly.
    let highBgActivityNote = null
    if (fuelPlan.status === 'high-bg-warning') {
      if (activityType === 'aerobic') {
        highBgActivityNote = (
          <p className="text-white/80 text-sm leading-relaxed">
            <strong className="text-da-cyan">For aerobic specifically:</strong> if your ketones are clear, a low-intensity aerobic session (think easy walk or gentle cycle) can actually help bring your BG down via increased muscle glucose uptake. Keep the intensity LOW — heart rate Zone 1–2 max — and monitor closely. Don't push into harder zones until your BG is back in range.
          </p>
        )
      } else if (activityType === 'anaerobic' || activityType === 'strength') {
        highBgActivityNote = (
          <p className="text-white/80 text-sm leading-relaxed">
            <strong className="text-red-300">For {activityType} specifically:</strong> high-intensity work will push your BG even higher via the cortisol and adrenaline response — exactly the wrong direction. Wait until your BG drops below 14 mmol/L (252 mg/dL) before starting this kind of session. If you must train today, switch to a low-intensity aerobic session instead (and only with no ketones).
          </p>
        )
      } else if (activityType === 'mixed') {
        highBgActivityNote = (
          <p className="text-white/80 text-sm leading-relaxed">
            <strong className="text-da-cyan">For mixed sessions specifically:</strong> the high-intensity portions will push BG higher (wrong direction), while the lower-intensity portions could bring it down slightly. Net effect is unpredictable and risky at this BG level. Best call is to wait until BG drops below 14 mmol/L (252 mg/dL), or switch to a pure low-intensity aerobic session for today.
          </p>
        )
      }
    }

    return (
      <div className="space-y-4">
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-yellow-400">
          <p className="text-yellow-400 uppercase tracking-wider text-xs font-bold mb-2">
            {headerText}
          </p>
          <p className="text-white text-base leading-relaxed">{fuelPlan.warning}</p>
          {highBgActivityNote && (
            <div className="mt-3 pt-3 border-t border-white/10">
              {highBgActivityNote}
            </div>
          )}
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
  const riskLevel = getStrategicRiskLevel(fuelPlan, activityType)
  const iobImpliedEnd = fuelPlan.startGlucoseMmol - (fuelPlan.iobUnits || 0) * 1.0
  const showSmartChoice = shouldShowSmartChoiceNote(fuelPlan, activityType)

  // Normal output — fuel or no-fuel
  return (
    <div className="space-y-4">
      {/* STRATEGIC COACHING — STRONG tier (red, firm).
          Fires when IOB alone would push the user below 4 mmol/L.
          The fuel plan below is shown for transparency but reframed —
          proceeding is not the recommended path. */}
      {riskLevel === 'strong' && (
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-red-500">
          <p className="text-red-400 uppercase tracking-wider text-xs font-bold mb-3">🛑 Strong recommendation: don't do this aerobic session today</p>
          <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4">
            You're at <strong className="text-white">{dual(fuelPlan.startGlucoseMmol)}</strong> with <strong className="text-white">{fmtIob(fuelPlan.iobUnits)}u of active insulin</strong> on board. On a typical adult T1D sensitivity (about 1 mmol/L drop per unit), that active insulin alone would pull you toward <strong className="text-red-300">{dual(iobImpliedEnd)}</strong> before exercise even starts. {activityType === 'aerobic' ? 'Aerobic' : 'Mixed'} work on top of that is a high-risk setup for severe hypoglycemia — and the fuel plan can't reliably compensate for an IOB-driven drop of that size.
          </p>
          <p className="text-white/90 text-sm md:text-base font-semibold mb-3">The smart calls today, in order of preference:</p>
          <div className="space-y-3 text-sm md:text-base">
            <div>
              <p className="text-da-cyan font-bold mb-1">1. Delay until your IOB drops below ~3u</p>
              <p className="text-white/75 leading-relaxed">
                Wait 1.5–2 hours for the active insulin to work down. Same workout, much safer conditions. Cleanest path if your schedule allows.
              </p>
            </div>
            <div>
              <p className="text-da-cyan font-bold mb-1">2. Switch to strength or anaerobic training</p>
              <p className="text-white/75 leading-relaxed">
                Heavy lifting or HIIT triggers counter-regulatory hormones (cortisol, adrenaline) that push BG <em>up</em>. Your IOB becomes an asset that prevents the spike — instead of a threat that drives you low. You still train, just in a smarter form for today.
              </p>
            </div>
            <div>
              <p className="text-da-cyan font-bold mb-1">3. Skip today's session, walk gently instead</p>
              <p className="text-white/75 leading-relaxed">
                A low-intensity walk burns far less glucose than aerobic training. Save the session for when your IOB is in a safer range. Rest days are part of training.
              </p>
            </div>
          </div>
          <p className="text-white/60 italic text-xs mt-4 border-t border-white/10 pt-3">
            The fuel plan below is shown for transparency — but please don't read it as endorsement. It exists because users sometimes need information about scenarios they shouldn't be in. If you've considered the options above and still choose to proceed, follow the plan tightly and watch your CGM every few minutes.
          </p>
        </div>
      )}

      {/* AFFIRMING COACHING — fires for anaerobic/strength when the user
          picks a smart activity type given their start conditions. Inverts
          the warning tone: "smart choice for today" rather than "consider
          alternatives." Builds confidence in the user's decision. */}
      {showSmartChoice && (
        <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-cyan">
          <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">✅ Smart choice for today's conditions</p>
          <p className="text-white/85 text-sm md:text-base leading-relaxed mb-3">
            You're at <strong className="text-white">{dual(fuelPlan.startGlucoseMmol)}</strong> with <strong className="text-white">{fmtIob(fuelPlan.iobUnits)}u of active insulin</strong> going into a {activityType === 'strength' ? 'strength' : 'anaerobic'} session. This is a genuinely smart call — heavy lifting and high-intensity work trigger counter-regulatory hormones (cortisol, adrenaline, growth hormone) that push BG up, which counters your active insulin. Your IOB becomes an asset for this kind of training rather than a threat.
          </p>
          <p className="text-white/85 text-sm md:text-base leading-relaxed mb-2">
            <strong className="text-white">Heads up on what to watch for:</strong>
          </p>
          <ul className="space-y-2 text-sm md:text-base text-white/80 mb-3">
            <li>
              <strong className="text-da-gold">Mid-session:</strong> if you're going truly intense (close to maximal effort), the cortisol response will likely outpace your IOB. If your intensity stays moderate, the IOB can still drop you — keep rescue carbs accessible just in case.
            </li>
            <li>
              <strong className="text-da-gold">Cool-down (0–60 min after):</strong> BG often rises further as cortisol peaks. Many T1Ds need a small correction bolus 30–60 min post-session. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to size it.
            </li>
            <li>
              <strong className="text-da-gold">Delayed drop (4–6 hours later):</strong> glycogen replenishment can pull BG down later. Recheck at the 1h and 4h marks.
            </li>
          </ul>
          <p className="text-white/50 italic text-xs">
            Picking the right activity for today's conditions — instead of forcing the activity you planned — is exactly the kind of smart training that turns reactive diabetic management into proactive athletic management.
          </p>
        </div>
      )}

      {/* STRATEGIC COACHING — SOFT tier (gold, "consider alternatives").
          Fires when start conditions are sub-optimal but not catastrophic. */}
      {riskLevel === 'soft' && (
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
      </div>

      {/* How to dial this in — testing methodology */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8 border-l-4 border-da-gold/40">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">🧪 How to dial this in</p>
        <p className="text-white/80 text-sm md:text-base leading-relaxed">
          Real-world fuel needs vary person to person. Run this same workout — same fuel, same starting conditions — <strong className="text-white">2–3 times</strong> to learn your body's actual pattern. If you consistently finish above 8 mmol/L (144 mg/dL), scale the fuel down slightly. If you finish below 7 mmol/L (126 mg/dL) or feel low, scale up. <strong className="text-white">The number on this page is your starting point, not the final answer.</strong>
        </p>
      </div>

      {/* Post-workout brief — activity-aware */}
      <div className="bg-da-card rounded-2xl p-6 md:p-8">
        <p className="text-da-gold uppercase tracking-wider text-xs font-bold mb-2">Post-Workout Brief</p>
        {(activityType === 'anaerobic' || activityType === 'strength') ? (
          <div className="text-white/70 space-y-2">
            <p>
              <strong className="text-white">📈 Immediately (0–60 min):</strong> Your BG may rise as cortisol and growth hormone peak. Many T1Ds need a small correction bolus 30–60 min after intense sessions — wait until you're cooled down before dosing. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to size the correction.
            </p>
            <p>
              <strong className="text-white">📉 Delayed (4–6 hours later):</strong> As the cortisol spike resolves and your muscles refill glycogen, BG can drop sharply — often hours after you've forgotten about the workout. Recheck at the 1-hour and 4-hour marks. Your evening or overnight bolus needs may be reduced by 25–50% on training days.
            </p>
          </div>
        ) : (
          <p className="text-white/70">
            📉 Watch for a delayed glucose drop 4–6 hours after finishing — glycogen replenishment continues even after the workout ends. Recheck at 1 hour and 4 hours after stopping. Your post-workout bolus needs may be reduced by 50–75%. <Link to="/calculators/magic-ratio" className="text-da-cyan underline">Use the Magic Ratio Calculator</Link> to recalibrate.
          </p>
        )}
      </div>
    </div>
  )
}
