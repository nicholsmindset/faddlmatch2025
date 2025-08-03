# FADDL Match - Local Development Guide

## 🚀 Quick Start

Your FADDL Match Islamic matrimonial platform is now running locally!

### Access Your Site
- **Main App**: http://localhost:3000
- **Network Access**: http://192.168.4.46:3000 (for mobile testing)

## 📱 Available Pages

### Public Pages (No Authentication Required)
- **Homepage**: http://localhost:3000/
- **About**: http://localhost:3000/about
- **Privacy Policy**: http://localhost:3000/privacy
- **Terms of Service**: http://localhost:3000/terms
- **Sign In**: http://localhost:3000/auth/sign-in
- **Sign Up**: http://localhost:3000/auth/sign-up

### Authenticated Pages (Login Required)
- **Dashboard**: http://localhost:3000/dashboard
- **Matches**: http://localhost:3000/matches
- **Messages**: http://localhost:3000/messages
- **Profile**: http://localhost:3000/profile
- **Settings**: http://localhost:3000/settings
- **Onboarding**: http://localhost:3000/onboarding

### Special Features
- **Guardian Portal**: http://localhost:3000/guardian (guardian role required)
- **API Webhooks**: http://localhost:3000/api/webhooks/clerk

## 🛠 Development Commands

```bash
# Start development server
npm run dev

# Build for production (test deployment readiness)
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Clean build files
npm run clean
```

## 🏗 Project Structure

```
FADDLMATCH_v1/
├── apps/
│   └── web/                 # Next.js 15.1.2 main application
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # Reusable UI components
│       │   ├── hooks/       # Custom React hooks
│       │   └── lib/         # Utilities and configurations
├── packages/
│   ├── api-client/          # API client library
│   ├── ai-integration/      # OpenAI integration package
│   └── types/               # Shared TypeScript types
└── supabase/
    └── functions/           # Edge Functions
```

## 🔐 Authentication & Features

### Current Features Available
- ✅ **Clerk Authentication**: Modern auth with social logins
- ✅ **Supabase Database**: PostgreSQL with real-time features
- ✅ **Islamic Compliance**: Guardian oversight, Islamic values
- ✅ **Modern UI**: Tailwind CSS with Radix UI components
- ✅ **AI Matching**: OpenAI-powered compatibility scoring
- ✅ **Real-time Messaging**: Live chat with moderation
- ✅ **Responsive Design**: Mobile-first, works on all devices

### Pages to Test
1. **Homepage** - Landing page with Islamic design
2. **Sign Up Flow** - Create account with Islamic requirements
3. **Onboarding** - Complete profile setup process
4. **Dashboard** - Main user interface with metrics
5. **Matches** - Browse potential matches with filtering
6. **Messages** - Real-time conversations with moderation

## 📱 Mobile Testing

Access your site on mobile devices using the network URL:
**http://192.168.4.46:3000**

This allows you to test the responsive design on actual mobile devices connected to the same WiFi network.

## 🐛 Known Development Issues

The following packages have TypeScript errors but don't affect the main web app:
- `@faddlmatch/api-client` - Module resolution issues
- `@faddl-match/ai-integration` - Export conflicts

The main web application at localhost:3000 works perfectly despite these package-level errors.

## 🚀 Deployment Status

Your app is configured for:
- **Staging**: Netlify deployment (currently being fixed)
- **Database**: Supabase PostgreSQL (production-ready)
- **Auth**: Clerk (production-ready)
- **AI**: OpenAI integration (production-ready)

## 🎯 Next Steps

1. **Test all pages** - Navigate through the authentication flow
2. **Create test accounts** - Sign up and complete onboarding
3. **Test matching system** - Browse and interact with matches
4. **Test messaging** - Send messages and test real-time features
5. **Mobile testing** - Use network URL on mobile devices
6. **Guardian features** - Test guardian oversight functionality

Happy developing! 🎉