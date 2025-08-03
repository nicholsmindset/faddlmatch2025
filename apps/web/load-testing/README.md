# 🚀 FADDL Match API Load Testing Suite

Comprehensive backend API stress testing and performance analysis for the FADDL Match dating application.

## 📋 Overview

This testing suite provides enterprise-grade load testing for:
- **API Endpoints**: REST APIs and webhook handlers
- **Edge Functions**: Supabase edge functions with cold start analysis
- **Database Performance**: Query optimization and connection pooling
- **Real-time Systems**: Messaging and matching algorithms
- **Scalability Analysis**: Capacity planning and bottleneck identification

## 🎯 Testing Objectives

### Primary Goals
- ✅ Load testing of all API endpoints and edge functions
- ✅ Stress testing under high concurrent user scenarios
- ✅ Database connection pooling and query performance under load
- ✅ Edge function cold start and execution time analysis
- ✅ Real-time messaging system capacity testing
- ✅ Authentication flow performance under concurrent load
- ✅ Match generation algorithm performance at scale
- ✅ API rate limiting effectiveness and bypass attempts

### Performance Targets
- **API Response Time**: <200ms for standard operations
- **Database Queries**: <50ms for optimized reads
- **Edge Functions**: <500ms including cold starts
- **Throughput**: 1000 requests/minute minimum
- **Error Rate**: <0.1% under normal load
- **Availability**: 99.9% uptime target

## 🛠️ Test Tools & Framework

### Core Testing Tools
- **k6**: Modern load testing for API endpoints
- **Artillery**: Sustained load with realistic user patterns
- **PostgreSQL**: Database stress testing and monitoring
- **Custom Monitoring**: Edge function performance tracking

### Test Types
1. **Normal Load**: 100 concurrent users (typical usage)
2. **Peak Load**: 500 concurrent users (high activity periods)
3. **Stress Load**: 1000 concurrent users (capacity testing)
4. **Spike Load**: Sudden 0→500 users (viral growth simulation)
5. **Endurance Load**: 100 users over 30 minutes (stability testing)

## 🚀 Quick Start

### Prerequisites
```bash
# Install required tools
brew install k6 postgresql
npm install -g artillery

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export BASE_URL="http://localhost:3000"  # Optional, defaults to localhost
export DATABASE_URL="postgresql://..."   # Optional, for database tests
```

### Run Complete Test Suite
```bash
# Make script executable
chmod +x run-tests.sh

# Run all tests (takes ~4 hours)
./run-tests.sh

# Run individual test components
./run-tests.sh k6        # k6 load tests only
./run-tests.sh artillery # Artillery tests only
./run-tests.sh edge      # Edge function monitoring
./run-tests.sh database  # Database stress tests
./run-tests.sh health    # API health checks
```

### Quick Performance Check
```bash
# Fast health check and basic load test
./run-tests.sh health
k6 run --vus 10 --duration 30s k6-load-test.js
```

## 📊 Test Components

### 1. K6 Comprehensive Load Testing
**File**: `k6-load-test.js`
**Duration**: ~90 minutes
**Scenarios**:
- Normal load ramping (50 users)
- Peak load testing (200 users)
- Stress testing (500 users)
- Spike testing (sudden load increase)

**Metrics Collected**:
- Response times (p95, p99)
- Error rates by endpoint
- Throughput (RPS)
- Custom metrics for auth failures, DB errors

### 2. Artillery Sustained Load Testing
**File**: `artillery-config.yml`
**Duration**: ~50 minutes
**Focus**: Realistic user behavior patterns

**Test Phases**:
- Warm-up (5 RPS)
- Normal load (20 RPS)
- Peak load (50 RPS)
- Stress test (100 RPS)

### 3. Edge Function Performance Monitoring
**File**: `edge-function-monitor.js`
**Duration**: ~75 minutes
**Focus**: Cold starts, execution times, memory usage

**Functions Tested**:
- `auth-sync-user` - Authentication synchronization
- `profile-create` - Profile creation with validation
- `profile-update` - Profile modification workflows
- `messages-send` - Message handling with Islamic compliance
- `matches-generate` - AI-powered matching algorithm

### 4. Database Stress Testing
**File**: `database-stress-test.sql`
**Focus**: Query performance, connection pooling, resource usage

**Test Functions**:
- `generate_test_users(1000)` - Create test data
- `stress_test_user_queries(1000)` - Query performance testing
- `monitor_database_resources()` - Resource monitoring
- `cleanup_test_data()` - Test data cleanup

### 5. Performance Analysis
**File**: `performance-analysis.js`
**Purpose**: Automated analysis and reporting

**Features**:
- Response time distribution analysis
- Bottleneck identification
- Scalability recommendations
- Executive summary generation

## 🎯 API Endpoints Tested

### Next.js API Routes
- **Health Check**: `/api/health`
- **Webhook Handler**: `/api/webhooks/clerk`

### Supabase Edge Functions
- **Authentication**: `auth-sync-user`
- **Profile Management**: `profile-create`, `profile-update`
- **Matching System**: `matches-generate`
- **Messaging**: `messages-send`

### Database Operations
- User profile queries
- Match generation queries
- Conversation history queries
- Complex search operations

## 📈 Load Testing Scenarios

### Scenario 1: Normal Operations
```javascript
// 100 concurrent users
// Realistic user behavior
// Mix of read/write operations
```

### Scenario 2: Peak Traffic
```javascript
// 500 concurrent users
// Friday evening usage patterns
// High matching activity
```

### Scenario 3: Viral Growth
```javascript
// Sudden 0→500 user spike
// Simulates viral content or social media mention
// Tests auto-scaling capabilities
```

### Scenario 4: Sustained Load
```javascript
// 100 users for 30+ minutes
// Tests memory leaks and resource exhaustion
// Long-running stability validation
```

## 📊 Results & Analysis

### Automated Report Generation
The test suite automatically generates:

1. **Executive Summary** - High-level performance overview
2. **Detailed Metrics** - Endpoint-by-endpoint analysis
3. **Scalability Assessment** - Capacity planning insights
4. **Action Plan** - Prioritized optimization recommendations

### Key Metrics Tracked
- **Response Times**: Average, p95, p99
- **Error Rates**: By endpoint and error type
- **Throughput**: Requests per second
- **Resource Usage**: Memory, CPU, connections
- **Availability**: Uptime percentage

### Sample Report Structure
```
📊 FADDL Match API Performance Report
├── Executive Summary
├── Performance Results
├── Scalability Analysis
├── Critical Issues Found
├── Optimization Recommendations
└── Next Steps
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Optional
BASE_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:pass@host:port/db"
```

### Test Customization
```javascript
// Modify load patterns in k6-load-test.js
const options = {
  scenarios: {
    normal_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 },   // Customize user count
        { duration: '5m', target: 50 },   // Customize duration
      ]
    }
  }
};
```

## 🚨 Troubleshooting

### Common Issues

#### Health Check Fails
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### k6 Installation Issues
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check if test functions exist
psql $DATABASE_URL -c "\df generate_test_users"
```

### Performance Issues
- **High response times**: Check database indexes, edge function memory
- **High error rates**: Verify API keys, check edge function logs
- **Low throughput**: Monitor connection pools, check rate limiting

## 📋 Test Results Interpretation

### Response Time Benchmarks
- **Excellent**: <100ms average
- **Good**: 100-300ms average  
- **Acceptable**: 300-500ms average
- **Poor**: >500ms average

### Error Rate Thresholds
- **Excellent**: <0.1% errors
- **Good**: 0.1-0.5% errors
- **Acceptable**: 0.5-1% errors
- **Critical**: >1% errors

### Throughput Expectations
- **Basic**: 100+ RPS
- **Good**: 500+ RPS  
- **Excellent**: 1000+ RPS

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
name: Load Testing
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Load Tests
        run: |
          cd apps/web/load-testing
          ./run-tests.sh
```

### Monitoring Integration
- Set up alerts for performance regression
- Integrate with observability platforms
- Schedule regular performance checks

## 📁 File Structure

```
load-testing/
├── k6-load-test.js           # Comprehensive k6 test suite
├── artillery-config.yml      # Artillery configuration
├── edge-function-monitor.js  # Edge function performance monitoring
├── database-stress-test.sql  # Database performance testing
├── performance-analysis.js   # Automated analysis tool
├── run-tests.sh             # Main test runner script
├── README.md                # This documentation
└── results/                 # Test results and reports
    ├── *.json              # Raw test data
    ├── *.html              # HTML reports
    └── *.md                # Performance reports
```

## 🎯 Best Practices

### Before Testing
1. Ensure stable test environment
2. Clear previous test data
3. Verify all services are running
4. Set appropriate environment variables

### During Testing
1. Monitor system resources
2. Watch for critical errors
3. Note any unusual patterns
4. Keep external load minimal

### After Testing
1. Review all generated reports
2. Analyze performance trends
3. Implement recommended optimizations
4. Schedule follow-up tests

## 🤝 Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Include proper error handling
3. Add documentation comments
4. Update this README

### Reporting Issues
Include:
- Test environment details
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

## 📞 Support

For questions or issues:
1. Check this README for common solutions
2. Review test logs in `results/` directory
3. Examine console output for errors
4. Create detailed issue reports

---

**Happy Load Testing! 🚀**

*Ensuring FADDL Match can handle growth and provide excellent user experience under any load.*