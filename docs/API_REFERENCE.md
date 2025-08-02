# FADDL Match API Reference

## Overview

The FADDL Match API provides comprehensive backend services for the Islamic matrimonial platform. Built on Supabase Edge Functions with TypeScript and Deno runtime.

## Base URL
```
https://your-project-ref.supabase.co/functions/v1
```

## Authentication

All API endpoints require authentication via Bearer token (Clerk JWT).

```typescript
headers: {
  'Authorization': 'Bearer <clerk-jwt-token>',
  'Content-Type': 'application/json'
}
```

## Rate Limiting

- **Messages**: 50 per hour per user
- **Match Generation**: 10 per hour per user
- **Profile Updates**: 20 per hour per user

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Error Handling

All endpoints return standardized error responses:

```typescript
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid auth)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Endpoints

### Authentication & User Management

#### Sync User with Supabase
**POST** `/auth-sync-user`

Synchronizes Clerk user data with Supabase database.

**Request Body:**
```typescript
{
  "userId": "clerk_user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "User synced successfully"
}
```

### Profile Management

#### Create Profile
**POST** `/profile-create`

Creates a comprehensive user profile for matrimonial matching.

**Request Body:**
```typescript
{
  "userId": "clerk_user_id",
  "basicInfo": {
    "age": 25,
    "gender": "male",
    "location_city": "Singapore",
    "location_country": "Singapore",
    "bio": "Practicing Muslim seeking marriage partner..."
  },
  "religiousInfo": {
    "religious_level": "practicing",
    "prayer_frequency": "regularly",
    "hijab_preference": "preferred" // For male profiles
  },
  "personalInfo": {
    "education_level": "bachelors",
    "occupation": "Software Engineer",
    "interests": ["reading", "hiking", "cooking"],
    "languages": ["English", "Arabic"],
    "seeking_marriage_timeline": "within_year"
  },
  "familyInfo": {
    "guardian_enabled": true,
    "guardian_email": "guardian@example.com",
    "family_values": ["respect", "kindness", "faith"],
    "children_preference": "definitely"
  },
  "preferences": {
    "age_range": [22, 30],
    "location_radius_km": 50,
    "education_preference": ["bachelors", "masters"],
    "religious_level_preference": ["practicing", "devout"]
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    // ... profile data
  },
  "validation": {
    "completion_percentage": 85,
    "missing_fields": [],
    "status": "active"
  }
}
```

#### Update Profile
**POST** `/profile-update`

Updates existing user profile with partial data.

**Request Body:**
```typescript
{
  "userId": "clerk_user_id",
  "updates": {
    "bio": "Updated bio text...",
    "interests": ["new", "interests"]
  }
}
```

### Matching System

#### Generate Matches
**POST** `/matches-generate`

Generates AI-powered compatibility matches for a user.

**Request Body:**
```typescript
{
  "userId": "clerk_user_id",
  "limit": 10,
  "filters": {
    "ageRange": [25, 35],
    "locationRadius": 100,
    "educationLevel": ["bachelors", "masters"],
    "religiousLevel": ["practicing", "devout"]
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "matches": [
    {
      "profile": {
        "id": "uuid",
        "age": 26,
        "location_city": "Singapore",
        // ... profile data
      },
      "compatibility_score": 88,
      "shared_interests": ["reading", "hiking"],
      "reasons": [
        "Similar religious commitment level",
        "Compatible age range",
        "Same city",
        "Shared interests: reading, hiking"
      ]
    }
  ],
  "total_candidates_evaluated": 45,
  "generated_at": "2024-01-15T10:30:00Z"
}
```

#### Respond to Match
**POST** `/matches-respond`

Accept or reject a potential match.

**Request Body:**
```typescript
{
  "matchId": "uuid",
  "response": "accepted" // or "rejected"
}
```

### Messaging System

#### Send Message
**POST** `/messages-send`

Send a message with Islamic compliance moderation.

**Request Body:**
```typescript
{
  "conversationId": "uuid",
  "content": "Assalamu alaikum, how are you?",
  "messageType": "text",
  "replyToId": "uuid" // optional
}
```

**Response:**
```typescript
{
  "success": true,
  "message": {
    "id": "uuid",
    "content": "Assalamu alaikum, how are you?",
    "created_at": "2024-01-15T10:30:00Z",
    "sender": {
      "id": "uuid",
      "first_name": "John"
    }
  },
  "moderation": {
    "approved": true,
    "warning": null,
    "requires_guardian_review": false
  },
  "rate_limit": {
    "remaining": 49,
    "reset_at": "2024-01-15T11:30:00Z"
  }
}
```

#### Get Conversation
**GET** `/messages/conversation/:conversationId`

Retrieve conversation history.

**Query Parameters:**
- `limit`: Number of messages (default: 50)
- `before`: Message ID for pagination

**Response:**
```typescript
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "content": "Message content",
      "created_at": "2024-01-15T10:30:00Z",
      "sender": {
        "id": "uuid",
        "first_name": "John"
      }
    }
  ],
  "has_more": true
}
```

### Guardian System

#### Invite Guardian
**POST** `/guardian-invite`

Invite a family guardian to oversee matches.

**Request Body:**
```typescript
{
  "guardianEmail": "guardian@example.com",
  "userId": "clerk_user_id"
}
```

#### Guardian Approval
**POST** `/guardian-approve`

Guardian approves or rejects a match.

**Request Body:**
```typescript
{
  "matchId": "uuid",
  "approved": true,
  "notes": "Good match, proceed with conversation"
}
```

### Analytics & Tracking

#### Track Event
**POST** `/analytics-track`

Track user events for analytics.

**Request Body:**
```typescript
{
  "userId": "clerk_user_id",
  "eventType": "profile_viewed",
  "eventData": {
    "viewed_profile_id": "uuid",
    "source": "match_recommendations"
  }
}
```

## TypeScript Client

Use the official TypeScript client for type-safe API interactions:

```typescript
import { createFaddlMatchClient } from '@faddlmatch/api-client'

const client = createFaddlMatchClient({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key',
  authToken: 'clerk-jwt-token'
})

// Create profile
const result = await client.createProfile({
  userId: 'user_123',
  basicInfo: {
    age: 25,
    gender: 'male',
    // ... other fields
  }
})

// Generate matches
const matches = await client.generateMatches({
  userId: 'user_123',
  limit: 10
})

// Send message
const message = await client.sendMessage({
  conversationId: 'conv_123',
  content: 'Hello!'
})
```

## Real-time Features

Subscribe to real-time updates using Supabase channels:

```typescript
// Subscribe to new matches
client.subscribeToMatches('user_123', (payload) => {
  console.log('New match:', payload.new)
})

// Subscribe to new messages
client.subscribeToMessages('conversation_123', (payload) => {
  console.log('New message:', payload.new)
})
```

## Islamic Compliance Features

### Content Moderation
All messages are automatically moderated for:
- Inappropriate content
- Contact information sharing
- Non-Islamic communication patterns

### Guardian System
- Family oversight for users under 25
- Guardian approval for matches
- Family involvement in meeting arrangements

### Halal Communication
- Structured conversation guidelines
- Marriage-focused discussions
- Respectful interaction patterns

## Performance Targets

- **API Response Time**: <200ms (95th percentile)
- **Match Generation**: <500ms for 10 matches
- **Message Delivery**: <100ms
- **Concurrent Users**: 1000+ simultaneous API calls

## Development & Testing

### Local Development
```bash
# Start Supabase locally
supabase start

# Deploy functions
supabase functions deploy

# Test endpoints
curl -X POST 'http://localhost:54321/functions/v1/auth-sync-user' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test_user"}'
```

### Environment Variables
Required environment variables for Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for AI features)

## Support

For API support and questions:
- GitHub Issues: [Repository Issues](https://github.com/nicholsmindset/faddlmatch2025/issues)
- Documentation: [API Docs](./API_REFERENCE.md)
- Architecture: [System Overview](./ARCHITECTURE_OVERVIEW.md)