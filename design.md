# Diabetic Athletic Website Design Document

## Project Overview

**Goal:** Recreate the Diabetic Athletic coaching platform as a modern React + Firebase web application with feature parity to the original site. Build a motion-ready architecture that scales for future interactive features (Framer Motion, Three.js, Webflow-style animations).

**Tech Stack:** Vite + React, Zustand state, TailwindCSS, Firebase SDK (Firestore, Hosting, Auth), Framer Motion (Phase 2)

**Timeline:** Initial MVP (Phases 1-2) over 4-6 weeks, iterative feature launches

---

## Architecture

### High-Level System Design

```
User Browser
    ↓
React SPA (Vite build)
    ├── Static Pages (JSON) → Fast load
    ├── Dynamic Content ← Firestore
    ├── Newsletter Signup → Firebase Function → Email Service
    └── External Links → Calendly, Typeform
    ↓
Firebase (Backend)
    ├── Firestore (Blog, Calculators, Newsletter Signups)
    ├── Cloud Functions (Email sending, validations)
    ├── Hosting (SPA + 404 handling)
    └── Analytics (GA4)
```

### Project Structure

```
src/
├── features/                    # Feature-based modules
│   ├── hero/                    # Homepage hero section
│   │   ├── Hero.jsx
│   │   └── hero.module.css
│   ├── journey/                 # Step 01-04 cards
│   │   ├── JourneySection.jsx
│   │   ├── JourneyCard.jsx
│   │   └── journey.module.css
│   ├── blog/                    # Blog listing + individual posts
│   │   ├── BlogList.jsx
│   │   ├── BlogPost.jsx
│   │   └── blog.module.css
│   ├── calculators/             # Interactive tools
│   │   ├── CalorieCalc.jsx
│   │   ├── ProteinCalc.jsx
│   │   └── calc.module.css
│   └── newsletter/              # Email signup form
│       ├── NewsletterForm.jsx
│       └── newsletter.module.css
├── components/                  # Global/shared components
│   ├── Nav.jsx
│   ├── Footer.jsx
│   ├── Button.jsx
│   ├── Modal.jsx
│   └── LoadingSpinner.jsx
├── lib/                         # Utilities & services
│   ├── firebase.js              # Firebase config & initialization
│   ├── content.js               # Firestore queries (blog, calculators)
│   ├── newsletter.js            # Newsletter signup logic
│   ├── validators.js            # Form validation, email validation
│   └── utils.js                 # Helper functions
├── store/                       # Zustand state management
│   ├── appStore.js              # Global app state (user, modals)
│   └── newsletterStore.js       # Newsletter form state
├── data/                        # Static JSON content
│   ├── home.json                # Hero, journey cards, coach bio
│   ├── pages.json               # About, Free Resources, Terms, Privacy
│   └── programs.json            # Program descriptions
├── App.jsx                      # Main router & layout
├── main.jsx                     # Entry point
└── index.css                    # Global styles (minimal)

public/
├── favicon.ico
├── og-image.png                 # Social media preview
└── ...assets

firebase/
├── firestore.rules              # Security rules
└── functions/
    ├── newsletter.js            # Cloud Function for email signup
    └── index.js

vite.config.js
firebase.json
package.json
.env.local                       # Firebase config (local)
.env.production                  # Firebase config (prod)
```

---

## Technology Decisions

### Vite (Build Tool)
- **Why:** Fast dev server with instant HMR, optimized production builds, zero config out-of-box
- **vs. Create React App:** Vite is 5-10x faster, CRA is legacy and slow
- **vs. Next.js:** Vite is simpler for a marketing SPA; Next.js adds complexity we don't need yet

### React (UI Library)
- **Why:** Battle-tested, component-based architecture, ecosystem of motion/animation libraries
- **Critical for Phase 2:** Framer Motion, React Three Fiber (Three.js), Lottie animations

### Zustand (State Management)
- **Why:** Minimal boilerplate, easy to reason about, tiny bundle impact (~4kb)
- **vs. Redux:** Overkill for this scope; Redux adds 100+ lines of config for simple state
- **vs. Context API:** Context is fine, but Zustand is cleaner for subscription-based updates

### TailwindCSS (Styling)
- **Why:** Production-optimized (tree-shaking), utility-first is fast to develop, built-in dark mode support (Phase 2)
- **Feature scope CSS Modules:** Feature-specific styles in `feature.module.css` to avoid global conflicts
- **vs. Styled Components:** Styled Components adds JS runtime cost; Tailwind is static

### Firestore (Database)
- **Why:** Real-time, serverless, integrates directly with Firebase SDK, generous free tier
- **Collections:** `blog_posts`, `calculators`, `newsletter_signups`
- **Schema:** Flat structure (no nested docs) for efficient querying
- **Security:** Read-only for public posts, write-restricted for signups

### Firebase Hosting
- **Why:** Native Firebase integration, instant deploys, CDN-backed, SSL included, 404 handling for SPA
- **vs. Vercel:** Vercel is great, but Firebase Hosting keeps everything in one ecosystem

### Cloud Functions (Email)
- **Why:** Serverless, event-driven, integrates with Firestore triggers
- **Implementation:** Trigger on newsletter signup → call SendGrid/Mailchimp API → send confirmation email
- **Security:** Function validates email, deduplicates signups, rate-limits requests

### Framer Motion (Phase 2)
- **Why:** React-native animation library, perfect for complex interactions
- **Timeline:** After MVP launch; add animations to hero, journey cards, scroll effects
- **Examples:** Fade-in on scroll, parallax hero, animated counters, modal transitions

---

## Brand Design System

### Color Palette
Your brand uses a sophisticated 3-color system:
- **#221E1F** — Dark charcoal/black (primary, all text and backgrounds)
- **#46C0ED** — Cyan/light blue (primary accent, CTAs, highlights)
- **#FCC826** — Gold/yellow (secondary accent, alerts, progress indicators)

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      'da-dark': '#221E1F',
      'da-cyan': '#46C0ED',
      'da-gold': '#FCC826',
      'white': '#FFFFFF',
      'gray': {
        50: '#F5F5F5',
        100: '#EBEBEB',
        // ... standard grays for borders, dividers
      }
    }
  }
}
```

### Typography System

**Font:** Lato (from Google Fonts, weights: 400, 700, 900)

**Scale:**
- **H1 (Headline):** Lato Bold, ALL CAPS, 30pt letter-spacing, 48px
- **H2 (Section):** Lato Bold, ALL CAPS, 32px
- **H3 (Subsection):** Lato Bold, 28px
- **Body Copy:** Lato Regular, 16px, line-height 1.6
- **Button Text:** Lato Bold, 14px

### Logo System

**Files available** (from Google Drive):
- Color lockup (full logo with text, use primary)
- Mono lockup (single color, use on colored backgrounds)
- Wordmark (text-only logo)
- Brand mark (icon only, for favicon/social)

**Usage Rules:**
- ✅ Use as-is in provided colorways
- ✅ Scale proportionally
- ❌ DO NOT stretch, rotate, or skew
- ❌ DO NOT add effects (drop shadow, stroke, etc.)

**Placement:**
- Header: Color lockup (responsive sizing)
- Favicon: Brand mark (32x32px)
- Social profiles: Provided Instagram/Facebook logos

### Component Styling

**Primary CTA Button (Cyan)**
```css
.btn-primary {
  background: #46C0ED;
  color: #221E1F;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 4px;
  transition: opacity 0.2s ease;
}
.btn-primary:hover {
  opacity: 0.9;
}
```

**Secondary Button (Gold)**
```css
.btn-secondary {
  background: #FCC826;
  color: #221E1F;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 4px;
}
```

**Section Divider**
```css
.divider {
  background: linear-gradient(90deg, #46C0ED 0%, #FCC826 100%);
  height: 4px;
  margin: 40px 0;
}
```

**Card (Journey, Blog)**
```css
.card {
  background: white;
  border: 1px solid #EBEBEB;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
```

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Spacing XS | 4px | Tight spacing |
| Spacing SM | 8px | Default |
| Spacing MD | 16px | Components |
| Spacing LG | 24px | Sections |
| Spacing XL | 40px | Major sections |
| Radius SM | 4px | Button corners |
| Radius MD | 8px | Card corners |
| Shadow SM | 0 1px 3px rgba(0,0,0,0.1) | Subtle |
| Shadow MD | 0 4px 6px rgba(0,0,0,0.15) | Cards |

---

## Data Flow

### Newsletter Signup Flow
```
1. User enters email in NewsletterForm
2. Form validates (email format, length)
3. Submit → Zustand action dispatches
4. POST /api/newsletter-signup (Cloud Function)
5. Function:
   - Validates email
   - Checks for duplicates in Firestore
   - Creates document in newsletter_signups collection
   - Calls SendGrid API to send confirmation email
   - Returns { success: true }
6. Frontend receives response
7. Show success message: "Check your email"
8. Optionally: trigger confetti animation
```

### Blog Post Fetch Flow
```
1. User navigates to /blog or individual post
2. Component mounts → React effect
3. Calls lib/content.js → getBlogPosts() or getBlogPost(slug)
4. Query Firestore: `blog_posts` collection
   - Filter: published = true
   - Sort: date descending
5. Results cached in Zustand
6. Component renders blog cards or full post
7. Error: show 404 page
```

### Calculator Flow
```
1. User navigates to /calculators/calorie
2. Component mounts → fetch calculator config from Firestore
3. Render form based on config fields
4. User inputs values
5. Click "Calculate" → invoke formula
6. Display results
7. User can "Share" or "Subscribe for more"
```

---

## Firebase Setup

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Blog posts: public read, admin write
    match /blog_posts/{postId} {
      allow read: if resource.data.published == true;
      allow create, update, delete: if request.auth.uid in ['admin-uid'];
    }
    
    // Newsletter signups: no direct read, restricted write
    match /newsletter_signups/{docId} {
      allow create: if request.resource.data.email != null;
      allow read, update, delete: if false;
    }
    
    // Calculators: public read, admin write
    match /calculators/{calcId} {
      allow read: if resource.data.published == true;
      allow create, update, delete: if request.auth.uid in ['admin-uid'];
    }
  }
}
```

### Cloud Function (Newsletter Signup)
```javascript
// functions/newsletter.js
exports.newsletterSignup = onRequest(async (req, res) => {
  const { email } = req.body;
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // Check for duplicates
  const existing = await db.collection('newsletter_signups')
    .where('email', '==', email)
    .get();
  
  if (!existing.empty) {
    return res.status(409).json({ error: 'Already subscribed' });
  }
  
  // Create signup record
  const docRef = await db.collection('newsletter_signups').add({
    email,
    subscribed_at: admin.firestore.FieldValue.serverTimestamp(),
    source: req.body.source || 'unknown',
    status: 'pending'
  });
  
  // Send email via SendGrid
  await sendConfirmationEmail(email);
  
  return res.json({ success: true, id: docRef.id });
});
```

---

## Development Workflow

### Phase 1: Foundation (Weeks 1-2)
- [ ] Scaffold Vite + React project
- [ ] Configure Firebase project & Firestore
- [ ] Set up Zustand stores
- [ ] Build core components (Nav, Footer, Button, Modal)
- [ ] Build hero feature
- [ ] Build journey cards feature
- [ ] Newsletter signup integration

### Phase 2: Content & Tools (Weeks 3-4)
- [ ] Build blog feature (listing + individual posts)
- [ ] Firestore integration for blog queries
- [ ] Build calculator features (Calorie, Protein)
- [ ] Free Resources page
- [ ] About page
- [ ] Deploy to Firebase Hosting

### Phase 3: Polish & Motion (Weeks 5-6)
- [ ] Add Framer Motion animations
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Analytics setup (GA4)
- [ ] SEO optimization (meta tags, Open Graph)
- [ ] Testing (unit + integration)

### Phase 4+: Future (Post-MVP)
- [ ] User accounts & authentication
- [ ] Course enrollment & progress tracking
- [ ] Three.js for interactive 3D elements
- [ ] Advanced animations & WebGL effects
- [ ] Member dashboard

---

## Error Handling Strategy

### Frontend Errors
- Form validation: Show inline error messages
- API failures: Toast notifications + retry buttons
- Network errors: "Something went wrong. Try again." message
- Firestore errors: Log to console, show user-friendly message

### Backend Errors
- Cloud Function validation: Reject invalid inputs with 400 status
- Email send failures: Log error, notify admin, retry queue (Phase 2)
- Firestore write failures: Transaction rollback, return error to client

### User Feedback
- Loading states: Show spinner during form submission
- Success states: Confirmation message + confetti (Phase 2)
- Error states: Clear, actionable error messages

---

## Performance Goals

- **Lighthouse:** 90+ on Performance, Accessibility, Best Practices
- **Bundle size:** < 150kb (gzipped) for initial load
- **First Contentful Paint (FCP):** < 1.5s on 4G
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive:** < 3.5s

### Optimization Tactics
- Tree-shaking unused code in Vite build
- Code splitting by feature (lazy load feature routes)
- Image optimization (responsive, lazy loading)
- Firestore query optimization (pagination, filtering)
- CSS modules prevent style bloat

---

## Testing Strategy

### Unit Tests (Vitest)
- Calculator formulas (accuracy)
- Form validation (email, inputs)
- Zustand stores (state mutations)
- Utility functions (formatting, helpers)

### Integration Tests
- Newsletter signup flow (form → Firestore → email)
- Blog fetch from Firestore (query, filtering, sorting)
- Calculator integration (config fetch → form render → calculation)

### E2E Tests (Cypress, Phase 2)
- Full user journey: Land → Scroll → Signup → Confirm
- Navigation: All pages accessible and responsive
- Forms: Submit, validation, error handling

---

## Accessibility (WCAG 2.1 AA)

- Semantic HTML: `<nav>`, `<main>`, `<footer>`, `<article>`
- ARIA labels: buttons, form inputs, modals
- Keyboard navigation: Tab through all interactive elements
- Focus visible: outline on keyboard focus
- Color contrast: Text 4.5:1, UI 3:1
- Alt text: All images
- Skip link: Jump to main content
- Form labels: Associated with inputs via `htmlFor`

---

## Deployment & Hosting

### Firebase Hosting Setup
```bash
# .firebase/app-config.js
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
```

### Deployment Process
1. Build: `npm run build` (Vite optimizes, outputs to `dist/`)
2. Deploy: `firebase deploy` (uploads dist/ to hosting)
3. Rollback: Firebase Hosting keeps version history, easy rollback

### Environment Variables
- `.env.local` — Development (local Firebase emulator)
- `.env.production` — Production (live Firebase project)

---

## Success Metrics

- **MVP Launch:** All pages live, feature parity with original
- **User Engagement:** Newsletter signup rate > 5%
- **Performance:** Lighthouse score 90+
- **Error rate:** < 0.1% (Cloud Function failures)
- **Uptime:** > 99.9% (Firebase Hosting SLA)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| **Firestore costs spike** | Monitor usage, set spending limits, batch writes efficiently |
| **Large images slow load time** | Use responsive images, lazy loading, CDN optimization |
| **Complex state management** | Zustand is simple; avoid over-engineering |
| **Email deliverability issues** | Use SendGrid (industry-standard), test with real emails |
| **SEO concerns (SPA)** | Add meta tags, sitemap, robots.txt, GA4 tracking |
| **Firebase lock-in** | Data is portable JSON; cloud functions are standard |

---

## Future Roadmap

1. **User Accounts** — Firebase Auth + profile management
2. **Course Platform** — Stripe payments, course progress tracking
3. **Advanced Animations** — Framer Motion, Three.js, Lottie
4. **Member Dashboard** — Private content, progress charts
5. **Admin Panel** — Content editing interface for blog, calculators
6. **Mobile App** — React Native or Flutter
