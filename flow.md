# Diabetic Athletic Website Flow

## User Journeys & Navigation

### Primary Flow: New Visitor → Newsletter Signup
1. **Land on homepage** — Hero section with coach photo + main CTA
2. **Scroll journey** — See Step 01-04 learning pathway
3. **Explore resources** — Free resources page, blog posts, tools
4. **Newsletter signup** — Email capture form (multiple CTAs throughout)
5. **Confirmation** — Success message, welcome email sent

### Secondary Flows

#### Resource Exploration
- Navigate to **Free Resources** page
- View available tools: Calorie Calculator, Protein Calculator, Challenge Page
- Each calculator is self-contained, no signup required
- Share results or sign up for more

#### Blog/Content Discovery
- Blog listing shows latest insights
- Individual blog posts with related content
- Call-to-action for newsletter/discovery call at bottom

#### Conversion Funnels
- **"Schedule Discovery Call"** → External Calendly link
- **"Apply for Coaching"** → External Typeform
- **"Apply for Torchbearer"** → External Typeform
- **Newsletter signup** → Firebase function + email service integration

---

## Page Structure & Components

### Header (Global)
- Diabetic Athletic logo (top-left)
- Navigation: Home | About | Free Resources | Blog
- Subscribe CTA button (top-right)

### Footer (Global)
- Links: Terms & Conditions | Privacy Policy | Earnings Disclaimer
- Copyright notice
- Social links (if applicable)

### Pages

#### Home (index)
1. Hero Section
   - Large hero image of coach
   - Main headline: "Known For Turning Diabetic Struggles Into Fitness Successes"
   - Subheadline + description
   - Primary CTA: "Subscribe"
   - Newsletter signup form

2. Journey Section (Step 01-04)
   - Step 01: "Dosing Secrets" + Exercise + Nutrition (3 cards)
   - Step 02: "5 Day Diabetic Domination Toolkit"
   - Step 03: Programs (100-Day Fat Loss, 100-Day Muscle Gain, Private Coaching, High Performance Blueprint)
   - Step 04: "Type-1-Torchbearer MVP Program"

3. Coach Bio Section
   - Coach photo + name (Nicholas Caracandas)
   - Bio text
   - "Schedule Discovery Call" button

4. Latest Insights (Blog Preview)
   - 3 latest blog posts as cards
   - Title, snippet, Subscribe CTA

#### Free Resources
- Listing of tools and resources
- Links to: Calorie Calculator, Protein Calculator, Challenge Page, etc.
- Newsletter signup CTA

#### Blog Listing
- All blog posts with preview cards
- Filter/search (optional Phase 2)
- Pagination (optional Phase 2)

#### Individual Blog Post
- Full post content (from Firestore)
- Author, date, reading time
- Related posts
- Newsletter signup CTA

#### Calculators (Calorie, Protein)
- Interactive tool interface
- Input fields
- Calculate button
- Results display
- Share results CTA
- Newsletter signup CTA

#### Subpages
- About page (content-heavy, from JSON)
- Privacy Policy (content-heavy, from JSON)
- Terms & Conditions (content-heavy, from JSON)

---

## Data Model

### Firestore Collections

#### `blog_posts`
```
{
  id: string (auto-generated)
  title: string
  slug: string
  author: string
  date: timestamp
  content: string (markdown or HTML)
  excerpt: string
  featured_image: string (URL)
  tags: array[string]
  published: boolean
}
```

#### `calculators`
```
{
  id: string (auto-generated)
  type: string (e.g., "calorie", "protein")
  name: string
  description: string
  fields: array[{ name, type, label, default }]
  formula: string (calculation logic reference)
  published: boolean
}
```

#### `newsletter_signups`
```
{
  id: string (auto-generated)
  email: string (unique)
  subscribed_at: timestamp
  source: string (e.g., "hero", "blog", "footer")
  status: string ("pending" | "confirmed" | "unsubscribed")
}
```

### Static Content (JSON)
- `home.json` — Hero, journey cards, coach bio
- `pages.json` — About, Free Resources, Terms, Privacy
- `programs.json` — Program descriptions and CTAs

---

## External Integrations

### Email Service
- **Option A:** Firebase Functions + SendGrid
- **Option B:** Firebase Functions + Mailchimp API
- Newsletter signup → confirmation email → segment list

### Calendar & Forms
- **Calendly:** "Schedule Discovery Call" button links to Calendly
- **Typeform:** "Apply for Coaching" / "Apply for Torchbearer" link to Typeforms

### Analytics (Phase 2)
- Google Analytics 4 for traffic tracking
- Conversion events for newsletter signups, button clicks

---

## State Management

### Global State (Zustand)
```
{
  user: {
    email: string | null
    subscribed: boolean
  },
  newsletter: {
    isOpen: boolean
    email: string
    status: "idle" | "loading" | "success" | "error"
    message: string
  },
  modals: {
    newsletterModalOpen: boolean
    // ... other modals
  }
}
```

### Local Component State
- Form inputs (controlled components)
- Calculator results
- Blog filter state (if implemented)

---

## Error Handling & User Feedback

### Newsletter Signup
- ✅ Success: "Check your email for confirmation"
- ❌ Error: "Something went wrong. Try again."
- ⚠️ Validation: "Please enter a valid email"

### Calculators
- Input validation (numbers, ranges)
- Clear error messages
- Helpful hints

### Blog/Content
- 404 page if post not found
- Loading states while fetching from Firestore

---

## Testing Strategy

### Unit Tests (Vitest)
- Calculator logic (formulas)
- Form validation
- State management (Zustand)

### Integration Tests
- Newsletter signup flow (email capture → Firestore)
- Blog post fetching from Firestore
- Calculator results

### E2E Tests (Cypress, Phase 2)
- Homepage full flow
- Newsletter signup end-to-end
- Blog navigation

---

## Performance Considerations

- Static pages (JSON) load instantly
- Blog posts lazy-loaded from Firestore on-demand
- Images optimized (lazy loading, responsive)
- CSS-in-JS scoped to features (no global style conflicts)
- Vite production build for optimal bundle size

---

## Accessibility

- Semantic HTML (nav, main, footer, article)
- ARIA labels for buttons and forms
- Keyboard navigation (Tab, Enter)
- Color contrast WCAG AA compliant
- Alt text for images
