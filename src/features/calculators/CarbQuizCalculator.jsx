import { useState } from 'react'
import OptInGate from '../../components/OptInGate'
import { OPT_IN_CONTENT } from './optInContent'

export default function CarbQuizCalculator() {
  return (
    <OptInGate slug="carb-quiz" {...OPT_IN_CONTENT['carb-quiz']}>
      <CarbQuizCalculatorActual />
    </OptInGate>
  )
}

// 8 quiz states. Picking a correct/educational image leads forward;
// picking a "wrong" image in Q2 loops back to retry.
//
// Slide flow:
//   intro → q1 → reveal-all-have-carbs → q2 → result
//   q1 picks: any image → reveal (Q1 is a trick — all foods have carbs)
//   q2 picks: image-1 = correct → q2-correct → finale
//              image-2/3 = wrong  → q2-wrong → loop back to q2
const SLIDES = {
  INTRO: 'intro',
  Q1: 'q1',
  Q1_REVEAL: 'q1-reveal',
  Q2: 'q2',
  Q2_WRONG: 'q2-wrong',
  Q2_CORRECT: 'q2-correct',
  FINALE: 'finale',
}

// Q1 images carry a visible `label` so users always know what each food
// is — important for the less-obvious ones (Greek yogurt) and useful for
// accessibility on the obvious ones. Q2 images have their text built
// into the image itself (the placard signs) so no label needed there.
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

function CarbQuizCalculatorActual() {
  const [slide, setSlide] = useState(SLIDES.INTRO)

  const reset = () => setSlide(SLIDES.INTRO)

  return (
    <div className="min-h-screen bg-da-dark py-12 md:py-16">
      <div className="da-container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-3">
            The <span className="text-da-cyan">Carb</span> Quiz
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Two questions. Sixty seconds. One lesson that changes how you read food labels.
          </p>
        </div>

        {/* Quiz card */}
        <div className="bg-da-card rounded-2xl p-6 md:p-10 border-l-4 border-da-cyan min-h-[400px] flex flex-col justify-center">
          {slide === SLIDES.INTRO && (
            <IntroSlide onStart={() => setSlide(SLIDES.Q1)} />
          )}

          {slide === SLIDES.Q1 && (
            <ImageQuestionSlide
              question="Choose the food that contains carbohydrates."
              images={Q1_IMAGES}
              onPick={() => setSlide(SLIDES.Q1_REVEAL)}
            />
          )}

          {slide === SLIDES.Q1_REVEAL && (
            <RevealSlide
              heading="🎯 They all do."
              body={
                <>
                  <p className="mb-3">
                    Surprised? You're not alone. Most T1Ds — even experienced ones — instinctively pick the "obvious" carb on a plate (the bread, the chocolate) and miss the carbs hiding in fruit (watermelon), dairy (Greek yogurt's natural lactose), sauces, vegetables, and even some "savoury" foods.
                  </p>
                  <p>
                    <strong className="text-da-cyan">Almost every food you eat contains some carbohydrate</strong> — only pure proteins and pure fats are carb-free. The amount varies wildly, but if you only count the carbs you can <em>see</em> on a label or recognise on sight, you're going to mis-dose, and your BG numbers will tell on you later.
                  </p>
                </>
              }
              cta="Next question"
              onNext={() => setSlide(SLIDES.Q2)}
            />
          )}

          {slide === SLIDES.Q2 && (
            <ImageQuestionSlide
              question="And which of these IS a carbohydrate?"
              images={Q2_IMAGES}
              onPick={(img) => setSlide(img.correct ? SLIDES.Q2_CORRECT : SLIDES.Q2_WRONG)}
            />
          )}

          {slide === SLIDES.Q2_WRONG && (
            <RevealSlide
              heading="❌ Not quite — look again."
              body={
                <p>
                  Carbohydrates aren't fats, salt, calories, or cholesterol — those are different macronutrients and metrics entirely. There's one answer that's the actual chemical definition of a carbohydrate.
                </p>
              }
              cta="Try again"
              onNext={() => setSlide(SLIDES.Q2)}
            />
          )}

          {slide === SLIDES.Q2_CORRECT && (
            <RevealSlide
              heading="✅ Correct — starches and sugars."
              body={
                <>
                  <p className="mb-3">
                    A carbohydrate is, chemically, a <strong className="text-white">starch or a sugar</strong>. That's it. Everything else on a food label (fat, salt, calories, cholesterol) is a different category. When a label tells you "total carbohydrate," what you're reading is starches + sugars combined.
                  </p>
                  <p>
                    Knowing what carbs ARE is half the battle. Knowing <em>how much</em> they raise your specific blood glucose — and how to time the insulin around them — is the other half. That's the work most T1Ds never get formally taught. And it's exactly what we systematise inside <strong className="text-white">The Diabetic Athletic Club</strong>.
                  </p>
                </>
              }
              cta="See what's inside the Club →"
              onNext={() => setSlide(SLIDES.FINALE)}
            />
          )}

          {slide === SLIDES.FINALE && <ClubPromoSlide />}
        </div>

        {/* Reset / Start over (only visible when not on intro) */}
        {slide !== SLIDES.INTRO && (
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

function IntroSlide({ onStart }) {
  return (
    <div className="text-center">
      <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-2">
        Carbohydrates affect your blood sugar — but <strong className="text-white">not all in the same way</strong>, and not always where you'd expect.
      </p>
      <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
        This quiz takes about a minute. By the end, you'll know one of the most-missed truths in T1D carb counting.
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

function ImageQuestionSlide({ question, images, onPick }) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6 leading-tight">
        {question}
      </h2>
      <div className={`grid gap-3 md:gap-4 ${images.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
        {images.map((img) => (
          <button
            key={img.src}
            type="button"
            onClick={() => onPick(img)}
            className="block bg-da-darker border-2 border-white/10 rounded-xl overflow-hidden hover:border-da-cyan focus:border-da-cyan focus:outline-none transition group"
            aria-label={img.alt}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            {img.label && (
              <div className="px-2 py-2 md:py-3 text-center bg-da-darker border-t border-white/10">
                <span className="text-white font-bold text-sm md:text-base tracking-wide">
                  {img.label}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-white/40 text-xs text-center mt-4 italic">
        Tap an image to submit your answer
      </p>
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
          The Diabetic Athletic Club is built around one mission: <strong className="text-white">help 1,000 Type 1 diabetics become athletic ones</strong> — fully confident in how they approach nutrition, medication, and exercise, so that diabetes shifts from being the loudest, most stressful part of their day to the smallest and quietest.
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
