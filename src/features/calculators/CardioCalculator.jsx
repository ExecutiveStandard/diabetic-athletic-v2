import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function CardioCalculator() {
  return (
    <OptInGate slug="cardio" {...OPT_IN_CONTENT.cardio}>
      <CardioCalculatorActual />
    </OptInGate>
  )
}

// =============================================================================
// CARDIO HEART RATE ZONES CALCULATOR
// Faithful port of the original Diabetic Athletic GHL widget. Karvonen method
// (Heart Rate Reserve): zone BPM = (HRR × pct) + RHR, where HRR = MHR − RHR
// and MHR = 220 − age.
//
// NOTE: The original GHL code had a typo in Zone 5 (`calcRange(0.83)` instead
// of `0.93`) which caused Zones 4 and 5 to overlap. I've used the continuous,
// non-overlapping percentages (68/73/80/87/93/100) that match the original
// table headers. All glucose-behaviour tooltips are preserved verbatim — they
// are the most clinically valuable part of the original tool.
// =============================================================================

const ZONES = [
  {
    num: 1,
    feel: 'Easy',
    pctLow: 0.68,
    pctHigh: 0.73,
    pctLabel: '68–73%',
    info: 'Useful for encouraging blood flow, to aid recovery after a tough workout & flush out lactate.',
    glucoseLabel: 'Sugars stable',
    glucoseDetail:
      'Sugars should remain stable. Possible drop if IOB is present.',
    bg: 'from-emerald-500/15 to-emerald-700/5',
    border: 'border-emerald-500/40',
    chip: 'bg-emerald-500',
    chipText: 'text-da-dark',
  },
  {
    num: 2,
    feel: 'Steady',
    pctLow: 0.73,
    pctHigh: 0.80,
    pctLabel: '73–80%',
    info: 'Training in this zone will boost endurance and the efficiency with which you use fat and carbohydrates as fuel.',
    glucoseLabel: 'Glucose drops steadily',
    glucoseDetail:
      'Glucose levels will steadily drop when in this zone. IOB should be limited by about 50–70% when training in this zone in order to keep glucose level stability. Pre-training glucose or low-GI carbs are advised. Note: Insulin intake post-workout will be about 50–75% of the usual correction dose normally used.',
    bg: 'from-da-cyan/15 to-da-cyan/5',
    border: 'border-da-cyan/40',
    chip: 'bg-da-cyan',
    chipText: 'text-da-dark',
  },
  {
    num: 3,
    feel: 'Moderately Hard',
    pctLow: 0.80,
    pctHigh: 0.87,
    pctLabel: '80–87%',
    info: 'Training in the upper end of this zone is thought to enable you to delay fatigue caused by lactic acid. Sessions should be 10–20 minutes long, with relatively short recoveries of 1 to 3 minutes.',
    glucoseLabel: 'Glucose lowering',
    glucoseDetail:
      'This zone is between a glucose-lowering and glucose-spiking workout zone. If too much IOB — levels drop. When zero IOB is present, or basal has been reduced/stopped long before this type of activity — levels are likely going to rise during activity.',
    bg: 'from-amber-400/15 to-amber-600/5',
    border: 'border-amber-400/40',
    chip: 'bg-da-gold',
    chipText: 'text-da-dark',
  },
  {
    num: 4,
    feel: 'Hard',
    pctLow: 0.87,
    pctHigh: 0.93,
    pctLabel: '87–93%',
    info: 'Boosts lactate threshold, but training in this zone will soon lead to fatigue. Use this zone for 3 to 10-minute bursts with 1–2 minute recoveries.',
    glucoseLabel: 'Possible glucose spike',
    glucoseDetail:
      'This zone is glycolytic — meaning glucose is released from the muscle belly and used for energy. Glucose levels may rise during activity in this zone. Once activity stops, glucose levels are known to drop once IOB is present. Insulin sensitivity is often high after this type of activity. Post-workout insulin should be given and reduced by 50–75% — person-dependent.',
    bg: 'from-orange-500/15 to-orange-700/5',
    border: 'border-orange-500/40',
    chip: 'bg-orange-500',
    chipText: 'text-white',
  },
  {
    num: 5,
    feel: 'Very Hard',
    pctLow: 0.93,
    pctHigh: 1.00,
    pctLabel: '93–100%',
    info: 'Training in this zone is only possible for short periods and helps you develop top-end speed. Train at this intensity for short bursts of 1 to 3 minutes, with a similar amount of time as recovery.',
    glucoseLabel: 'Likely glucose rise',
    glucoseDetail:
      "Training in this zone is almost always going to raise your levels. IOB is recommended for this training zone. Insulin timing becomes imperative here. Insulin timing refers to the time your insulin kicks in versus the time your sugars are anticipated to spike from the activity done inside this zone.",
    bg: 'from-red-500/15 to-red-700/5',
    border: 'border-red-500/40',
    chip: 'bg-red-500',
    chipText: 'text-white',
  },
]

// Karvonen / Heart Rate Reserve method
function karvonen({ age, rhr, pct }) {
  if (!age || !rhr) return 0
  const mhr = 220 - age
  const hrr = mhr - rhr
  return hrr * pct + rhr
}

// =============================================================================
// ZONE CARD (with collapsible glucose detail)
// =============================================================================
function ZoneCard({ zone, age, rhr, hasResults }) {
  const [showDetail, setShowDetail] = useState(false)

  const low  = karvonen({ age, rhr, pct: zone.pctLow })
  const high = karvonen({ age, rhr, pct: zone.pctHigh })

  return (
    <div className={`bg-gradient-to-r ${zone.bg} ${zone.border} border rounded-xl overflow-hidden`}>
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4 md:gap-5">
          {/* Zone number circle */}
          <div className={`flex-shrink-0 ${zone.chip} ${zone.chipText} w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg md:text-xl shadow-lg`}>
            {zone.num}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
              <h3 className="text-white font-black uppercase tracking-wider text-base md:text-lg">
                Zone {zone.num} · {zone.feel}
              </h3>
              <span className="text-white/50 text-xs uppercase tracking-wider font-bold">
                {zone.pctLabel} of HRR
              </span>
            </div>

            {/* BPM range */}
            <div className="mb-3">
              {hasResults ? (
                <div className="text-3xl md:text-4xl font-black text-white">
                  {low.toFixed(0)}<span className="text-white/40 mx-2">–</span>{high.toFixed(0)}
                  <span className="text-sm md:text-base text-white/50 font-bold normal-case ml-2">bpm</span>
                </div>
              ) : (
                <div className="text-2xl md:text-3xl font-black text-white/30">— bpm</div>
              )}
            </div>

            {/* Training info */}
            <p className="text-white/75 text-sm leading-relaxed mb-3">
              {zone.info}
            </p>

            {/* Glucose behaviour toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetail(!showDetail)}
                className="inline-flex items-center gap-2 text-da-gold hover:text-da-cyan transition text-xs font-bold uppercase tracking-wider"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-da-gold/20 border border-da-gold/40 text-da-gold text-[10px]">i</span>
                Glucose: {zone.glucoseLabel}
                <span className={`transition-transform ${showDetail ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showDetail && (
                <p className="mt-3 text-white/60 text-xs md:text-sm leading-relaxed border-l-2 border-da-gold/40 pl-3">
                  {zone.glucoseDetail}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN
// =============================================================================
function CardioCalculatorActual() {
  const [ageRaw, setAgeRaw] = useState('')
  const [rhrRaw, setRhrRaw] = useState('')

  const age = parseFloat(ageRaw)
  const rhr = parseFloat(rhrRaw)

  const hasResults = age > 0 && rhr > 0
  const mhr = age > 0 ? 220 - age : 0
  const hrr = hasResults ? mhr - rhr : 0

  const reset = () => { setAgeRaw(''); setRhrRaw('') }

  // Numeric-only input handler
  const numericOnly = (val, max = 3) => val.replace(/[^0-9]/g, '').slice(0, max)

  return (
    <div className="bg-da-dark bg-dots min-h-screen">
      <div className="da-container py-16 md:py-20">
        <Link
          to="/free-resources"
          className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-6 inline-block hover:text-da-gold transition"
        >
          ← Back to Free Resources
        </Link>

        <div className="text-center mb-12">
          <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-4">
            ❤️ Cardio Calculator
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] text-white mb-6">
            Heart Rate <span className="text-da-gold">Training Zones</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Find your 5 personalised heart-rate zones using the <strong className="text-da-cyan">Karvonen method</strong> —
            and learn exactly how each zone affects your blood glucose.
          </p>
        </div>

        {/* Inputs */}
        <div className="max-w-3xl mx-auto bg-da-card rounded-2xl p-8 md:p-10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Age *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={ageRaw}
                onChange={(e) => setAgeRaw(numericOnly(e.target.value))}
                placeholder="e.g. 30"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                Resting Heart Rate (bpm) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={rhrRaw}
                onChange={(e) => setRhrRaw(numericOnly(e.target.value))}
                placeholder="e.g. 72"
                className="w-full px-4 py-3 bg-da-darker border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-da-cyan transition"
              />
            </div>
          </div>

          <div className="mt-4 bg-da-darker/50 border border-white/10 rounded-md p-4">
            <p className="text-white/60 text-xs md:text-sm leading-relaxed italic">
              <strong className="text-da-cyan not-italic">How to find your resting heart rate:</strong>{' '}
              First thing in the morning, sit down for 5 minutes, count your pulse for 15 seconds, and multiply
              by 4. For most adults the result is somewhere between 60 and 100 bpm.
            </p>
          </div>

          {hasResults && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                  <div className="text-da-cyan text-[10px] uppercase tracking-wider font-bold mb-1">Max HR</div>
                  <div className="text-2xl font-black text-white">{mhr}<span className="text-xs text-white/40 ml-1">bpm</span></div>
                </div>
                <div className="bg-da-darker rounded-lg p-3 text-center border border-white/10">
                  <div className="text-da-cyan text-[10px] uppercase tracking-wider font-bold mb-1">Resting HR</div>
                  <div className="text-2xl font-black text-white">{rhr}<span className="text-xs text-white/40 ml-1">bpm</span></div>
                </div>
                <div className="bg-da-darker rounded-lg p-3 text-center border border-da-gold/40">
                  <div className="text-da-gold text-[10px] uppercase tracking-wider font-bold mb-1">HR Reserve</div>
                  <div className="text-2xl font-black text-white">{hrr}<span className="text-xs text-white/40 ml-1">bpm</span></div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Button type="button" variant="outline" size="md" onClick={reset}>
                  Reset
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Zone cards */}
        <div className="max-w-3xl mx-auto space-y-3">
          {!hasResults && (
            <div className="bg-da-card rounded-2xl p-12 text-center border border-dashed border-white/10 mb-4">
              <div className="text-6xl mb-4">❤️</div>
              <p className="text-white/60">
                Enter your age and resting heart rate above to see your 5 personalised training zones.
              </p>
            </div>
          )}

          {ZONES.map((zone) => (
            <ZoneCard
              key={zone.num}
              zone={zone}
              age={age}
              rhr={rhr}
              hasResults={hasResults}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto mt-10 p-5 border border-white/10 rounded-xl bg-da-darker/40">
          <p className="text-white/50 text-xs leading-relaxed italic">
            <strong className="text-da-gold not-italic">⚠️ Educational tool — not medical advice.</strong>{' '}
            Heart-rate zones are estimates. The 220 − age formula has natural variability of ±10–15 bpm
            between individuals. For T1Ds: glucose responses to high-intensity work depend heavily on IOB,
            recent meals, stress, sleep, and hormone cycles. Always consult your healthcare provider before
            making changes to your training intensity, especially if you take insulin.
          </p>
        </div>
      </div>
    </div>
  )
}
