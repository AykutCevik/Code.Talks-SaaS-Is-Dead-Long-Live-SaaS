# Live Voting System Implementation Plan

## Project Structure

Build a monolithic Next.js 14 app with:

- SQLite database via Prisma ORM
- Server-Sent Events for real-time updates
- Browser fingerprinting for vote security
- Integration tests for API routes and critical flows

## Implementation Steps

### 1. Project Initialization

- Create Next.js 14 project with TypeScript, Tailwind CSS, App Router
- Install dependencies: prisma, @prisma/client, @fingerprintjs/fingerprintjs, qrcode, framer-motion, d3-shape
- Install dev dependencies: @types/qrcode, @types/d3-shape
- Initialize shadcn/ui and add button, card components
- Install testing framework: vitest, @testing-library/react, @testing-library/jest-dom

### 2. Database & Schema Setup

- Initialize Prisma with SQLite provider
- Define schema with Question, Vote, VoteSession models (from spec lines 52-81)
- Create seed script with 3 German questions (lines 86-101)
- Create Prisma client singleton at `/lib/db.ts` (lines 348-359)
- Run migrations and seed database

### 3. Utility Libraries

- Implement `/lib/fingerprint.ts` for browser fingerprinting (lines 364-379)
- Create `/lib/types.ts` for shared TypeScript interfaces
- Add crypto utilities for IP hashing

### 4. API Routes Implementation

Create all API endpoints:

- `GET /api/questions` - Fetch all questions ordered by order field
- `POST /api/votes` - Submit votes with fingerprint + IP-based security (lines 397-472)
- Validate 3 ratings (0-10 range)
- Check fingerprint uniqueness in VoteSession
- IP rate-limiting (max 3 votes per IP hash)
- Atomic transaction for vote storage
- `GET /api/votes/check?fp={fingerprint}` - Check if user already voted (lines 476-493)
- `GET /api/votes/stats` - Aggregate vote statistics with distribution (lines 496-531)
- `GET /api/votes/stream` - SSE endpoint for live updates (lines 534-605)
- `POST /api/admin/reset` - Reset all votes with secret auth (lines 609-627)

### 5. Voting Interface (`/app/vote/page.tsx`)

Build mobile-optimized voting page (lines 633-871):

- Load questions from API
- Check if user already voted (localStorage + fingerprint)
- Render 3 questions with 0-10 sliders
- Custom slider styling with color-coded thumbs (QUESTION_COLORS)
- Floating value display above slider thumb
- Submit all 3 votes at once
- Success confirmation screen with checkmark
- LocalStorage flag to prevent re-voting (UX layer)

### 6. Admin Dashboard (`/app/admin/page.tsx`)

Build presentation view (lines 874-1146):

- Split layout: QR code (left) + 3 questions (right)
- Generate QR code for `/vote` URL
- Implement DistributionCurve component with D3.js:
- SVG-based smooth curves using d3.curveBasis
- Area fill with transparency
- Animated average marker (circle with value)
- Framer Motion animations on updates
- Subscribe to SSE stream for live updates
- Fallback to polling if SSE fails
- Display participant counter
- Admin reset button with secret prompt

### 7. Styling & Design

- Use Mentimeter-style color scheme (lines 138-152):
- Question 1: Blue (#5B7FE8)
- Question 2: Pink/Coral (#E8766B)
- Question 3: Dark Blue/Purple (#4A5978)
- Light background (#FAFAFA for admin, #FFFFFF for voting)
- Typography: Sans-serif, large readable fonts (min 18px)
- Smooth animations for slider interactions and chart updates
- Custom CSS for range slider thumbs

### 8. Integration Tests

Create test suite at `/tests/integration/`:

- **API Tests**:
- `api.votes.test.ts`: POST /api/votes (success, duplicate prevention, rate limiting, validation errors)
- `api.check.test.ts`: GET /api/votes/check (voted/not voted states)
- `api.stats.test.ts`: GET /api/votes/stats (distribution calculation, averages)
- `api.questions.test.ts`: GET /api/questions (ordering, data format)
- `api.reset.test.ts`: POST /api/admin/reset (auth, data deletion)
- **Critical User Flows**:
- `voting-flow.test.ts`: Complete voting journey (load questions → submit → verify storage)
- `duplicate-prevention.test.ts`: Fingerprint + localStorage blocking
- `admin-dashboard.test.ts`: Stats aggregation accuracy

### 9. Configuration & Environment

- Create `.env` with DATABASE_URL, ADMIN_SECRET, IP_SALT
- Add `.env.example` template
- Configure `package.json` scripts:
- `dev`, `build`, `start`
- `test`, `test:watch`
- `prisma:migrate`, `prisma:seed`
- Setup Prisma seed in package.json

### 10. Documentation

Create comprehensive `README.md`:

- Project overview and tech stack
- Setup instructions (install, migrate, seed)
- Running locally (dev server, testing)
- Usage (accessing /vote and /admin routes)
- Environment variables explanation
- Deployment notes (Vercel/Railway/Fly.io)
- Vote security explanation (fingerprint + IP + localStorage)

## Key Files to Create

- `/prisma/schema.prisma` - Database schema
- `/prisma/seed.ts` - Seed 3 questions
- `/lib/db.ts` - Prisma singleton
- `/lib/fingerprint.ts` - Fingerprint utility
- `/lib/types.ts` - TypeScript interfaces
- `/app/api/questions/route.ts`
- `/app/api/votes/route.ts`
- `/app/api/votes/check/route.ts`
- `/app/api/votes/stats/route.ts`
- `/app/api/votes/stream/route.ts`
- `/app/api/admin/reset/route.ts`
- `/app/vote/page.tsx` - Voting interface
- `/app/admin/page.tsx` - Admin dashboard
- `/components/DistributionCurve.tsx` (or inline in admin page)
- `/tests/integration/*.test.ts` - Integration tests
- `README.md` - Setup documentation
- `.env.example` - Environment template

## Testing Strategy

Focus on integration tests covering:

1. All API endpoints (happy paths + error cases)
2. Vote security mechanisms (fingerprint, IP rate-limiting)
3. Data aggregation accuracy (stats, distribution)
4. Critical user flows (voting, duplicate prevention)

No unit tests or E2E tests needed per user preference.