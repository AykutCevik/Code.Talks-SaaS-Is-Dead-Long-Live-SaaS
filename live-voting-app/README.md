# Live Voting System - SaaS Demo App

A modern, Mentimeter-style live voting application built as a demonstration for the talk "SaaS is Dead, Long Live SaaS". This project showcases how to build a fully functional SaaS application with a modern, monolithic stack.

## 🎯 Features

- **Live Voting**: Real-time voting with 0-10 slider interface
- **Admin Dashboard**: Live visualization of voting results with animated distribution curves
- **Vote Security**: Multi-layered protection against duplicate votes (fingerprinting + IP rate-limiting + localStorage)
- **Auto Vote Boost**: Optional feature to automatically add positive votes for demos (configurable via .env)
- **QR Code Access**: Easy mobile access via QR code
- **Real-time Updates**: Server-Sent Events (SSE) for live result updates
- **Mobile-Optimized**: Responsive design, especially for voting interface
- **GDPR-Compliant**: IP addresses stored as hashes only

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: Server-Sent Events (SSE)
- **Animations**: Framer Motion
- **Charts**: D3-shape for distribution curves
- **Fingerprinting**: @fingerprintjs/fingerprintjs
- **QR Codes**: qrcode library
- **Testing**: Vitest + Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
cd live-voting-app

# Install dependencies
npm install
```

### 2. Environment Setup

Copy the `.env.example` file:

```bash
cp .env.example .env
```

The `.env` file contains:
```env
DATABASE_URL="file:./dev.db"
ADMIN_SECRET="your-super-secret-here"
IP_SALT="random-salt-for-ip-hashing"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTO_VOTE_BOOST="false"
```

**Important**: Change `ADMIN_SECRET` and `IP_SALT` before deploying to production!

#### Auto Vote Boost Feature

The `AUTO_VOTE_BOOST` feature automatically adds positive votes for Question 1 when low votes are submitted:

- When set to `"true"`, for every vote below 6 on Question 1, the system automatically adds 2 additional votes with ratings between 8-10
- Useful for demos and presentations to ensure positive first impressions
- See `AUTO_VOTE_BOOST_FEATURE.md` for detailed documentation
- Default: `"false"` (disabled)

### 3. Database Setup

```bash
# Run migrations and seed the database
npm run prisma:migrate

# Or manually:
npx prisma migrate dev --name init
npx prisma db seed
```

This creates 3 default questions in German:
1. "Wie sehr hat euch der Vortrag gefallen?"
2. "Sollten neue SaaS-Produkte als Monolith starten?"
3. "Werdet ihr jetzt häufiger Vibe Coden?"

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Voting Interface**: http://localhost:3000/vote
- **Admin Dashboard**: http://localhost:3000/admin

## 📱 Usage

### Voting Flow (Participants)

1. Navigate to `/vote` (or scan QR code from admin dashboard)
2. Rate each of the 3 questions using the 0-10 slider
3. Click "Submit Responses"
4. See confirmation message

**Note**: Each user can only vote once per device (fingerprint + localStorage + IP tracking)

### Admin Dashboard

1. Navigate to `/admin`
2. Display the QR code for participants to scan
3. Watch live results update as votes come in
4. See distribution curves and average ratings
5. Use "Reset Votes" button to clear all votes (requires admin secret)

**Important**: After resetting votes, users can vote again immediately. The voting page always checks with the server first, so even if a browser has the localStorage flag set, it will be cleared automatically when the server confirms no vote exists.

## 🧪 Testing

The project includes comprehensive integration tests covering:

- All API endpoints
- Vote security mechanisms
- Data aggregation accuracy
- Critical user flows

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- ✅ `api.questions.test.ts` - Questions API
- ✅ `api.votes.test.ts` - Vote submission with validation
- ✅ `api.check.test.ts` - Vote status checking
- ✅ `api.stats.test.ts` - Statistics aggregation
- ✅ `api.reset.test.ts` - Admin reset functionality
- ✅ `voting-flow.test.ts` - Complete user journey
- ✅ `duplicate-prevention.test.ts` - Security mechanisms

## 🔒 Vote Security

The system uses a multi-layered approach to prevent duplicate voting:

### 1. Browser Fingerprinting (Primary)
- Generates unique hash from browser properties
- Uses `@fingerprintjs/fingerprintjs` library
- Tracks device across sessions

### 2. LocalStorage (UX Layer)
- Sets flag after successful vote
- Prevents accidental re-submission
- Can be bypassed but combined with fingerprint is effective

### 3. IP-Based Rate Limiting (Secondary)
- SHA-256 hashed IP addresses (GDPR-compliant)
- Max 3 votes per IP address
- Prevents mass voting from single network

| Method | Difficulty to Bypass | Purpose |
|--------|---------------------|---------|
| LocalStorage | Easy | Quick UX, prevents accidental duplicates |
| Fingerprint | Medium | Main security, tracks device |
| IP Hash | Medium | Rate limiting, prevents mass voting |

## 🗄 Database Schema

### Question
- `id` - Unique identifier (cuid)
- `text` - Question text
- `order` - Display order
- `createdAt` - Timestamp

### Vote
- `id` - Unique identifier
- `questionId` - Reference to Question
- `rating` - Integer 0-10
- `fingerprint` - Browser fingerprint hash
- `ipHash` - SHA-256 of IP + salt
- `createdAt` - Timestamp

### VoteSession
- `id` - Unique identifier
- `fingerprint` - Unique browser fingerprint
- `hasVoted` - Boolean flag
- `votedAt` - Timestamp
- `ipHash` - SHA-256 of IP + salt

## 📁 Project Structure

```
live-voting-app/
├── app/
│   ├── admin/              # Admin dashboard page
│   │   └── page.tsx
│   ├── vote/               # Voting interface page
│   │   └── page.tsx
│   └── api/                # API routes
│       ├── questions/      # GET questions
│       ├── votes/          # POST votes, GET check/stats/stream
│       └── admin/          # POST reset
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── fingerprint.ts     # Fingerprint utility
│   └── types.ts           # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
└── tests/
    └── integration/       # Integration tests
```

## 🎨 Design

The UI follows Mentimeter's clean, modern design:

- **Color Scheme**:
  - Question 1: Blue (#5B7FE8)
  - Question 2: Pink/Coral (#E8766B)
  - Question 3: Dark Blue/Purple (#4A5978)
- **Typography**: Sans-serif, large readable fonts (min 18px)
- **Animations**: Smooth transitions for slider interactions and chart updates
- **Layout**: Split view (QR code left, questions right) on admin dashboard

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL
# - ADMIN_SECRET
# - IP_SALT
# - NEXT_PUBLIC_APP_URL
```

**Note**: For production, consider using PostgreSQL instead of SQLite for better scalability.

### Railway / Fly.io

1. Create account and install CLI
2. Configure environment variables
3. Deploy using platform-specific commands

## 🔧 Development

### Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode

# Build
npm run build            # Build for production
npm start                # Start production server
```

### Adding Questions

Edit `prisma/seed.ts` to change the default questions, then run:

```bash
npm run prisma:seed
```

## 🤝 Contributing

This is a demo project for a conference talk. Feel free to fork and adapt for your own use!

## 📄 License

MIT License - feel free to use this for your own projects.

## 👤 Author

Created for the talk "SaaS is Dead, Long Live SaaS"

## 🙏 Acknowledgments

- Inspired by Mentimeter's clean design
- Built with modern web technologies
- Demonstrates practical SaaS architecture patterns

---

**Note**: This is a demonstration application. For production use, consider:
- Using PostgreSQL instead of SQLite
- Adding more robust authentication for admin features
- Implementing proper logging and monitoring
- Adding error tracking (e.g., Sentry)
- Implementing proper CAPTCHA for additional security
