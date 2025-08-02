# FADDL Match - Product Design Requirements (PDR)

## Executive Summary

**Funding & Quality Mandate**
We aim to secure Series C financing from top-tier Silicon Valley investors within the next 12 months. Accordingly, every component of this SaaS—codebase, architecture, security, scalability, and user experience—must meet enterprise-grade standards and be demonstrably ready for rapid global expansion.

**Core Value Engine**
The backend for browsing profiles and the matchmaking algorithm is the bread and butter of our SaaS. This system must deliver sub-200ms response times, handle 100k+ concurrent users, and provide culturally-aware, AI-powered matching that demonstrably outperforms competitors.

## 1. Product Overview

### 1.1 Product Vision
FADDLmatch is a respectful, Islamic matrimonial platform designed specifically for divorced and widowed Muslims in Singapore seeking meaningful remarriage opportunities with family involvement and Islamic values at the center.

### 1.2 Core Value Proposition
- **Primary:** Facilitate halal remarriage connections for divorced/widowed Muslims
- **Secondary:** Provide family-inclusive matching with privacy controls
- **Tertiary:** Create a safe, respectful environment guided by Islamic principles

### 1.3 Target Users
- **Primary:** Divorced and widowed Muslims in Singapore (ages 25-55)
- **Secondary:** Family members/guardians (Wali) providing oversight
- **Tertiary:** Marriage counselors and Islamic advisors

## 2. User Journey & Information Architecture

### 2.1 Primary User Flow
```
Landing → Registration → Profile Creation → Matching → Communication → Family Meeting → Success
```

### 2.2 Next.js Route Structure

```typescript
// Route Structure Based on User Journey
/                           // Landing page
/auth
  /login                   // Existing user login
  /register               // New user registration
  /verify                 // Email/phone verification
  /forgot-password        // Password recovery

/onboarding
  /welcome                // Post-registration welcome
  /basic-info            // Name, year of birth, location
  /family-situation      // Children, living situation
  /islamic-practice      // Prayer frequency, modest dress
  /preferences           // Partner preferences
  /values-quiz          // Question-based matching
  /photo-upload         // Profile photo with privacy options
  /guardian-setup       // Optional Wali integration

/dashboard                // Main user dashboard
  /matches              // View compatible matches
  /search               // Advanced search filters
  /profile              // View/edit own profile
  /messages             // Communication center
  /activity             // Interaction history

/profile
  /[userId]             // Public profile view
  /edit                 // Edit profile sections
  /privacy              // Privacy settings
  /verification         // Profile verification status

/matches
  /discover             // Browse matches
  /recommended          // AI-recommended matches
  /saved                // Bookmarked profiles
  /mutual               // Mutual interest

/messages
  /inbox                // All conversations
  /[conversationId]     // Individual chat
  /requests             // Pending chat requests
  /blocked              // Blocked users

/family
  /guardian-dashboard   // Wali oversight panel
  /meeting-scheduler    // Family meeting coordination
  /approval-requests    // Guardian approval queue

/settings
  /account              // Account settings
  /privacy              // Privacy controls
  /notifications        // Notification preferences
  /subscription         // Payment/billing
  /help                 // Support center

/admin
  /moderation           // Content moderation
  /reports              // User reports
  /analytics            // Platform analytics
```

## 3. Feature Specifications by Route

### 3.1 Landing Page (`/`)
**Purpose:** Convert visitors to registered users
**Key Elements:**
- Hero: "Welcome to FADDLmatch - Your journey into the next chapter of your life begins here"
- Value props: Muslim Values First, Privacy Controls, Serious Intentions
- Success stories carousel
- CTA: "Begin Your Journey" → Registration

### 3.2 Authentication (`/auth/*`)
**Purpose:** Secure user access
**Features:**
- Email/phone authentication
- Two-factor authentication option
- Social login (Google/Facebook) with Islamic compliance check
- Guardian co-registration option

### 3.3 Onboarding (`/onboarding/*`)
**Purpose:** Collect essential matching data
**Progressive Disclosure:**
1. Basic Info: Name, Year of Birth, Gender, Location (North/South/East/West/Central)
2. Family Situation: Current children, open to more children
3. Islamic Practice: Prayer frequency, modest dress adherence
4. Background: Ethnicity (Malay/Chinese/Indian/Eurasian/Other), Languages
5. Partner Preferences: Top 5 qualities, location preference, age range
6. Values Assessment: 10-question compatibility quiz
7. Profile Photo: With blur/hide options for privacy

### 3.4 Dashboard (`/dashboard`)
**Purpose:** Central hub for user activity
**Components:**
- Daily match recommendations (3-5 profiles)
- Unread messages indicator
- Profile completion meter
- Islamic reminder/quote of the day
- Quick actions: Browse, Search, Messages

### 3.5 Matching System (`/matches/*`)
**Purpose:** Present compatible profiles
**Features:**
- Grid/list view toggle
- Quick filter pills: Age range, Location, Has children
- Compatibility score display (based on values quiz)
- "Express Interest" / "Pass" actions
- Mutual match notifications

### 3.6 Messaging (`/messages/*`)
**Purpose:** Facilitate halal communication
**Guidelines:**
- Initial contact templates
- Message read receipts
- Voice note capability (with moderation)
- Report inappropriate behavior
- Guardian visibility toggle

### 3.7 Family Integration (`/family/*`)
**Purpose:** Include family in the process
**Features:**
- Guardian invitation system
- Supervised chat option
- Meeting scheduler with calendar integration
- Approval workflow for matches

## 4. Data Models & State Management

### 4.1 Core Data Entities

```typescript
// User Profile
interface UserProfile {
  id: string
  email: string
  phone?: string
  basicInfo: {
    firstName: string
    lastName: string
    yearOfBirth: number
    gender: 'male' | 'female'
    location: 'north' | 'south' | 'east' | 'west' | 'central'
  }
  familySituation: {
    maritalStatus: 'divorced' | 'widowed'
    hasChildren: boolean
    childrenCount?: number
    childrenAges?: number[]
  }
  islamicPractice: {
    prayerFrequency: 'always' | 'usually' | 'rarely'
    modestDress: 'always' | 'usually' | 'rarely'
  }
  background: {
    ethnicity: 'malay' | 'chinese' | 'indian' | 'eurasian' | 'other'
    languages: string[]
    education: string
    profession: string
  }
  preferences: {
    ageRange: { min: number, max: number }
    locationPreference: string[]
    topQualities: string[] // max 5
    dealBreakers: string[]
  }
  valuesQuizResponses: Record<string, number>
  photos: {
    primary: string
    additional: string[]
    visibility: 'public' | 'matches' | 'approved'
  }
  guardian?: {
    name: string
    relationship: string
    contact: string
    approvalRequired: boolean
  }
  subscription: {
    tier: 'basic' | 'premium'
    expiresAt: Date
  }
  createdAt: Date
  lastActive: Date
}

// Match Entity
interface Match {
  id: string
  users: [string, string]
  compatibilityScore: number
  matchedAt: Date
  status: 'pending' | 'mutual' | 'rejected' | 'expired'
  interactionHistory: InteractionEvent[]
}

// Message Entity
interface Message {
  id: string
  conversationId: string
  senderId: string
  recipientId: string
  content: string
  type: 'text' | 'voice' | 'image'
  status: 'sent' | 'delivered' | 'read'
  moderationStatus: 'pending' | 'approved' | 'flagged'
  timestamp: Date
}
```

### 4.2 State Management Architecture
- **Global State:** Zustand for user session, preferences
- **Server State:** TanStack Query for profile data, matches
- **Form State:** React Hook Form with Zod validation
- **Real-time State:** Socket.io for messages, notifications

## 5. Component Architecture by Agent

### 5.1 Frontend-Experience Agent Components

```typescript
// Reusable UI Components
/components
  /ui
    /Button
    /Card
    /Input
    /Select
    /Modal
    /Toast
  /profile
    /ProfileCard
    /ProfileGrid
    /CompatibilityBadge
  /chat
    /MessageBubble
    /ChatHeader
    /TypingIndicator
  /onboarding
    /ProgressBar
    /StepNavigation
    /ValueSlider
```

### 5.2 Matching-Intelligence Agent Integration

```typescript
// Matching Algorithm Endpoints
/api/matches
  /generate         // POST: Generate daily matches
  /score           // GET: Calculate compatibility score
  /filter          // POST: Apply advanced filters
  /recommend       // GET: ML-based recommendations
```

### 5.3 Conversation-Safety Agent Integration

```typescript
// Moderation Endpoints
/api/moderation
  /text            // POST: Check message content
  /image           // POST: Verify photo appropriateness
  /report          // POST: User reporting system
  /block           // POST: Block user functionality
```

## 6. Design System & UI Guidelines

### 6.1 Visual Design Principles
- **Clean & Respectful:** Minimal, professional aesthetic
- **Cultural Sensitivity:** Appropriate imagery, no casual dating vibes
- **Accessibility First:** WCAG 2.1 AA compliance
- **Mobile-First:** 70% users expected on mobile

### 6.2 Color Palette
```scss
// Primary Colors
$primary-green: #2E7D32;      // Islamic green
$primary-gold: #FFB300;       // Accent color

// Neutral Colors
$neutral-900: #1A1A1A;        // Primary text
$neutral-600: #666666;        // Secondary text
$neutral-100: #F5F5F5;        // Backgrounds

// Semantic Colors
$success: #4CAF50;
$warning: #FF9800;
$error: #F44336;
```

### 6.3 Typography
```scss
// Font Stack
$font-primary: 'Inter', -apple-system, sans-serif;
$font-arabic: 'Noto Naskh Arabic', serif;

// Type Scale
$heading-1: 2.5rem;    // Page titles
$heading-2: 2rem;      // Section headers
$heading-3: 1.5rem;    // Card titles
$body: 1rem;           // Body text
$caption: 0.875rem;    // Helper text
```

## 7. Performance Requirements

### 7.1 Core Web Vitals Targets
- **LCP:** < 2.5s (Largest Contentful Paint)
- **FID:** < 100ms (First Input Delay)
- **CLS:** < 0.1 (Cumulative Layout Shift)
- **TTI:** < 3.5s (Time to Interactive)

### 7.2 API Response Times
- **Authentication:** < 200ms
- **Profile Load:** < 300ms
- **Match Generation:** < 500ms
- **Message Delivery:** < 100ms

### 7.3 Optimization Strategies
- Next.js Image optimization for profile photos
- API route caching with Redis
- Static generation for marketing pages
- Progressive enhancement for slow connections

## 8. Security & Privacy Requirements

### 8.1 Data Protection
- **Encryption:** AES-256 for PII at rest
- **Transport:** TLS 1.3 minimum
- **Authentication:** JWT with refresh tokens
- **Rate Limiting:** 100 requests/minute per IP

### 8.2 Privacy Controls
- **Photo Visibility:** 3-tier system (public/matches/approved)
- **Location Masking:** Show only region, not exact location
- **Contact Info:** Hidden until mutual match
- **Guardian Access:** Explicit consent required

### 8.3 Compliance
- **PDPA:** Singapore Personal Data Protection Act
- **Islamic Guidelines:** No opposite-gender photo sharing without guardian approval
- **Age Verification:** 18+ requirement with ID check for premium

## 9. Analytics & Success Metrics

### 9.1 User Acquisition
- **Target:** 1,000 MAU within 6 months
- **Conversion:** 15% visitor → registration
- **Activation:** 60% complete profile within 7 days

### 9.2 Engagement Metrics
- **Daily Active:** 40% DAU/MAU ratio
- **Matches:** 5+ mutual matches per active user/month
- **Messages:** 70% match → conversation rate
- **Success:** 10% → family meeting stage

### 9.3 Technical Metrics
- **Uptime:** 99.9% availability
- **Error Rate:** < 0.1% API errors
- **Load Time:** 90th percentile < 3s
- **Crash Rate:** < 0.5% mobile sessions

## 10. Agent Collaboration Matrix

| Route/Feature | Primary Agent | Supporting Agents |
|--------------|---------------|-------------------|
| Landing Page | Frontend-Experience | Performance & Observability |
| Authentication | Security & Compliance | Backend-API |
| Onboarding | Frontend-Experience | Data-Model & Migration |
| Matching | Matching-Intelligence | Backend-API, Performance |
| Messaging | Conversation-Safety | Security & Compliance |
| Profile Management | Backend-API | Data-Model & Migration |
| Family Features | Frontend-Experience | Security & Compliance |
| Admin Panel | QA-Automation | DevOps & CI/CD |

## 11. Development Phases

### Phase 1: Foundation (Weeks 1-4)
- Core authentication system
- Basic profile creation
- Database schema implementation
- CI/CD pipeline setup

### Phase 2: Matching MVP (Weeks 5-8)
- Matching algorithm v1
- Browse/search functionality
- Basic messaging system
- Mobile responsive design

### Phase 3: Family Features (Weeks 9-12)
- Guardian integration
- Privacy controls
- Advanced filtering
- Notification system

### Phase 4: Intelligence Layer (Weeks 13-16)
- ML-based recommendations
- Conversation moderation
- Analytics dashboard
- Performance optimization

### Phase 5: Launch Preparation (Weeks 17-20)
- Security audit
- Load testing
- Beta user program
- Marketing site completion

## 12. Technical Stack Summary

- **Framework:** Next.js 15.4 (App Router)
- **UI Library:** React 18 with TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **State:** Zustand + TanStack Query
- **Database:** Supabase (PostgreSQL with pgvector)
- **Edge Functions:** Supabase Edge Functions (Deno)
- **Auth:** Supabase Auth with JWT + MFA
- **AI/ML:** OpenAI API + Embeddings
- **Hosting:** Netlify (Frontend) + Supabase (Backend)
- **CDN:** Netlify Edge
- **Monitoring:** Sentry + Netlify Analytics
- **Testing:** Playwright + Jest + Vitest
- **Real-time:** Supabase Realtime
- **Search:** Supabase Full-Text Search + pgvector

## 13. Agent Architecture & Execution Order

### 13.1 Agent Hierarchy
```
1. Orchestrator-Planner Agent (Master Controller)
   ├── 2. Database-Architect Agent (Supabase)
   ├── 3. Backend-API Agent (Edge Functions)
   ├── 4. Matching-Intelligence Agent (Core Algorithm)
   ├── 5. OpenAI-Integration Agent (AI Features)
   ├── 6. Frontend-Experience Agent (Next.js UI)
   ├── 7. Security-Compliance Agent (PDPA/Islamic)
   ├── 8. Netlify-Deployment Agent (Infrastructure)
   ├── 9. QA-Playwright Agent (Testing)
   └── 10. Performance-Observability Agent (Monitoring)
```

### 13.2 Build Order & Dependencies
1. **Foundation Phase:** Database → Backend API → Security
2. **Core Features:** Matching Algorithm → OpenAI Integration
3. **User Interface:** Frontend → QA Testing
4. **Deployment:** Netlify Setup → Performance Monitoring

### 13.3 Context Documentation
All agents must reference Context 7 documentation when needed for:
- Supabase best practices
- OpenAI API guidelines
- Netlify deployment patterns
- Playwright testing strategies
- Next.js 15.4 App Router patterns
