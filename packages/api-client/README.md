# FADDL Match API Client

Enterprise-grade TypeScript API client with real-time features, Islamic compliance, and guardian oversight for FADDL Match.

## Features

### 🚀 **Real-Time Integration**
- WebSocket connection management with automatic reconnection
- Circuit breaker pattern for failure resilience
- Performance monitoring and bandwidth optimization
- Sub-200ms message delivery
- Support for 50k+ concurrent connections

### 🕌 **Islamic Compliance**
- Automated content moderation with Islamic values
- Guardian approval workflows
- Prayer time and cultural sensitivity features
- Halal content verification

### 👥 **Guardian Oversight**
- Comprehensive guardian dashboard
- Real-time approval notifications
- Activity monitoring and compliance scoring
- Multi-guardian support with role-based permissions

### ⚡ **Performance & Scalability**
- Enterprise-grade connection pooling
- Intelligent caching strategies
- Rate limiting and throttling
- Automatic retry with exponential backoff

## Installation

```bash
npm install @faddlmatch/api-client
# or
yarn add @faddlmatch/api-client
```

## Quick Start

### Basic Setup

```typescript
import { createEnhancedFaddlMatchClient } from '@faddlmatch/api-client'

const client = createEnhancedFaddlMatchClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  authToken: 'your-auth-token',
  userId: 'user-id',
  isGuardian: false
})

// Access specialized services
const { messaging, guardian, matches, notifications } = client
```

### React Hook Integration

```typescript
import { useRealTimeUpdates, useAPIClient } from '@faddlmatch/api-client'

function MyComponent() {
  // Real-time updates
  const { state, actions, events } = useRealTimeUpdates({
    userId: 'user-id',
    authToken: 'token',
    supabaseUrl: 'url',
    supabaseKey: 'key',
    autoConnect: true
  })

  // API client
  const { api, services } = useAPIClient({
    supabaseUrl: 'url',
    supabaseKey: 'key',
    authToken: 'token',
    userId: 'user-id'
  })

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = events.onMessage((message) => {
      console.log('New message:', message)
    })
    
    return unsubscribe
  }, [events])

  return (
    <div>
      <p>Connection Status: {state.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Active Subscriptions: {state.subscriptionCount}</p>
    </div>
  )
}
```

## Core Services

### 📨 Messaging Service

```typescript
// Send message with compliance checking
const response = await messaging.sendMessage({
  conversationId: 'conv-123',
  content: 'Assalamu alaikum, how are you?',
  messageType: 'text'
})

// Get conversation thread with pagination
const thread = await messaging.getMessageThread('conv-123', 50)

// Send typing indicator
await messaging.sendTypingIndicator('conv-123', true)

// Search messages
const results = await messaging.searchMessages('halal', {
  conversationId: 'conv-123',
  dateRange: { from: new Date('2024-01-01'), to: new Date() }
})
```

### 💕 Matches Service

```typescript
// Get daily matches with compatibility scoring
const dailyMatches = await matches.getDailyMatches()

// Respond to a match
const matchResponse = await matches.respondToMatch('match-123', 'accepted')

// Get match statistics
const stats = await matches.getMatchStatistics('month')

// Update preferences
await matches.updateMatchPreferences({
  ageRange: [25, 35],
  religiousRequirements: {
    minPrayerFrequency: 'usually',
    modestDressRequired: true,
    islamicValuesImportance: 90
  }
})
```

### 👤 Guardian Service

```typescript
// Get guardian dashboard
const dashboard = await guardian.getDashboard()

// Review approval request
await guardian.reviewApprovalRequest('request-123', 'approved', 'Looks good')

// Get compliance metrics
const compliance = await guardian.getComplianceMetrics()

// Invite new guardian
await guardian.inviteGuardian({
  email: 'guardian@example.com',
  name: 'Guardian Name',
  relationship: 'father',
  permissions: {
    canViewMessages: true,
    canApproveMatches: true,
    requiresApproval: true
  }
})
```

### 🔔 Notifications Service

```typescript
// Get notifications with filtering
const { notifications, total } = await notificationService.getNotifications({
  category: 'matches',
  status: 'unread',
  limit: 20
})

// Mark as read
await notificationService.markAsRead('notification-123')

// Update preferences
await notificationService.updatePreferences({
  categories: {
    matches: {
      enabled: true,
      push: true,
      email: false,
      priority: 'high'
    }
  },
  islamicSettings: {
    prayerTimeQuiet: true,
    ramadanMode: true
  }
})

// Subscribe to push notifications
await notificationService.subscribeToPush({
  endpoint: 'push-endpoint',
  keys: { p256dh: 'key', auth: 'auth' },
  deviceType: 'web'
})
```

## Real-Time Features

### Connection Management

```typescript
import { RealtimeConnectionManager } from '@faddlmatch/api-client'

const connection = new RealtimeConnectionManager(
  supabaseUrl,
  supabaseKey,
  authToken,
  {
    maxRetries: 5,
    retryDelay: 1000,
    heartbeatInterval: 30000,
    maxConcurrentConnections: 10
  }
)

// Connect with automatic retry
await connection.connect()

// Monitor connection health
connection.on('connection:established', (health) => {
  console.log('Connected with latency:', health.latency)
})

connection.on('connection:error', (error) => {
  console.error('Connection error:', error)
})
```

### Subscription Management

```typescript
import { RealtimeSubscriptionManager } from '@faddlmatch/api-client'

const subscriptions = new RealtimeSubscriptionManager(
  connection,
  userId,
  isGuardian
)

// Subscribe to messages with Islamic compliance
const messageSubscription = await subscriptions.subscribeToMessages('conv-123')

// Subscribe to match updates
const matchSubscription = await subscriptions.subscribeToMatches()

// Handle events
subscriptions.on('message:received', (message) => {
  // Automatically filtered for Islamic compliance
  console.log('New compliant message:', message)
})

subscriptions.on('guardian:approval_required', (event) => {
  // Guardian notification
  console.log('Approval needed:', event)
})
```

## Connection Monitoring

```typescript
import { useConnectionStatus } from '@faddlmatch/api-client'

function ConnectionMonitor() {
  const { status, recommendations, refresh } = useConnectionStatus({
    enableNetworkMonitoring: true,
    enableAPIHealthChecks: true,
    healthCheckInterval: 60000,
    onStatusChange: (status) => {
      console.log('Connection status changed:', status.overall)
    }
  })

  return (
    <div>
      <div>Status: {status.overall}</div>
      <div>Network: {status.network.isOnline ? 'Online' : 'Offline'}</div>
      <div>API: {status.api.status}</div>
      <div>Real-time: {status.realtime.isConnected ? 'Connected' : 'Disconnected'}</div>
      
      {recommendations.length > 0 && (
        <div>
          <h3>Recommendations:</h3>
          <ul>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      <button onClick={refresh}>Refresh Status</button>
    </div>
  )
}
```

## Islamic Compliance Features

### Content Validation

```typescript
// Automatic content validation
const message = await messaging.sendMessage({
  conversationId: 'conv-123',
  content: 'Your message content'
})

// Compliance check included in response
if (message.moderationStatus === 'flagged') {
  console.log('Message requires review')
}
```

### Guardian Workflows

```typescript
// Guardian approval workflow
const approvalRequest = {
  type: 'match',
  matchId: 'match-123',
  priority: 'high',
  details: {
    compatibilityScore: 85,
    reason: 'High compatibility match'
  }
}

// Automatically routes to appropriate guardian
await guardian.requestApproval(approvalRequest)
```

### Prayer Time Awareness

```typescript
// Notification preferences with Islamic considerations
const preferences = {
  islamicSettings: {
    prayerTimeQuiet: true,
    fridayQuiet: true,
    ramadanMode: true,
    halalContentOnly: true
  },
  globalSettings: {
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      timezone: 'Asia/Singapore'
    }
  }
}

await notifications.updatePreferences(preferences)
```

## Performance Optimization

### Caching Strategies

```typescript
// Built-in intelligent caching
const conversations = await messaging.getConversations() // Cached for 2 minutes
const matches = await matching.getDailyMatches() // Cached for 1 hour
const profile = await api.getProfile(userId) // Cached for 15 minutes
```

### Rate Limiting

```typescript
// Automatic rate limiting per service
const subscriptionOptions = {
  rateLimiting: {
    maxEventsPerSecond: 10,
    burstLimit: 50
  }
}

await subscriptions.subscribeToMessages('conv-123', subscriptionOptions)
```

### Connection Pooling

```typescript
// Enterprise connection management
const connectionConfig = {
  maxConcurrentConnections: 10,
  connectionPoolSize: 5,
  heartbeatInterval: 30000,
  reconnectTimeout: 5000
}
```

## Error Handling

### Circuit Breaker Pattern

```typescript
// Automatic circuit breaker for resilience
connection.on('circuit:open', () => {
  console.log('Circuit breaker opened - service unavailable')
})

connection.on('circuit:closed', () => {
  console.log('Circuit breaker closed - service restored')
})
```

### Retry Logic

```typescript
// Built-in exponential backoff retry
const { executeWithRetry } = useAPIClient(config)

const result = await executeWithRetry(async () => {
  return api.sendMessage(messageData)
})
```

### Graceful Degradation

```typescript
// Automatic fallback strategies
if (!state.isConnected) {
  // Offline mode - queue messages
  console.log('Offline mode: queuing message')
} else {
  // Online mode - send immediately
  await messaging.sendMessage(messageData)
}
```

## Development

### Environment Setup

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Testing

```typescript
// Mock the API client for testing
import { createMockFaddlMatchClient } from '@faddlmatch/api-client/testing'

const mockClient = createMockFaddlMatchClient()
mockClient.messaging.sendMessage.mockResolvedValue({
  messageId: 'test-123',
  deliveredAt: new Date(),
  moderationStatus: 'approved'
})
```

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
FADDL_MATCH_API_TIMEOUT=30000
FADDL_MATCH_RETRY_ATTEMPTS=3
FADDL_MATCH_ENABLE_CACHING=true
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "lib": ["dom", "es2020"],
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Advanced Usage

### Custom Event Handlers

```typescript
// Custom message processing
messaging.on('message:received', async (message) => {
  // Custom processing logic
  if (message.type === 'voice') {
    await processVoiceMessage(message)
  }
})
```

### Performance Monitoring

```typescript
// Real-time performance metrics
connection.on('performance:update', (metrics) => {
  console.log('Latency:', metrics.connectionLatency)
  console.log('Throughput:', metrics.eventThroughput)
  console.log('Error rate:', metrics.errorRate)
})
```

### Guardian Dashboard Integration

```typescript
// Complete guardian workflow
function GuardianDashboard() {
  const [dashboard, setDashboard] = useState<GuardianDashboard>()
  
  useEffect(() => {
    const loadDashboard = async () => {
      const data = await guardian.getDashboard()
      setDashboard(data)
    }
    
    // Real-time updates
    const unsubscribe = guardian.onNotification((notification) => {
      if (notification.type === 'approval_request') {
        loadDashboard() // Refresh dashboard
      }
    })
    
    loadDashboard()
    return unsubscribe
  }, [])
  
  return (
    <div>
      <h2>Guardian Dashboard</h2>
      <div>Pending Approvals: {dashboard?.pendingApprovals.length}</div>
      <div>Compliance Score: {dashboard?.complianceMetrics.overallScore}%</div>
    </div>
  )
}
```

## API Reference

### Core Classes

- `FaddlMatchApiClient` - Main API client (legacy)
- `RealtimeConnectionManager` - WebSocket connection management
- `RealtimeSubscriptionManager` - Real-time event subscriptions
- `MessagingService` - Message operations with compliance
- `GuardianService` - Guardian oversight and approval workflows
- `MatchesService` - Matching system with Islamic compatibility
- `NotificationsService` - Notification system with Islamic preferences

### React Hooks

- `useRealTimeUpdates` - Real-time connection and event management
- `useAPIClient` - Centralized API service access with error handling
- `useConnectionStatus` - Network and API health monitoring

### Type Definitions

All services include comprehensive TypeScript definitions for:
- Request/response interfaces
- Event types and payloads
- Configuration options
- Error handling
- Islamic compliance features

## Support

For enterprise support, integration assistance, or custom Islamic compliance requirements:

- Email: support@faddlmatch.com
- Documentation: https://docs.faddlmatch.com
- Enterprise: https://faddlmatch.com/enterprise

## License

UNLICENSED - Proprietary to FADDL Match