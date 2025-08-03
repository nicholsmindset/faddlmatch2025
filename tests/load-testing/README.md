# FADDL Match Real-Time Messaging Load Testing Suite

Comprehensive load testing framework for FADDL Match's real-time messaging system, focusing on WebSocket performance, Islamic compliance features, and mobile device behavior simulation.

## 🎯 Testing Objectives

### Primary Goals
- **WebSocket Performance**: Test connection capacity, stability, and message throughput
- **Islamic Compliance**: Validate content moderation and guardian oversight under load
- **Mobile Optimization**: Simulate real mobile device messaging behavior
- **Scalability**: Identify system limits and bottlenecks
- **Reliability**: Ensure stable performance under sustained load

### Key Metrics
- Message delivery latency (<100ms p95)
- WebSocket connection stability (>99.5% uptime)
- Moderation accuracy (>95%)
- Guardian notification speed (<300ms)
- Mobile push notification delivery (>95%)

## 🏗️ Architecture

### Core Components

1. **RealTimeMessagingLoadTester** (`realtime-messaging-load-test.ts`)
   - Main orchestrator for comprehensive load testing
   - Manages user simulation, message throughput, and metrics collection
   - Coordinates all testing phases

2. **WebSocketPerformanceTester** (`websocket-performance-tester.ts`)
   - Specialized WebSocket connection and performance testing
   - Tests connection establishment, message latency, and stability
   - Measures heartbeat/ping-pong performance

3. **IslamicComplianceLoadTester** (`islamic-compliance-tester.ts`)
   - Content moderation testing under load
   - Guardian oversight functionality validation
   - Cultural sensitivity and prayer time compliance testing

4. **MobileDeviceSimulator** (`mobile-messaging-simulator.ts`)
   - Simulates iOS and Android messaging behavior
   - Tests push notifications, background app states, and network switching
   - Models real mobile user patterns

5. **Test Runner** (`run-messaging-load-test.ts`)
   - CLI interface for executing tests
   - Configuration management and scenario selection
   - Real-time monitoring and analysis

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Basic Usage
```bash
# Run light load test
npx ts-node tests/load-testing/run-messaging-load-test.ts run --scenario light

# Run moderate load test for staging
npx ts-node tests/load-testing/run-messaging-load-test.ts run --scenario moderate --duration 15

# Run custom configuration
npx ts-node tests/load-testing/run-messaging-load-test.ts run \
  --connections 200 \
  --messages 5000 \
  --duration 30 \
  --guardians 20
```

### Validate System Readiness
```bash
# Check if system is ready for load testing
npx ts-node tests/load-testing/run-messaging-load-test.ts validate
```

## 📊 Test Scenarios

### 1. Development (`--scenario development`)
- **Connections**: 25 WebSocket connections
- **Messages**: 500 messages/minute
- **Duration**: 5 minutes
- **Focus**: Basic functionality validation

### 2. Staging (`--scenario staging`)
- **Connections**: 100 WebSocket connections
- **Messages**: 2,500 messages/minute
- **Duration**: 15 minutes
- **Focus**: Environment validation before production

### 3. Production Light (`--scenario production_light`)
- **Connections**: 200 WebSocket connections
- **Messages**: 5,000 messages/minute
- **Duration**: 30 minutes
- **Focus**: Production readiness validation

### 4. Production Peak (`--scenario production_peak`)
- **Connections**: 500 WebSocket connections
- **Messages**: 10,000 messages/minute
- **Duration**: 45 minutes
- **Focus**: Peak load simulation

### 5. Stress Test (`--scenario stress_test`)
- **Connections**: 1,000 WebSocket connections
- **Messages**: 20,000 messages/minute
- **Duration**: 60 minutes
- **Focus**: Breaking point identification

### 6. Islamic Compliance Focus (`--scenario islamic_compliance_focus`)
- **Connections**: 300 WebSocket connections
- **Guardians**: 75 simulated guardians
- **Moderation Tests**: 1,500 content moderation tests
- **Focus**: Islamic compliance features under load

### 7. Mobile Focus (`--scenario mobile_focus`)
- **Mobile Devices**: 400 simulated devices
- **Networks**: 5G, 4G, 3G simulation
- **Focus**: Mobile messaging behavior and push notifications

## 🔧 Configuration

### Environment Variables
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
```

### Custom Configuration File
```bash
# Use custom configuration
npx ts-node tests/load-testing/run-messaging-load-test.ts run \
  --config path/to/custom-config.json
```

### Configuration Options
```json
{
  "maxWebSocketConnections": 500,
  "concurrentConversations": 1000,
  "messagesPerMinute": 10000,
  "testDurationMinutes": 30,
  "guardiansToSimulate": 50,
  "moderationRulesTests": 1000,
  "regions": ["singapore", "malaysia", "indonesia", "brunei"],
  "networkConditions": [
    { "name": "5G", "latency": 20, "bandwidth": 1000, "packetLoss": 0.01 },
    { "name": "4G", "latency": 50, "bandwidth": 100, "packetLoss": 0.1 }
  ]
}
```

## 📈 Monitoring & Analysis

### Real-Time Monitoring
```bash
# Monitor ongoing test
npx ts-node tests/load-testing/run-messaging-load-test.ts monitor \
  --interval 10 \
  --metrics latency,throughput,errors
```

### Test Result Analysis
```bash
# Analyze completed test results
npx ts-node tests/load-testing/run-messaging-load-test.ts analyze \
  path/to/test-report.json \
  --format markdown
```

### Generated Reports
- **JSON**: Detailed metrics and raw data
- **Markdown**: Human-readable summary with recommendations
- **CSV**: Metrics for spreadsheet analysis
- **HTML**: Interactive dashboard (coming soon)

## 🕌 Islamic Compliance Testing

### Content Moderation Tests
- **Halal Content**: Appropriate greetings and family discussions
- **Guardian Review**: Meeting proposals requiring oversight
- **Inappropriate Content**: Content violating Islamic guidelines
- **Contact Sharing**: Phone numbers and social media handles

### Guardian Oversight Features
- **Notification Delivery**: Email, SMS, and in-app notifications
- **Response Latency**: Guardian approval workflow timing
- **Approval Requirements**: Meeting arrangements and sensitive discussions

### Cultural Sensitivity
- **Multi-Regional**: Singapore, Malaysia, Indonesia, Brunei contexts
- **Language Awareness**: Arabic, Malay, and English content
- **Prayer Time Consideration**: Message delivery during prayer times

## 📱 Mobile Device Simulation

### Device Types
- **iOS Devices**: iPhone with various iOS versions
- **Android Devices**: Android phones with different OS versions
- **Network Conditions**: 5G, 4G, 3G, WiFi with realistic latency and packet loss

### Mobile Behaviors
- **App State Transitions**: Foreground, background, suspended states
- **Push Notifications**: APNS (iOS) and FCM (Android) simulation
- **Battery Optimization**: Impact on message delivery
- **Offline Messaging**: Message queuing and synchronization
- **Network Switching**: WiFi to cellular transitions

### Mobile Metrics
- Push notification delivery rates
- Background message synchronization
- Battery usage impact
- Offline message queue performance
- Network switching behavior

## 🎯 Performance Targets

### Message Delivery
- **P95 Latency**: <100ms
- **P99 Latency**: <200ms
- **Throughput**: 10,000+ messages/minute
- **Success Rate**: >99%

### WebSocket Connections
- **Connection Time**: <2 seconds
- **Stability**: >99.5% uptime
- **Max Connections**: 1,000+ concurrent

### Islamic Compliance
- **Moderation Accuracy**: >95%
- **Moderation Speed**: <200ms
- **Guardian Notifications**: <300ms
- **Cultural Sensitivity**: >90%

### Mobile Performance
- **Push Delivery**: >95%
- **Push Latency**: <3 seconds
- **Offline Sync**: <5 seconds
- **Battery Efficiency**: >80%

## 🔍 Troubleshooting

### Common Issues

#### Environment Setup
```bash
# Check environment variables
npx ts-node tests/load-testing/run-messaging-load-test.ts validate
```

#### Connection Issues
```bash
# Test with minimal load first
npx ts-node tests/load-testing/run-messaging-load-test.ts run --scenario development
```

#### Performance Issues
- Monitor system resources during tests
- Check database connection pool limits
- Verify WebSocket server capacity
- Review Supabase usage quotas

### Debug Mode
```bash
# Enable detailed logging
DEBUG=faddl:* npx ts-node tests/load-testing/run-messaging-load-test.ts run --scenario light
```

## 📋 Test Reports

### Report Contents
1. **Executive Summary**: Key metrics and pass/fail status
2. **Performance Analysis**: Latency, throughput, and connection metrics
3. **Islamic Compliance**: Moderation accuracy and guardian oversight
4. **Mobile Performance**: Push notifications and device behavior
5. **Error Analysis**: Detailed error breakdown and recommendations
6. **Recommendations**: Optimization suggestions based on results

### Sample Report Structure
```
📊 FADDL Match Real-Time Messaging Load Test Report

🎯 Test Summary
- Scenario: Production Peak Load
- Duration: 45 minutes
- Connections: 500 WebSocket connections
- Messages: 450,000 total messages sent
- Success Rate: 99.2%

⚡ Performance Results
- Average Latency: 67ms ✅
- P95 Latency: 95ms ✅
- P99 Latency: 180ms ✅
- Connection Uptime: 99.7% ✅

🕌 Islamic Compliance
- Moderation Accuracy: 96.8% ✅
- Guardian Notifications: 287ms avg ✅
- Cultural Sensitivity: 92.4% ✅

📱 Mobile Performance
- Push Delivery Rate: 97.3% ✅
- Offline Sync Time: 3.2s ✅
- Battery Efficiency: 84% ✅

💡 Recommendations
1. Optimize moderation pipeline for <200ms target
2. Improve push notification delivery to 98%+
3. Consider connection pooling for peak loads
```

## 🔒 Safety & Best Practices

### Testing Environment
- **Never run stress tests against production without approval**
- Use dedicated testing environments when possible
- Monitor system resources during tests
- Have incident response procedures ready

### Data Management
- Automatic test data cleanup after completion
- No real user data used in testing
- Simulated content follows Islamic guidelines
- Secure handling of test credentials

### Resource Management
- Gradual load ramp-up to avoid system shock
- Circuit breakers for automatic test termination
- Resource usage monitoring and alerts
- Graceful cleanup on test interruption

## 🤝 Contributing

### Adding New Test Scenarios
1. Update `load-test-config.json` with new scenario
2. Add scenario-specific validation logic
3. Update documentation and examples
4. Test the new scenario thoroughly

### Extending Metrics Collection
1. Define new metrics in appropriate tester class
2. Update report generation logic
3. Add visualization for new metrics
4. Document the new metrics

### Islamic Compliance Content
1. Follow Islamic guidelines for all test content
2. Consult with Islamic scholars for culturally appropriate content
3. Ensure respect for Islamic values in all scenarios
4. Test with diverse Muslim communities for validation

## 📞 Support

For issues, questions, or contributions:
- Create GitHub issues for bugs or feature requests
- Follow Islamic guidelines for all content contributions
- Test thoroughly before submitting changes
- Include performance impact analysis for modifications

---

**Built with respect for Islamic values and modern software engineering practices**

*May Allah bless this project and those who use it for halal purposes* 🤲