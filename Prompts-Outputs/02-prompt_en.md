# SaaS Demo App: Live Voting System (Mentimeter-Style)

## Project Context
Create a modern live voting application for the conference talk "SaaS is Dead, Long Live SaaS". 
The app should demonstrate how to build a fully functional SaaS application with a modern, monolithic stack.

## Tech Stack Requirements
- **Backend & Frontend**: Next.js 14+ (App Router) with TypeScript
- **Database**: SQLite with Prisma ORM (simple, portable, no external DB needed)
- **Styling**: Tailwind CSS + shadcn/ui Components
- **Real-time Updates**: Server-Sent Events (SSE) or Polling (no WebSocket server needed)
- **Deployment-Ready**: Vercel/Railway/Fly.io compatible
- **Animations**: Framer Motion for live updates
- **Fingerprinting**: @fingerprintjs/fingerprintjs for vote security

## Functional Requirements

### 1. Admin/Presentation View (Dashboard)
- **Layout**: Large QR code on the left, 3 questions stacked vertically on the right
- Large, centrally placed QR code for participant access
- 3 questions stacked vertically
- Each question shows:
  - **Slider visualization** (0-10 scale as in reference design)
  - Average value as large circle on the slider
  - "Distribution Curve" in background (smooth, colored waves showing voting distribution)
  - Color scheme: Blue/Purple/Pink for different questions
- **Animated updates** when new votes arrive:
  - Slider value moves smoothly to new average
  - Distribution curve morphs smoothly
  - Number in circle counts up
- Modern, minimalist, conference-ready (light background like reference)
- Show participant counter bottom right (e.g. "28/28")
- Route: `/admin` or `/presentation`
- **Design Reference**: See uploaded Mentimeter screenshot

### 2. Voting View (Participants)
- Mobile-optimized, clean UI
- Shows all 3 questions sequentially or as scrollable list
- **Rating: Slider from 0-10** (as in reference design)
  - Each question has a horizontal slider
  - Show current value in circle above slider
  - Labels: Left "Don't agree at all" / Right "Very much agree" (or German)
  - Colors: Blue/Purple for slider (see reference)
- Submit button sends all 3 ratings at once
- Confirmation message after successful vote
- Route: `/vote` (shared via QR code)
- **Design Reference**: See uploaded Mentimeter screenshot

### 3. Database Schema

```prisma
model Question {
  id        String   @id @default(cuid())
  text      String
  order     Int
  createdAt DateTime @default(now())
  votes     Vote[]
}

model Vote {
  id              String   @id @default(cuid())
  questionId      String
  rating          Int      // 0-10 (Slider value)
  fingerprint     String   // Browser fingerprint hash
  ipHash          String   // SHA-256 hash of IP
  createdAt       DateTime @default(now())
  question        Question @relation(fields: [questionId], references: [id])
  
  @@index([fingerprint])
  @@index([ipHash])
}

model VoteSession {
  id              String   @id @default(cuid())
  fingerprint     String   @unique
  hasVoted        Boolean  @default(true)
  votedAt         DateTime @default(now())
  ipHash          String
}
```

### 4. Seed Data (3 Example Questions)

```typescript
// prisma/seed.ts
const questions = [
  {
    text: "How much did you enjoy the presentation?",
    order: 1
  },
  {
    text: "Should new SaaS products start as a monolith?",
    order: 2
  },
  {
    text: "Will you vibe code more often now?",
    order: 3
  }
];
```

## Vote Security: Single Vote without Registration

### Requirement
Each participant may only vote ONCE, without requiring registration/login.

### Implementation Strategy

**Use a combination of:**

1. **Browser Fingerprinting (Primary)**
   - Generate unique hash from browser properties
   - Use library: `@fingerprintjs/fingerprintjs`
   - Store fingerprint in VoteSession table

2. **LocalStorage Token (Secondary)**
   - After successful vote: Set flag in localStorage
   - Frontend blocks re-voting (UX layer)
   - Can be bypassed, but effective combined with fingerprint

3. **IP-based Rate-Limiting (Tertiary)**
   - Store hashed IP address with each vote
   - Allow max. 500 votes per IP (in case multiple people same network)
   - Use `crypto` for IP hashing (no plaintext storage, GDPR)

### Security Layers (Defense in Depth)

| Method | Bypassability | Purpose |
|---------|-------------|-------|
| **LocalStorage** | Easy (clear browser data) | Quick UX, prevents accidental duplicate votes |
| **Fingerprint** | Medium (switch browser, incognito) | Main security, tracks device |
| **IP-Hash** | Medium (VPN, mobile network) | Rate-limiting, prevents mass voting |

## Design Specification (Mentimeter-Style)

### Color Scheme
```css
/* Primary colors for different questions */
Question 1: Blue (#5B7FE8 - #7B9FF5)
Question 2: Pink/Coral (#E8766B - #F5A09B) 
Question 3: Dark Blue/Purple (#4A5978 - #6B7998)

/* Backgrounds */
Admin-View: White/Off-White (#FAFAFA)
Vote-View: White (#FFFFFF)

/* Accents */
Buttons: Primary color of respective question
Text: Dark Gray (#2D2D2D)
Secondary Text: Medium Gray (#666666)
```

### Typography
- **Headlines**: Sans-serif, 28-36px, Font-Weight: 600
- **Questions**: Sans-serif, 18-22px, Font-Weight: 500
- **Body**: Sans-serif, 14-16px, Font-Weight: 400
- **Slider Value**: Sans-serif, 20-24px, Font-Weight: 700

### Slider Component Specification

**Voting Slider (Mobile):**
```
- Height: 60px
- Track: 4px thick, rounded
- Thumb: 48px circle with shadow, shows value inside
- Labels: "Don't agree at all" (left) / "Very much agree" (right)
- Range: 0.0 - 10.0 (with decimal)
- Color: Primary color of question
```

**Admin Visualization:**
```
- Distribution Curve: SVG-based, semi-transparent
- Curve shows voting density (more votes = higher curve)
- Average marker: Large colored circle with value
- Scale: 0-10 labeling at ends
- Height: 120-150px per question
```

### Layout Structure

**Admin Dashboard:**
```
┌─────────────────────────────────────────┐
│  [Header] SaaS is Dead, Long Live SaaS  │
├─────────────┬───────────────────────────┤
│             │  Question 1               │
│             │  [Slider + Distribution]  │
│   QR-Code   │  ─────────────────────    │
│   (large)   │  Question 2               │
│             │  [Slider + Distribution]  │
│             │  ─────────────────────    │
│             │  Question 3               │
│             │  [Slider + Distribution]  │
│             │                [28/28] 👤 │
└─────────────┴───────────────────────────┘
```

**Voting View:**
```
┌─────────────────────────────────────────┐
│  Please rate the following:        [🔽] │
│                                          │
│  Meeting content was relevant           │
│  ────────────────●─────────  [7.0]     │
│  Don't agree at all  Very much agree    │
│                                          │
│  The meeting served our alignment needs │
│  ─────────────●────────────  [6.4]     │
│  Don't agree at all  Very much agree    │
│                                          │
│  My concerns were addressed             │
│  ──────────────●───────────  [6.8]     │
│  Don't agree at all  Very much agree    │
│                                          │
│            [Submit Responses]            │
└─────────────────────────────────────────┘
```

### Animation Details

**Vote Submission:**
- Slider Thumb: Scale 1.0 → 1.2 → 1.0 on drag
- Submit Button: Hover → slight lift effect + shadow
- Success: Checkmark animation (draw path) + optional confetti

**Admin Live Update:**
- Average Value: Count-up animation (0.3s)
- Distribution Curve: Morph with d3-ease (0.5s)
- New Vote Indicator: Brief pulse-glow on curve

## Technical Implementation Details

### Real-time Updates
- Implement Server-Sent Events (SSE) endpoint: `/api/votes/stream`
- Admin dashboard subscribes to this stream
- On each new vote: Server pushes update to all connected clients
- Fallback: Polling every 2 seconds if SSE doesn't work

### QR Code Generation
- Use `qrcode` or `qr-code-styling` npm package
- QR shows absolute URL: `https://your-domain.com/vote`
- For local development: show QR with localhost URL or ngrok

### Chart/Visualization
- **Voting Interface**: Native HTML5 Range Slider with custom styling
- **Admin Dashboard**: SVG-based distribution curves
- Use D3.js or Recharts for smooth curve interpolation
- Distribution curve calculation:
  ```javascript
  // Group votes into bins (e.g. 0-1, 1-2, etc.)
  // Create smooth curve with d3.curveNatural
  // Show as filled area chart with transparency
  ```
- Average marker as absolutely positioned circle over curve
- Show average value (2 decimals) in circle
- Animate with Framer Motion on update

### Animations

```typescript
// Example: Distribution Curve Morph on update
<motion.path
  d={curvePathData}
  initial={{ d: previousCurvePathData }}
  animate={{ d: curvePathData }}
  transition={{ duration: 0.5, ease: "easeInOut" }}
/>

// Average Marker Slide
<motion.div
  style={{ left: `${(average / 10) * 100}%` }}
  animate={{ left: `${(average / 10) * 100}%` }}
  transition={{ duration: 0.4, ease: "easeOut" }}
/>

// Count-up Animation for value
import { useSpring, animated } from '@react-spring/web';
const { number } = useSpring({ number: average, from: { number: 0 } });
```

### Libraries for Distribution Curves
- **d3-shape**: Curve interpolation (curveNatural, curveBasis)
- **react-spring** or **framer-motion**: Smooth animations
- Combine both for optimal visualization

## Project Structure

```
/app
  /admin
    page.tsx          # Dashboard with charts + QR
  /vote
    page.tsx          # Voting form
  /api
    /votes
      route.ts        # POST /api/votes (submit vote)
      /check
        route.ts      # GET /api/votes/check (has user voted?)
      /stream
        route.ts      # GET /api/votes/stream (SSE)
      /stats
        route.ts      # GET /api/votes/stats (aggregated data)
    /questions
      route.ts        # GET /api/questions (fetch all)
    /admin
      /reset
        route.ts      # POST /api/admin/reset (delete all votes)
/components
  /ui                 # shadcn components
  VotingChart.tsx     # Chart component
  QRCodeDisplay.tsx   # QR code component
  StarRating.tsx      # Rating input component
/lib
  db.ts              # Prisma client singleton
  fingerprint.ts     # Fingerprint utilities
  types.ts           # TypeScript types
/prisma
  schema.prisma
  seed.ts            # Seed script with 3 questions
```

## Step-by-Step Plan

### 1. Project Setup
```bash
npx create-next-app@latest live-voting-saas --typescript --tailwind --app
cd live-voting-saas
npm install prisma @prisma/client @fingerprintjs/fingerprintjs qrcode framer-motion d3-shape
npm install -D @types/qrcode @types/d3-shape
npx shadcn-ui@latest init
```

### 2. Database Setup
- Define Prisma schema (see above)
- Configure SQLite as provider
- Create seed script with 3 questions
- Run migrations:

```bash
npx prisma init --datasource-provider sqlite
# Edit schema
npx prisma migrate dev --name init
npx prisma db seed
```

Prisma Client Singleton (`/lib/db.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### 3. Fingerprint Library Setup

`/lib/fingerprint.ts`:
```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<string> | null = null;

export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = (async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      return result.visitorId;
    })();
  }
  return fpPromise;
}
```

### 4. API Routes

#### GET `/api/questions/route.ts`
```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { order: 'asc' }
  });
  return NextResponse.json(questions);
}
```

#### POST `/api/votes/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { votes, fingerprint } = body; // votes: [{questionId, rating}]
    
    // 1. Validation
    if (!fingerprint || !votes || votes.length !== 3) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    // Validate ratings (0-10)
    if (votes.some((v: any) => v.rating < 0 || v.rating > 10)) {
      return NextResponse.json({ error: 'Rating must be 0-10' }, { status: 400 });
    }
    
    // 2. Generate IP hash (GDPR compliant)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = crypto.createHash('sha256').update(ip + process.env.IP_SALT || '').digest('hex');
    
    // 3. Check: Has this fingerprint already voted?
    const existingSession = await prisma.voteSession.findUnique({
      where: { fingerprint }
    });
    
    if (existingSession) {
      return NextResponse.json(
        { error: 'You have already voted!' }, 
        { status: 403 }
      );
    }
    
    // 4. Check: IP rate limit (max 3 votes per IP)
    const ipVoteCount = await prisma.voteSession.count({
      where: { ipHash }
    });
    
    if (ipVoteCount >= 3) {
      return NextResponse.json(
        { error: 'Rate limit: Too many votes from this network' }, 
        { status: 429 }
      );
    }
    
    // 5. Save votes (Transaction for atomicity)
    await prisma.$transaction([
      // Create VoteSession
      prisma.voteSession.create({
        data: { fingerprint, ipHash }
      }),
      // Create all votes
      ...votes.map((vote: any) => 
        prisma.vote.create({
          data: {
            questionId: vote.questionId,
            rating: vote.rating,
            fingerprint,
            ipHash
          }
        })
      )
    ]);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

#### GET `/api/votes/check/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const fingerprint = request.nextUrl.searchParams.get('fp');
  
  if (!fingerprint) {
    return NextResponse.json({ hasVoted: false });
  }
  
  const session = await prisma.voteSession.findUnique({
    where: { fingerprint }
  });
  
  return NextResponse.json({ hasVoted: !!session });
}
```

#### GET `/api/votes/stats/route.ts`
```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const questions = await prisma.question.findMany({
    include: {
      votes: true
    },
    orderBy: { order: 'asc' }
  });
  
  const stats = questions.map(q => {
    // Calculate average
    const average = q.votes.length > 0
      ? q.votes.reduce((sum, v) => sum + v.rating, 0) / q.votes.length
      : 0;
    
    // Create distribution (bins for 0-10)
    const distribution = Array.from({ length: 11 }, (_, i) => ({
      value: i,
      count: q.votes.filter(v => Math.round(v.rating) === i).length
    }));
    
    return {
      questionId: q.id,
      questionText: q.text,
      totalVotes: q.votes.length,
      average: Math.round(average * 10) / 10, // 1 decimal place
      distribution
    };
  });
  
  return NextResponse.json(stats);
}
```

#### GET `/api/votes/stream/route.ts` (Server-Sent Events)
```typescript
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  let lastVoteCount = 0;
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const stats = await getStats();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
      lastVoteCount = await getTotalVoteCount();
      
      // Poll every 1 second
      const interval = setInterval(async () => {
        try {
          const currentVoteCount = await getTotalVoteCount();
          
          // Only send update when new votes
          if (currentVoteCount > lastVoteCount) {
            const stats = await getStats();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
            lastVoteCount = currentVoteCount;
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 1000);
      
      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function getStats() {
  const questions = await prisma.question.findMany({
    include: { votes: true },
    orderBy: { order: 'asc' }
  });
  
  return questions.map(q => ({
    questionId: q.id,
    questionText: q.text,
    totalVotes: q.votes.length,
    voteCounts: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: q.votes.filter(v => v.rating === rating).length
    }))
  }));
}

async function getTotalVoteCount() {
  return await prisma.vote.count();
}
```

#### POST `/api/admin/reset/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  // Basic auth with secret
  const secret = request.headers.get('x-admin-secret');
  
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await prisma.$transaction([
    prisma.vote.deleteMany({}),
    prisma.voteSession.deleteMany({})
  ]);
  
  return NextResponse.json({ success: true, message: 'All votes reset' });
}
```

### 5. Frontend Components

#### Voting Page (`/app/vote/page.tsx`)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Question {
  id: string;
  text: string;
  order: number;
}

// Colors for different questions
const QUESTION_COLORS = [
  { track: '#5B7FE8', thumb: '#4A6DD7' },
  { track: '#E8766B', thumb: '#D7655A' },
  { track: '#4A5978', thumb: '#394867' }
];

export default function VotePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const fp = await getFingerprint();
      setFingerprint(fp);
      
      const localVoted = localStorage.getItem('has_voted');
      if (localVoted === 'true') {
        setHasVoted(true);
        setLoading(false);
        return;
      }
      
      const checkResponse = await fetch(`/api/votes/check?fp=${fp}`);
      const checkData = await checkResponse.json();
      
      if (checkData.hasVoted) {
        setHasVoted(true);
        localStorage.setItem('has_voted', 'true');
        setLoading(false);
        return;
      }
      
      const questionsResponse = await fetch('/api/questions');
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
      
      // Initialize ratings with 5.0 (middle)
      const initialRatings: Record<string, number> = {};
      questionsData.forEach((q: Question) => {
        initialRatings[q.id] = 5.0;
      });
      setRatings(initialRatings);
      
      setLoading(false);
    }
    
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(ratings).length !== questions.length) {
      alert('Please rate all questions!');
      return;
    }
    
    setSubmitting(true);
    
    const votes = questions.map(q => ({
      questionId: q.id,
      rating: ratings[q.id]
    }));
    
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes, fingerprint })
      });
      
      if (response.ok) {
        localStorage.setItem('has_voted', 'true');
        setHasVoted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Error submitting vote');
      }
    } catch (error) {
      alert('Network error while voting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-12 max-w-md text-center shadow-xl">
          <div className="text-7xl mb-6">✓</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Thank you!</h2>
          <p className="text-gray-600 text-lg">
            Your responses have been recorded.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            Please rate the following:
          </h1>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-12">
          {questions.map((question, index) => {
            const color = QUESTION_COLORS[index % QUESTION_COLORS.length];
            const value = ratings[question.id] || 5.0;
            
            return (
              <div key={question.id} className="space-y-4">
                <h3 className="text-xl font-medium text-gray-800">
                  {question.text}
                </h3>
                
                <div className="relative pt-6 pb-4">
                  {/* Slider Value Display */}
                  <div 
                    className="absolute transition-all duration-300 ease-out"
                    style={{ 
                      left: `calc(${(value / 10) * 100}% - 28px)`,
                      top: '-8px'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: color.thumb }}
                    >
                      {value.toFixed(1)}
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value}
                    onChange={(e) => setRatings(prev => ({
                      ...prev,
                      [question.id]: parseFloat(e.target.value)
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${color.track} 0%, ${color.track} ${(value / 10) * 100}%, #E5E7EB ${(value / 10) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  
                  {/* Labels */}
                  <div className="flex justify-between mt-3 text-sm text-gray-500">
                    <span>Don't agree at all</span>
                    <span>Very much agree</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <Button 
            type="submit" 
            className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Responses'}
          </Button>
        </form>
      </div>
      
      <style jsx global>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.3);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
```

#### Admin Dashboard (`/app/admin/page.tsx`)
```typescript
'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import * as d3 from 'd3-shape';

interface VoteDistribution {
  value: number;
  count: number;
}

interface QuestionStats {
  questionId: string;
  questionText: string;
  totalVotes: number;
  average: number;
  distribution: VoteDistribution[];
}

const QUESTION_COLORS = [
  { base: '#5B7FE8', light: 'rgba(91, 127, 232, 0.3)' },
  { base: '#E8766B', light: 'rgba(232, 118, 107, 0.3)' },
  { base: '#4A5978', light: 'rgba(74, 89, 120, 0.3)' }
];

function DistributionCurve({ 
  distribution, 
  average, 
  color, 
  totalVotes 
}: { 
  distribution: VoteDistribution[];
  average: number;
  color: { base: string; light: string };
  totalVotes: number;
}) {
  const width = 800;
  const height = 100;
  const padding = 20;
  
  // Generate smooth curve path
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
  
  const points = distribution.map((d, i) => ({
    x: padding + (i / 10) * (width - 2 * padding),
    y: height - padding - ((d.count / maxCount) * (height - 2 * padding))
  }));
  
  // D3 Curve Generator
  const lineGenerator = d3.line<{ x: number; y: number }>()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveBasis);
  
  const areaGenerator = d3.area<{ x: number; y: number }>()
    .x(d => d.x)
    .y0(height - padding)
    .y1(d => d.y)
    .curve(d3.curveBasis);
  
  const linePath = lineGenerator(points) || '';
  const areaPath = areaGenerator(points) || '';
  
  const averageX = padding + (average / 10) * (width - 2 * padding);
  
  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Area Fill */}
        <motion.path
          d={areaPath}
          fill={color.light}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Line */}
        <motion.path
          d={linePath}
          stroke={color.base}
          strokeWidth={3}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Scale */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} 
              stroke="#ccc" strokeWidth={2} />
        <text x={padding} y={height - 5} fontSize={12} fill="#999">0</text>
        <text x={width - padding - 10} y={height - 5} fontSize={12} fill="#999">10</text>
      </svg>
      
      {/* Average Marker */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full text-white font-bold shadow-lg"
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: color.base,
          left: `${averageX}px`,
          top: '20px',
          transform: 'translateX(-30px)'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <span className="text-xl">{average.toFixed(1)}</span>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    // Generate QR Code
    const voteUrl = `${window.location.origin}/vote`;
    QRCode.toDataURL(voteUrl, { 
      width: 400, 
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    }).then(setQrCodeUrl);

    // Load initial data
    fetchStats();

    // SSE Connection for live updates
    const eventSource = new EventSource('/api/votes/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
      
      // Calculate participants (each gives 3 votes)
      if (data.length > 0) {
        setTotalParticipants(Math.round(data[0].totalVotes));
      }
    };

    eventSource.onerror = () => {
      console.error('SSE error, falling back to polling');
      eventSource.close();
      
      // Fallback: Polling
      const interval = setInterval(fetchStats, 2000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/votes/stats');
    const data = await response.json();
    setStats(data);
    
    if (data.length > 0) {
      setTotalParticipants(Math.round(data[0].totalVotes));
    }
  };

  const handleReset = async () => {
    if (!confirm('Really delete all votes?')) return;
    
    setIsResetting(true);
    const secret = prompt('Admin Secret:');
    
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'x-admin-secret': secret || '' }
      });
      
      if (response.ok) {
        alert('Votes successfully reset');
        fetchStats();
      } else {
        alert('Error: Invalid secret');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            SaaS is Dead, Long Live SaaS
          </h1>
          <Button 
            onClick={handleReset} 
            variant="outline"
            disabled={isResetting}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Reset Votes
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* QR Code Section */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 sticky top-8">
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[300px] rounded-xl" />
                  <p className="text-gray-600 text-center mt-6 font-medium text-lg">
                    Scan to participate
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    {window.location.origin}/vote
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {stats.map((question, index) => {
              const color = QUESTION_COLORS[index % QUESTION_COLORS.length];
              
              return (
                <div key={question.questionId} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">
                    {question.questionText}
                  </h3>
                  
                  <DistributionCurve
                    distribution={question.distribution}
                    average={question.average}
                    color={color}
                    totalVotes={question.totalVotes}
                  />
                  
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Don't agree at all</span>
                    <span>Very much agree</span>
                  </div>
                </div>
              );
            })}
            
            {/* Participant Counter */}
            <div className="flex justify-end items-center gap-2 text-gray-600">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full font-medium">
                {totalParticipants} / {totalParticipants}
              </div>
              <span className="text-2xl">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6. Styling & Polish

Install shadcn/ui components:
```bash
npx shadcn-ui@latest add button card
```

Extend Tailwind config for custom colors/animations if needed.

### 7. Environment Variables

`.env`:
```env
DATABASE_URL="file:./dev.db"
ADMIN_SECRET="your-super-secure-secret-here"
IP_SALT="random-salt-for-ip-hashing"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`.env.production`:
```env
DATABASE_URL="file:./prod.db"
ADMIN_SECRET="production-secret"
IP_SALT="production-salt"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 8. package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 9. Testing & Deployment

**Local Testing:**
```bash
npm run dev
# Browser 1: http://localhost:3000/admin
# Browser 2 (Incognito): http://localhost:3000/vote
```

**Deployment on Vercel:**
```bash
vercel
# Set environment variables in Vercel dashboard
```

**Deployment on Railway/Fly.io:**
- Create Dockerfile (optional)
- Configure environment variables
- Deploy with CLI

## Special Requirements

✅ **Performance**: Voting must be fast (<200ms response)

✅ **UX**: No page reloads, smooth transitions

✅ **Presentation-Ready**: 
   - Admin view must be readable from 5m distance
   - Large font (at least 1.5rem for questions)
   - Large charts with clear contrast

✅ **No Registration**: No user accounts, anonymous voting

✅ **Rate Limiting**: IP-based max 3 votes, fingerprint-based 1 vote

✅ **GDPR Compliant**: 
   - No personal data stored
   - IP addresses only as hash
   - Fingerprint is pseudo-anonymous

## Nice-to-Have Features (if time permits)

- [ ] Confetti animation at certain vote count (e.g. at 50 votes)
- [ ] Countdown timer for voting phase in admin dashboard
- [ ] Export function (CSV/JSON) for results
- [ ] Dark/Light mode toggle (currently only dark for admin)
- [ ] Sound effect on new vote (optional, for live demo)
- [ ] Animated transitions between vote submission and success screen
- [ ] Admin analytics: Average rating per question
- [ ] Historical data: Votes over time (line chart)

## Dependencies Summary

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.0.0",
    "@fingerprintjs/fingerprintjs": "^4.0.0",
    "qrcode": "^1.5.0",
    "framer-motion": "^11.0.0",
    "d3-shape": "^3.2.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/qrcode": "^1.5.0",
    "@types/d3-shape": "^3.1.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

## Important Notes

⚠️ **No method is 100% secure** - But for a conference demo this is more than sufficient!

🎯 **Balance**: Security vs. user friction
- No CAPTCHA needed (annoys users)
- No email verification
- Fast, smooth voting

🚀 **Deployment Tips:**
- For production: Use PostgreSQL instead of SQLite (Vercel Edge Functions don't support SQLite optimally)
- SSE doesn't work perfectly on Vercel with Edge Runtime → Use polling fallback
- For optimal performance: Deploy on Railway/Fly.io with persistent SQLite or PostgreSQL

📱 **Mobile-First**: Voting interface MUST work perfectly on smartphones

🎨 **Design Principles**:
- Minimalist, no clutter (Mentimeter style)
- **Light theme** for both views (white/off-white)
- Colored accents for sliders/curves
- High contrast for presentations
- Smooth animations (gentle transitions)
- Large, readable font (min. 18px for questions)
- Clear call-to-actions

## Deliverables

1. ✅ Functional app (locally runnable)
2. ✅ README.md with setup instructions
3. ✅ Seed data pre-configured (3 questions)
4. ✅ Production-ready (ENV variables for DB, URLs, secrets)
5. ✅ Vote security implemented (fingerprint + IP + localStorage)
6. ✅ Live updates via SSE or polling
7. ✅ QR code generation
8. ✅ Animated charts with Framer Motion

---

**Important**: Keep the code simple and understandable - the project serves as a demo for 
"modern monolith". Use proven patterns, avoid over-engineering. The code should be explainable in a 
30-minute talk!

## Let's go! 🚀

Create the app step by step according to this plan. If anything is unclear: Ask!

