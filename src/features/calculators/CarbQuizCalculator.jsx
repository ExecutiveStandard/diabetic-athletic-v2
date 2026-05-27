import { useEffect, useState } from 'react'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function CarbQuizCalculator() {
  return (
    <OptInGate slug="carb-quiz" {...OPT_IN_CONTENT['carb-quiz']}>
      <CarbQuizCalculatorActual />
    </OptInGate>
  )
}

/* ============================================================
   IMAGE MANIFEST
   ============================================================ */

const Q1_IMAGES = [
  { src: '/images/carb-quiz/slide-2-1.jpg', alt: 'Watermelon', label: 'Watermelon' },
  { src: '/images/carb-quiz/slide-2-2.jpg', alt: 'Artisan bread', label: 'Bread' },
  { src: '/images/carb-quiz/slide-2-3.jpg', alt: 'Dark chocolate', label: 'Chocolate' },
  { src: '/images/carb-quiz/slide-2-4.jpg', alt: 'Plain Greek yogurt', label: 'Greek Yogurt' },
]

const Q2_IMAGES = [
  { src: '/images/carb-quiz/slide-5-1.jpg', alt: 'Starches and sugars', correct: true },
  { src: '/images/carb-quiz/slide-5-2.jpg', alt: 'Fats and salt', correct: false },
  { src: '/images/carb-quiz/slide-5-3.jpg', alt: 'Calories and cholesterol', correct: false },
]

const Q3_IMAGES = [
  { src: '/images/carb-quiz/q3-cheese.jpg', alt: 'Cheese', label: 'Cheese', correct: false },
  { src: '/images/carb-quiz/q3-meat.jpg', alt: 'Steak', label: 'Meat', correct: false },
  { src: '/images/carb-quiz/q3-olive-oil.jpg', alt: 'Olive oil', label: 'Olive oil', correct: false },
  { src: '/images/carb-quiz/q3-orange-juice.jpg', alt: 'Fruit juice', label: 'Fruit juice', correct: true },
]

const Q14_IMAGES = [
  { src: '/images/carb-quiz/q14-eggs.jpg', alt: 'Fried eggs', label: 'Eggs', correct: false },
  { src: '/images/carb-quiz/q14-bacon.jpg', alt: 'Bacon', label: 'Bacon', correct: false },
  { src: '/images/carb-quiz/q14-beans.jpg', alt: 'Baked beans', label: 'Baked beans', correct: true },
  { src: '/images/carb-quiz/q14-grilled-tomato.jpg', alt: 'Grilled tomato', label: 'Grilled tomato', correct: true },
  { src: '/images/carb-quiz/q14-mushrooms.jpg', alt: 'Sautéed mushrooms', label: 'Mushrooms', correct: true },
]

/* ============================================================
   NUTRITION LABEL DATA
   Q12 — single product (total ≈ 35 g carbs)
   Q13 — three small servings, sums to 24 g
   ============================================================ */

const NUTRITION_LABEL_Q12 = {
  productName: 'Granola Cereal',
  servingSize: '50 g serving',
  rows: [
    { label: 'Energy',         value: '210 kcal' },
    { label: 'Fat',            value: '6 g' },
    { label: '  of which saturates', value: '1.2 g', indent: true },
    { label: 'Carbohydrate',   value: '35 g', highlight: true },
    { label: '  of which sugars',    value: '12 g', indent: true },
    { label: 'Fibre',          value: '4 g' },
    { label: 'Protein',        value: '5 g' },
    { label: 'Salt',           value: '0.2 g' },
  ],
}

const NUTRITION_LABEL_Q13 = [
  {
    productName: '1 slice wholegrain toast',
    servingSize: '15 g serving',
    rows: [
      { label: 'Energy',       value: '38 kcal' },
      { label: 'Fat',          value: '0.5 g' },
      { label: 'Carbohydrate', value: '4.5 g', highlight: true },
      { label: '  of which sugars', value: '0.4 g', indent: true },
      { label: 'Protein',      value: '1.3 g' },
      { label: 'Salt',         value: '0.1 g' },
    ],
  },
  {
    productName: '1 tsp strawberry jam',
    servingSize: '15 g serving',
    rows: [
      { label: 'Energy',       value: '39 kcal' },
      { label: 'Fat',          value: '0 g' },
      { label: 'Carbohydrate', value: '9.75 g', highlight: true },
      { label: '  of which sugars', value: '9.5 g', indent: true },
      { label: 'Protein',      value: '0.1 g' },
      { label: 'Salt',         value: '0 g' },
    ],
  },
  {
    productName: '1 small Greek yogurt',
    servingSize: '120 g serving',
    rows: [
      { label: 'Energy',       value: '110 kcal' },
      { label: 'Fat',          value: '5 g' },
      { label: 'Carbohydrate', value: '10 g', highlight: true },
      { label: '  of which sugars', value: '9 g', indent: true },
      { label: 'Protein',      value: '6 g' },
      { label: 'Salt',         value: '0.1 g' },
    ],
  },
]

/* ============================================================
   STEPS — the ordered quiz flow
   Each step is one of:
     intro          — start screen
     section-intro  — section title card with "Next"
     image-multi    — multi-select images (with per-question reveal)
     image-single   — single-select images (with retry on wrong)
     high-low       — single image with HIGH/LOW buttons
     calculation    — nutrition label(s) + multiple-choice answer
     finale         — Club promo
   ============================================================ */

const STEPS = [
  { type: 'intro' },

  /* --- Section 1: What contains carbs? --- */
  { type: 'section-intro', section: 1, totalSections: 4,
    title: 'What contains carbs?',
    body: 'The first rule of carb counting is knowing where carbs actually live. Most T1Ds get tripped up here — not because the answer is hard, but because the assumption feels obvious.',
  },
  {
    type: 'image-multi',
    section: 1,
    qLabel: 'Question 1 of 14',
    question: 'Which of these foods contain carbohydrates?',
    hint: 'Pick all you think apply.',
    images: Q1_IMAGES,
    reveal: (selectedCount) => selectedCount === Q1_IMAGES.length
      ? {
          heading: '✅ Correct — they all do.',
          body: (
            <>
              <p className="mb-3">
                Nailed it. The trap most T1Ds fall into is to only count the carbs they can <em>see</em> on a label or recognise on sight. You skipped right past that — picking all four means you already understand the most important rule of carb counting.
              </p>
              <p>
                <strong className="text-da-cyan">Almost every food you eat contains some carbohydrate</strong> — only pure proteins and pure fats are carb-free. The amount varies wildly (a slice of bread vs. a serving of yogurt vs. a piece of watermelon), but the instinct you just demonstrated — assume carbs are present until proven otherwise — is what separates accurate dosing from constant guesswork.
              </p>
            </>
          ),
        }
      : {
          heading: '🎯 Actually — they all do.',
          body: (
            <>
              <p className="mb-3">
                You're not alone. Most T1Ds — even experienced ones — instinctively pick the "obvious" carbs on a plate (the bread, the chocolate) and miss the carbs hiding in fruit (watermelon), dairy (Greek yogurt's natural lactose), sauces, vegetables, and even some "savoury" foods.
              </p>
              <p>
                <strong className="text-da-cyan">Almost every food you eat contains some carbohydrate</strong> — only pure proteins and pure fats are carb-free. The amount varies wildly, but if you only count the carbs you can <em>see</em> on a label or recognise on sight, you're going to mis-dose, and your BG numbers will tell on you later.
              </p>
            </>
          ),
        },
  },
  {
    type: 'image-single',
    section: 1,
    qLabel: 'Question 2 of 14',
    question: 'And which of these IS a carbohydrate?',
    images: Q2_IMAGES,
    revealCorrect: {
      heading: '✅ Correct — starches and sugars.',
      body: (
        <p>
          A carbohydrate is, chemically, a <strong className="text-white">starch or a sugar</strong>. That's it. Everything else on a food label (fat, salt, calories, cholesterol) is a different category. When a label tells you "total carbohydrate," what you're reading is starches + sugars combined.
        </p>
      ),
    },
    wrongMessage: "Carbohydrates aren't fats, salt, calories, or cholesterol — those are different macronutrients and metrics entirely. There's one answer that's the actual chemical definition of a carbohydrate.",
  },
  {
    type: 'image-single',
    section: 1,
    qLabel: 'Question 3 of 14',
    question: 'Which of these contains carbohydrates?',
    hint: 'Only one is right.',
    images: Q3_IMAGES,
    revealCorrect: {
      heading: '✅ Correct — fruit juice.',
      body: (
        <>
          <p className="mb-3">
            Fruit juice is mostly water and <strong className="text-white">sugar</strong> — typically 10–12 g of carbs per 100 ml. A standard glass can easily carry 25 g+. Cheese and meat are protein-and-fat foods (trace carbs at most), and olive oil is pure fat — <strong className="text-white">zero</strong> carbs.
          </p>
          <p>
            This is the practical version of question 2: carbs = starches and sugars. Anywhere you see sugar (juice, sweets, honey), or starch (bread, pasta, rice, potato), there are carbs. Anywhere you see only fat and protein (oil, butter, cheese, meat, eggs), there essentially aren't.
          </p>
        </>
      ),
    },
    wrongMessage: "Not quite. Cheese is mostly protein and fat. Meat is protein and fat. Olive oil is pure fat. There's one item here that's mostly sugar dissolved in water.",
  },

  /* --- Section 2: High vs Low GI --- */
  { type: 'section-intro', section: 2, totalSections: 4,
    title: 'High vs Low GI',
    body: 'Two foods with the same carb count can hit your bloodstream completely differently. Glycemic Index (GI) is the speed dial. Quick gut-check: for each food, is it HIGH GI (fast-acting) or LOW GI (slow-burning)?',
  },
  { type: 'high-low', section: 2, qLabel: 'Question 4 of 14',
    question: 'Fizzy drink (cola)',
    image: { src: '/images/carb-quiz/q4-fizzy-drink.jpg', alt: 'Cola in a glass with ice' },
    answer: 'high',
    revealCorrect: 'Right. Sugar dissolved in water + no fat, fibre, or protein to slow it down = fastest GI on the chart. Expect a sharp glucose spike within minutes.',
    revealWrong: "It's HIGH. Sugar dissolved in water, no fat, no fibre, no protein. Nothing slows it down — it hits the bloodstream almost immediately.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 5 of 14',
    question: 'Fresh tomato',
    image: { src: '/images/carb-quiz/q5-tomato.jpg', alt: 'Ripe red tomato' },
    answer: 'low',
    revealCorrect: 'Right. Mostly water, a little fibre, very few carbs (≈4 g per 100 g). Even when it does raise BG, it barely moves the needle.',
    revealWrong: "It's LOW. Tomatoes are mostly water with a trace of carbs and some fibre — they barely affect blood glucose.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 6 of 14',
    question: 'Cooked pasta',
    image: { src: '/images/carb-quiz/q6-pasta.jpg', alt: 'Bowl of cooked spaghetti' },
    answer: 'high',
    revealCorrect: 'Right. Refined wheat starch breaks down fast. Cooked pasta sits firmly in the HIGH-GI zone — though al dente + protein/fat with the meal will dampen the spike.',
    revealWrong: "It's HIGH. Refined wheat starch breaks down quickly into glucose. Pasta on its own raises BG fast — the meal context (oil, protein, veg) is what softens that in real life.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 7 of 14',
    question: 'Dark chocolate',
    image: { src: '/images/carb-quiz/slide-2-3.jpg', alt: 'Dark chocolate' },
    answer: 'low',
    revealCorrect: "Right — surprises a lot of people. Chocolate is high-sugar but also high-fat, and fat slows digestion dramatically. The carbs go in slow. Most dark chocolate scores LOW GI.",
    revealWrong: "It's LOW — yes, really. Chocolate has plenty of sugar, but it's also full of fat, and fat slows digestion. The carbs arrive slowly. Most chocolate sits in the LOW-GI range.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 8 of 14',
    question: 'Garden peas',
    image: { src: '/images/carb-quiz/q8-peas.jpg', alt: 'Bowl of fresh peas' },
    answer: 'low',
    revealCorrect: 'Right. Peas carry carbs but also plenty of fibre and protein — the fibre/protein slows the carb release. Comfortably LOW GI.',
    revealWrong: "It's LOW. Peas do have carbs, but they also have fibre and protein in the same mouthful — that slows digestion down significantly.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 9 of 14',
    question: 'Jelly sweets',
    image: { src: '/images/carb-quiz/q9-jelly-sweets.jpg', alt: 'Pile of gummy sweets' },
    answer: 'high',
    revealCorrect: "Right. Sugar with effectively zero fat or fibre to slow it. This is why jelly babies are the classic hypo-treatment — they raise BG faster than almost anything else.",
    revealWrong: "It's HIGH. Pure sugar, no fat, no fibre. This is the textbook fast-acting carb — it's literally what diabetes guidance recommends for treating a hypo.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 10 of 14',
    question: 'Watermelon',
    image: { src: '/images/carb-quiz/slide-2-1.jpg', alt: 'Slice of watermelon' },
    answer: 'high',
    revealCorrect: 'Right. Despite being mostly water, the carbs in watermelon are nearly all simple sugars with little fibre to slow them down. HIGH GI per gram of carb.',
    revealWrong: "It's HIGH. Watermelon is mostly water, but the carbs it does contain are almost pure sugar — and there's barely any fibre to slow the release.",
  },
  { type: 'high-low', section: 2, qLabel: 'Question 11 of 14',
    question: 'Whole orange',
    image: { src: '/images/carb-quiz/q11-orange.jpg', alt: 'Whole orange' },
    answer: 'low',
    revealCorrect: "Right. The whole fruit comes packaged with fibre — and that fibre is exactly what's missing from orange juice. Same fruit, different GI. Whole = LOW. Juiced = HIGH.",
    revealWrong: "It's LOW — when whole. The fibre in the flesh slows the sugar release. Juice that same orange and the GI shoots up because you've removed the fibre that was doing the braking.",
  },

  /* --- Section 3: Calculating carbs --- */
  { type: 'section-intro', section: 3, totalSections: 4,
    title: 'Calculating carb content',
    body: 'Knowing what contains carbs is step one. Step two is reading the label and doing the math. Two quick exercises — pull the number off the label, then add a meal together.',
  },
  {
    type: 'calculation',
    section: 3,
    qLabel: 'Question 12 of 14',
    question: 'How many grams of carbohydrate are in one serving of this granola?',
    labels: [NUTRITION_LABEL_Q12],
    options: ['12 g', '35 g', '50 g', '210 g'],
    correct: '35 g',
    revealCorrect: {
      heading: '✅ Correct — 35 g.',
      body: (
        <p>
          You read the right row. The "Carbohydrate" line tells you total carbs per serving — that's the number you dose against. "Of which sugars" is a breakdown, not an extra. "Energy" is calories. "Salt" is salt. Only the carbohydrate row matters for insulin math.
        </p>
      ),
    },
    revealWrong: 'Look for the row labelled "Carbohydrate". Sugars are a breakdown of that number, not additional. Energy and salt are different lines entirely.',
  },
  {
    type: 'calculation',
    section: 3,
    qLabel: 'Question 13 of 14',
    question: "It's breakfast. You're having one slice of toast with jam and a small Greek yogurt. What's the total carb load?",
    hint: 'Add the carbohydrate row from each label.',
    labels: NUTRITION_LABEL_Q13,
    options: ['10 g', '18 g', '24 g', '40 g'],
    correct: '24 g',
    revealCorrect: {
      heading: '✅ Correct — 24 g total.',
      body: (
        <p>
          Toast 4.5 g + jam 9.75 g + yogurt 10 g ≈ <strong className="text-white">24 g</strong>. This is the actual workflow at a real breakfast — pull the carb row off each label, add them up, then dose. The more meals you do this with, the faster it becomes (and the better you get at eyeballing servings without a scale).
        </p>
      ),
    },
    revealWrong: 'Add only the "Carbohydrate" row from each label. Toast ≈ 4.5 g + jam ≈ 9.75 g + yogurt ≈ 10 g.',
  },

  /* --- Section 4: The breakfast test --- */
  { type: 'section-intro', section: 4, totalSections: 4,
    title: 'The breakfast test',
    body: "Last one. You're plating up breakfast. Five common items — but which ones actually carry carbs you'd need to count? Pick everything you think contains carbohydrate.",
  },
  {
    type: 'image-multi',
    section: 4,
    qLabel: 'Question 14 of 14',
    question: 'Which of these breakfast items contain carbohydrates?',
    hint: 'Pick all that apply.',
    images: Q14_IMAGES,
    reveal: (_count, selected) => {
      const correctSelected = selected.filter((s) => s.correct).length
      const wrongSelected = selected.filter((s) => !s.correct).length
      const totalCorrect = Q14_IMAGES.filter((i) => i.correct).length
      const perfect = correctSelected === totalCorrect && wrongSelected === 0
      return perfect
        ? {
            heading: '✅ Perfect — beans, tomato, mushrooms.',
            body: (
              <>
                <p className="mb-3">
                  Three correct picks, zero false positives. You spotted the savoury carbs — the ones that are easiest to forget about when you're plating up a "high-protein" breakfast and don't think to dose for the trimmings.
                </p>
                <p>
                  Beans carry the bulk of the carbs here (≈15 g per small serving), with grilled tomato and mushrooms adding a few more grams each. Eggs and bacon are protein-and-fat — trace carbs at most, not worth counting. <strong className="text-da-cyan">This is what carb-awareness looks like in real life.</strong>
                </p>
              </>
            ),
          }
        : {
            heading: '🎯 The answer: beans, tomato, mushrooms.',
            body: (
              <>
                <p className="mb-3">
                  Eggs and bacon are protein-and-fat — essentially zero carbs. The carbs on this plate live in the trimmings: <strong className="text-white">baked beans</strong> (≈15 g per small serving), <strong className="text-white">grilled tomato</strong>, and <strong className="text-white">mushrooms</strong>.
                </p>
                <p>
                  This is the trap of the "high-protein breakfast" — you assume there's nothing to dose for, then the beans and the trimmings sneak ~20 g of carbs onto your plate. <strong className="text-da-cyan">Always scan the whole plate, not just the centrepiece.</strong>
                </p>
              </>
            ),
          }
    },
  },

  { type: 'finale' },
]

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function CarbQuizCalculatorActual() {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const reset = () => setStepIndex(0)

  // Scroll quiz card into view on each step change.
  // (Long quiz — without this, mobile users who finished one slide find
  // themselves still scrolled to the bottom on the next one.)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (stepIndex === 0) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stepIndex])

  return (
    <div className="min-h-screen bg-da-dark py-12 md:py-16">
      <div className="da-container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-2">
            The <span className="text-da-cyan">Carb</span> Quiz
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            14 questions. About 5 minutes. The foundation of every dosing decision you'll ever make.
          </p>
        </div>

        {/* Progress bar — only on question/section steps */}
        {step.section && (
          <ProgressBar
            section={step.section}
            totalSections={4}
            qLabel={step.qLabel}
          />
        )}

        {/* Quiz card */}
        <div className="bg-da-card rounded-2xl p-6 md:p-10 border-l-4 border-da-cyan min-h-[400px] flex flex-col justify-center">
          {renderStep(step, { next, reset, stepIndex })}
        </div>

        {/* Reset / Start over (only visible when not on intro) */}
        {stepIndex !== 0 && step.type !== 'finale' && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={reset}
              className="text-white/40 text-sm uppercase tracking-wider hover:text-da-cyan transition"
            >
              ↻ Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function renderStep(step, ctx) {
  switch (step.type) {
    case 'intro':
      return <IntroSlide onStart={ctx.next} />
    case 'section-intro':
      return <SectionIntroSlide {...step} onNext={ctx.next} />
    case 'image-multi':
      return <ImageMultiSlide key={ctx.stepIndex} step={step} onNext={ctx.next} />
    case 'image-single':
      return <ImageSingleSlide key={ctx.stepIndex} step={step} onNext={ctx.next} />
    case 'high-low':
      return <HighLowSlide key={ctx.stepIndex} step={step} onNext={ctx.next} />
    case 'calculation':
      return <CalculationSlide key={ctx.stepIndex} step={step} onNext={ctx.next} />
    case 'finale':
      return <ClubPromoSlide />
    default:
      return null
  }
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function ProgressBar({ section, totalSections, qLabel }) {
  const pct = (section / totalSections) * 100
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider mb-2">
        <span className="text-da-cyan font-bold">
          Section {section} of {totalSections}
        </span>
        {qLabel && <span className="text-white/40">{qLabel}</span>}
      </div>
      <div className="h-1.5 bg-da-darker rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-da-cyan to-da-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function IntroSlide({ onStart }) {
  return (
    <div className="text-center">
      <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-2">
        Carbohydrates affect your blood sugar — but <strong className="text-white">not all in the same way</strong>, and not always where you'd expect.
      </p>
      <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
        14 questions across 4 sections — what contains carbs, how fast they hit, how to count them off a label, and how to spot them on a plate. By the end, you'll have done the foundational reps every accurate T1D dosing decision rests on.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-da-cyan to-da-gold text-da-dark px-10 py-4 text-base hover:opacity-95 transition"
      >
        Let's go →
      </button>
    </div>
  )
}

function SectionIntroSlide({ section, totalSections, title, body, onNext }) {
  return (
    <div className="text-center">
      <p className="text-da-gold uppercase tracking-[0.2em] text-xs font-bold mb-3">
        Section {section} of {totalSections}
      </p>
      <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-5 leading-tight">
        {title}
      </h2>
      <p className="text-white/75 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
        {body}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-da-cyan to-da-gold text-da-dark px-10 py-4 text-base hover:opacity-95 transition"
      >
        Start section →
      </button>
    </div>
  )
}

/* ---------- Image MULTI-select question ---------- */
function ImageMultiSlide({ step, onNext }) {
  const [selected, setSelected] = useState([])
  const [revealed, setRevealed] = useState(null)

  if (revealed) {
    return <RevealSlide {...revealed} cta="Next →" onNext={onNext} />
  }

  const isSelected = (img) => selected.some((s) => s.src === img.src)
  const toggle = (img) => {
    setSelected((prev) =>
      prev.some((s) => s.src === img.src)
        ? prev.filter((s) => s.src !== img.src)
        : [...prev, img],
    )
  }

  const submit = () => {
    if (selected.length === 0) return
    setRevealed(step.reveal(selected.length, selected))
  }

  return (
    <ImageGrid
      question={step.question}
      hint={step.hint}
      images={step.images}
      isSelected={isSelected}
      onTap={toggle}
      submit={submit}
      submitLabel={
        selected.length === 0
          ? 'Select one or more images above'
          : `Submit ${selected.length} ${selected.length === 1 ? 'answer' : 'answers'} →`
      }
      submitDisabled={selected.length === 0}
    />
  )
}

/* ---------- Image SINGLE-select question (with retry on wrong) ---------- */
function ImageSingleSlide({ step, onNext }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showWrongNote, setShowWrongNote] = useState(false)

  if (submitted && selected?.correct) {
    return <RevealSlide {...step.revealCorrect} cta="Next →" onNext={onNext} />
  }

  const isSelected = (img) => selected?.src === img.src

  const tap = (img) => {
    setSelected(img)
    setShowWrongNote(false)
  }

  const submit = () => {
    if (!selected) return
    if (selected.correct) {
      setSubmitted(true)
    } else {
      setShowWrongNote(true)
      setSelected(null)
    }
  }

  return (
    <>
      {showWrongNote && (
        <div className="mb-4 bg-da-darker border-l-4 border-red-400/70 rounded-md px-4 py-3">
          <p className="text-red-300 text-sm md:text-base">
            <strong>Not quite.</strong> {step.wrongMessage}
          </p>
        </div>
      )}
      <ImageGrid
        question={step.question}
        hint={step.hint}
        images={step.images}
        isSelected={isSelected}
        onTap={tap}
        submit={submit}
        submitLabel={selected ? 'Submit answer →' : 'Select an image above'}
        submitDisabled={!selected}
      />
    </>
  )
}

/* ---------- Shared image grid renderer ---------- */
function ImageGrid({ question, hint, images, isSelected, onTap, submit, submitLabel, submitDisabled }) {
  const cols = images.length === 4
    ? 'grid-cols-2 md:grid-cols-4'
    : images.length === 5
    ? 'grid-cols-2 md:grid-cols-5'
    : 'grid-cols-3'
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2 leading-tight">
        {question}
      </h2>
      {hint ? (
        <p className="text-da-cyan/80 text-sm text-center mb-6 italic">{hint}</p>
      ) : (
        <div className="mb-6" />
      )}
      <div className={`grid gap-3 md:gap-4 ${cols}`}>
        {images.map((img) => {
          const sel = isSelected(img)
          return (
            <button
              key={img.src}
              type="button"
              onClick={() => onTap(img)}
              aria-label={img.alt}
              aria-pressed={sel}
              className={`block bg-da-darker border-2 rounded-xl overflow-hidden focus:outline-none transition group relative ${
                sel
                  ? 'border-da-cyan ring-2 ring-da-cyan/50 shadow-lg shadow-da-cyan/20'
                  : 'border-white/10 hover:border-da-cyan/60'
              }`}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className={`w-full h-full object-cover transition duration-300 ${
                    sel ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                />
              </div>
              {img.label && (
                <div className={`px-2 py-2 md:py-3 text-center border-t transition ${
                  sel ? 'bg-da-cyan/15 border-da-cyan/40' : 'bg-da-darker border-white/10'
                }`}>
                  <span className={`font-bold text-xs md:text-base tracking-wide ${sel ? 'text-da-cyan' : 'text-white'}`}>
                    {img.label}
                  </span>
                </div>
              )}
              {sel && (
                <div className="absolute top-2 right-2 bg-da-cyan text-da-dark rounded-full w-7 h-7 flex items-center justify-center font-black text-sm shadow-md">
                  ✓
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={submit}
          disabled={submitDisabled}
          className={`inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md px-10 py-4 text-base transition ${
            submitDisabled
              ? 'bg-da-darker text-white/30 cursor-not-allowed border border-white/10'
              : 'bg-gradient-to-r from-da-cyan to-da-gold text-da-dark hover:opacity-95 cursor-pointer'
          }`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

/* ---------- HIGH / LOW GI question ---------- */
function HighLowSlide({ step, onNext }) {
  const [answer, setAnswer] = useState(null)
  const [wrongTry, setWrongTry] = useState(null)

  if (answer === step.answer) {
    const heading = step.answer === 'high'
      ? '✅ HIGH GI — correct.'
      : '✅ LOW GI — correct.'
    return (
      <RevealSlide
        heading={heading}
        body={<p>{step.revealCorrect}</p>}
        cta="Next →"
        onNext={onNext}
      />
    )
  }

  const pick = (choice) => {
    if (choice === step.answer) {
      setAnswer(choice)
    } else {
      setWrongTry(choice)
    }
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-1 leading-tight">
        {step.question}
      </h2>
      <p className="text-white/50 text-sm text-center mb-6 italic">
        High GI or Low GI?
      </p>
      <div className="max-w-sm mx-auto mb-6">
        <div className="aspect-square overflow-hidden rounded-xl border-2 border-white/10 bg-da-darker">
          <img
            src={step.image.src}
            alt={step.image.alt}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      {wrongTry && (
        <div className="mb-4 bg-da-darker border-l-4 border-red-400/70 rounded-md px-4 py-3 max-w-xl mx-auto">
          <p className="text-red-300 text-sm md:text-base">
            <strong>Not quite.</strong> {step.revealWrong}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => pick('high')}
          className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-da-darker border-2 border-da-gold/40 text-da-gold hover:bg-da-gold/10 hover:border-da-gold transition px-6 py-4 text-base"
        >
          High GI
        </button>
        <button
          type="button"
          onClick={() => pick('low')}
          className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-da-darker border-2 border-da-cyan/40 text-da-cyan hover:bg-da-cyan/10 hover:border-da-cyan transition px-6 py-4 text-base"
        >
          Low GI
        </button>
      </div>
      {wrongTry && (
        <p className="text-white/50 text-xs text-center mt-3 italic">
          Try the other one.
        </p>
      )}
    </div>
  )
}

/* ---------- CALCULATION question (nutrition labels + MC answer) ---------- */
function CalculationSlide({ step, onNext }) {
  const [selected, setSelected] = useState(null)
  const [wrongTry, setWrongTry] = useState(false)

  if (selected === step.correct) {
    return <RevealSlide {...step.revealCorrect} cta="Next →" onNext={onNext} />
  }

  const pick = (opt) => {
    if (opt === step.correct) {
      setSelected(opt)
    } else {
      setWrongTry(true)
    }
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2 leading-tight">
        {step.question}
      </h2>
      {step.hint && (
        <p className="text-da-cyan/80 text-sm text-center mb-6 italic">{step.hint}</p>
      )}
      {!step.hint && <div className="mb-6" />}

      <div className={`grid gap-4 mb-6 ${step.labels.length > 1 ? 'md:grid-cols-3' : 'max-w-sm mx-auto'}`}>
        {step.labels.map((label, i) => (
          <NutritionLabel key={i} {...label} />
        ))}
      </div>

      {wrongTry && (
        <div className="mb-4 bg-da-darker border-l-4 border-red-400/70 rounded-md px-4 py-3 max-w-xl mx-auto">
          <p className="text-red-300 text-sm md:text-base">
            <strong>Not quite.</strong> {step.revealWrong}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {step.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => pick(opt)}
            className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-da-darker border-2 border-white/10 text-white hover:border-da-cyan hover:bg-da-cyan/10 hover:text-da-cyan transition px-4 py-4 text-base"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function NutritionLabel({ productName, servingSize, rows }) {
  return (
    <div className="bg-white text-da-dark rounded-lg overflow-hidden shadow-lg">
      <div className="bg-da-dark text-white px-4 py-3">
        <p className="font-black uppercase tracking-wider text-sm leading-tight">{productName}</p>
        <p className="text-white/60 text-xs mt-0.5">Nutrition — {servingSize}</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`${row.highlight ? 'bg-da-cyan/15 font-bold' : ''} ${
                i < rows.length - 1 ? 'border-b border-da-dark/10' : ''
              }`}
            >
              <td className={`px-3 py-1.5 ${row.indent ? 'pl-6 text-da-dark/70 text-xs' : ''}`}>
                {row.label.replace(/^\s+/, '')}
              </td>
              <td className={`px-3 py-1.5 text-right ${row.indent ? 'text-da-dark/70 text-xs' : ''}`}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RevealSlide({ heading, body, cta, onNext }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-black text-white mb-4">{heading}</h2>
      <div className="text-white/80 text-base md:text-lg leading-relaxed mb-6 text-left max-w-xl mx-auto">
        {body}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-da-cyan to-da-gold text-da-dark px-10 py-4 text-base hover:opacity-95 transition"
      >
        {cta}
      </button>
    </div>
  )
}

function ClubPromoSlide() {
  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">🏆 You've finished the quiz</p>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
          The <span className="text-da-cyan">Diabetic Athletic</span> <span className="text-da-gold">Club</span>
        </h2>
        <p className="text-white/70 text-base md:text-lg">
          The closest thing to private coaching, at a fraction of the cost.
        </p>
      </div>

      <div className="space-y-4 text-white/85 text-sm md:text-base leading-relaxed">
        <p>
          You've just done the foundational reps — recognising carbs on a plate, predicting GI, reading a label, and adding a meal together. The Club is where you turn those reps into a <strong className="text-white">whole-life system</strong>: training, nutrition, dosing, recovery, mindset.
        </p>
        <p>
          One mission: <strong className="text-white">help 1,000 Type 1 diabetics become athletic ones</strong> — fully confident in how they approach nutrition, medication, and exercise, so that diabetes shifts from being the loudest, most stressful part of their day to the smallest and quietest.
        </p>
        <p>
          You go from <em>managing your glucose levels</em> to <em>confidently managing your diabetes</em> — the way an athlete manages their training.
        </p>

        <div className="bg-da-darker rounded-xl p-5 md:p-6 my-4 border-l-2 border-da-cyan/60">
          <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-3">What's inside the Club</p>
          <ul className="space-y-2 text-white/85 text-sm md:text-base">
            <li><span className="text-da-cyan font-bold">✓</span> A custom, <strong className="text-white">bespoke training program</strong> built around your goals, updated for you every month</li>
            <li><span className="text-da-cyan font-bold">✓</span> A custom, <strong className="text-white">bespoke nutrition plan</strong> built around your body, your activity, and your dosing — updated monthly</li>
            <li><span className="text-da-cyan font-bold">✓</span> Full access to <strong className="text-white">The Value Vault</strong> — every masterclass we've ever recorded</li>
          </ul>
        </div>

        <p className="text-da-cyan uppercase tracking-wider text-xs font-bold mb-2">Masterclasses you'll get access to include:</p>
        <ul className="space-y-1 text-white/80 text-sm md:text-base ml-4 list-disc list-outside marker:text-da-gold">
          <li>The Diabetic Athletic <strong className="text-white">Carb Counting</strong> Masterclass</li>
          <li>The <strong className="text-white">Exercise & Diabetes</strong> Masterclass</li>
          <li>The <strong className="text-white">Emotional IQ</strong> Masterclass</li>
          <li>The <strong className="text-white">Insulin Sensitivity</strong> Masterclass</li>
          <li>The <strong className="text-white">Advanced Carb Counting</strong> Masterclass</li>
          <li className="text-white/60 italic">…and many more, added as we record them</li>
        </ul>

        <div className="text-center pt-6">
          <a
            href="https://club.diabeticathletic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-da-cyan to-da-gold text-da-dark px-12 py-5 text-base md:text-lg hover:opacity-95 transition shadow-lg shadow-da-cyan/20"
          >
            Explore the Club →
          </a>
          <p className="text-white/40 text-xs mt-3 italic">
            Goes to <span className="text-white/60">club.diabeticathletic.com</span> — opens in a new tab
          </p>
        </div>
      </div>
    </div>
  )
}
