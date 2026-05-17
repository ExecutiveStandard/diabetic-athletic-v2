// Per-calculator opt-in copy + placeholder visuals.
// Keyed by slug — matches the slugs used in App.jsx routes and the
// localStorage flag keys (optin:<slug>).
export const OPT_IN_CONTENT = {
  calorie: {
    headline: 'Your Personalized Daily Calorie Target',
    subhead: 'Stop guessing what to eat. Get a precise calorie and macro target built around your real body, your real activity, and your real goals — in 60 seconds.',
    bullets: [
      'Calculate your true TDEE using the Mifflin-St Jeor formula',
      'Get personalized protein, fat, and carb targets for your goal',
      'Built-in macro breakdown — see what your day should actually look like',
      'Designed for T1Ds ready to eat with purpose',
    ],
    ctaText: 'Get My Calorie Target',
    placeholderIcon: '🔥',
    placeholderTagline: 'Your daily target, dialed in',
  },
  protein: {
    headline: 'How Much Protein Does Your Body Actually Need?',
    subhead: "Generic protein recommendations don't account for living with Type 1 diabetes. Get a target built for your body, your activity level, and your goals.",
    bullets: [
      'Calculated using body fat % for accuracy, not just bodyweight',
      'Adjusts for your activity — from light to intense',
      'Built specifically for the T1D body',
      'Visual body-fat reference guide built in',
    ],
    ctaText: 'Get My Protein Target',
    placeholderIcon: '🥩',
    placeholderTagline: 'Built for your body, not the average one',
  },
  'magic-ratio': {
    headline: 'Discover Your Magic Insulin Ratios',
    subhead: 'Stop guessing your I:C and ISF. Get calibrated starting points for your insulin-to-carb ratio and insulin sensitivity factor — built on proven T1D dosing math — then refine them with real-world data.',
    bullets: [
      'Calculates ISF and I:C ratios for morning, afternoon, and evening',
      'Beginner mode for fast estimates; Advanced mode for personalization',
      'Factors in body fat %, training status, sex, and cycle phase',
      'For T1Ds who treat dosing as a skill to master',
    ],
    ctaText: 'Find My Magic Ratios',
    placeholderIcon: '💉',
    placeholderTagline: 'Your starting points, calibrated',
  },
  cardio: {
    headline: 'Predict Your Glucose Response — By Heart Rate Zone',
    subhead: "Cardio isn't just cardio. The intensity you train at determines whether your BG drops, holds steady, or spikes. Find your personalized heart rate zones and see what each one will do to your glucose — before you lace up.",
    bullets: [
      'Calculates your personalized heart rate zones',
      'Predicts your glucose response at each zone (drop, hold, or spike)',
      'Shows why intensity — not just exercise — drives BG changes',
      'For T1Ds ready to train smarter',
    ],
    ctaText: 'See My Glucose Response',
    placeholderIcon: '❤️',
    placeholderTagline: 'Intensity matters. See why.',
  },
  'pre-workout-glucose': {
    headline: 'Fuel Your Workout. Skip the BG Crash.',
    subhead: "Stop the guesswork before you train. Calculate exactly what to eat (and how much insulin to take or skip) before your next session — built around your body, your insulin, and the workout you're about to do.",
    bullets: [
      'Carbs + insulin adjustment for your specific pre-workout glucose',
      'Adapts for resistance, HIIT, and aerobic zone sessions',
      'Accounts for insulin on board (IOB)',
      'Personalizes for sex, cycle, training status, and fasted vs fed',
    ],
    ctaText: 'Calculate My Pre-Workout',
    placeholderIcon: '⚡',
    placeholderTagline: 'Train with confidence, not guesswork',
  },
  'meal-frequency': {
    headline: 'How Many Meals Should You Eat Today?',
    subhead: 'On training days, around-workout fueling changes everything. Get a meal frequency and timing plan built around your training schedule and total daily intake.',
    bullets: [
      "Calculates optimal meal count for your day's calorie target",
      'Adjusts for training days vs rest days',
      'Peri-workout meal weighting baked in',
      'Tuned to the timing demands of T1D management',
    ],
    ctaText: 'Plan My Meals',
    placeholderIcon: '🍴',
    placeholderTagline: 'Meal timing that serves your training',
  },
}
