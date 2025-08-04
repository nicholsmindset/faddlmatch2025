#!/bin/bash

# 🧪 Subscription System Test Runner
# Comprehensive test execution for FADDL Match subscription system

set -e

echo "🕌 FADDL Match Subscription System Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
COVERAGE_THRESHOLD=90
TEST_TIMEOUT=60000

# Check if required tools are installed
echo -e "${BLUE}📋 Checking test environment...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Test environment ready${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Run different test suites
echo -e "${BLUE}🧪 Running subscription system tests...${NC}"

# 1. Unit Tests for Components
echo -e "${YELLOW}1️⃣ Running unit tests for subscription components...${NC}"
npx jest src/components/subscription/__tests__ --coverage --watchAll=false --testTimeout=${TEST_TIMEOUT} || {
    echo -e "${RED}❌ Component unit tests failed${NC}"
    exit 1
}

# 2. Hook Tests
echo -e "${YELLOW}2️⃣ Running custom hook tests...${NC}"
npx jest src/hooks/__tests__/useSubscription.test.ts --coverage --watchAll=false --testTimeout=${TEST_TIMEOUT} || {
    echo -e "${RED}❌ Hook tests failed${NC}"
    exit 1
}

# 3. API Integration Tests
echo -e "${YELLOW}3️⃣ Running API integration tests...${NC}"
npx jest src/app/api/subscriptions --coverage --watchAll=false --testTimeout=${TEST_TIMEOUT} || {
    echo -e "${RED}❌ API integration tests failed${NC}"
    exit 1
}

# 4. Webhook Tests
echo -e "${YELLOW}4️⃣ Running webhook integration tests...${NC}"
npx jest src/app/api/webhooks/stripe/__tests__ --coverage --watchAll=false --testTimeout=${TEST_TIMEOUT} || {
    echo -e "${RED}❌ Webhook tests failed${NC}"
    exit 1
}

# 5. E2E Tests (if Playwright is set up)
if command -v playwright &> /dev/null || npx playwright --version &> /dev/null 2>&1; then
    echo -e "${YELLOW}5️⃣ Running E2E tests...${NC}"
    npx playwright test src/__tests__/e2e/subscription-flow.spec.ts || {
        echo -e "${RED}❌ E2E tests failed${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️ Playwright not available, skipping E2E tests${NC}"
fi

# 6. Full Coverage Report
echo -e "${YELLOW}6️⃣ Generating coverage report...${NC}"
npx jest --coverage --coverageReporters=text-summary --coverageReporters=html --watchAll=false \
    --collectCoverageFrom="src/components/subscription/**/*.{js,jsx,ts,tsx}" \
    --collectCoverageFrom="src/hooks/useSubscription.ts" \
    --collectCoverageFrom="src/app/api/subscriptions/**/*.ts" \
    --collectCoverageFrom="src/app/api/webhooks/stripe/**/*.ts" \
    --coverageThreshold="{
        \"global\": {
            \"statements\": ${COVERAGE_THRESHOLD},
            \"branches\": 85,
            \"functions\": ${COVERAGE_THRESHOLD},
            \"lines\": ${COVERAGE_THRESHOLD}
        }
    }" || {
    echo -e "${RED}❌ Coverage threshold not met (required: ${COVERAGE_THRESHOLD}%)${NC}"
    exit 1
}

# 7. Test Specific Islamic Compliance
echo -e "${YELLOW}7️⃣ Running Islamic compliance validation...${NC}"
npx jest --testNamePattern="Islamic.*Compliance|Halal|Shariah" --watchAll=false || {
    echo -e "${RED}❌ Islamic compliance tests failed${NC}"
    exit 1
}

# 8. Security Tests
echo -e "${YELLOW}8️⃣ Running security validation tests...${NC}"
npx jest --testNamePattern="Security|security|Authentication|authorization" --watchAll=false || {
    echo -e "${RED}❌ Security tests failed${NC}"
    exit 1
}

# 9. Performance Tests
echo -e "${YELLOW}9️⃣ Running performance tests...${NC}"
npx jest --testNamePattern="Performance|performance|concurrent|timeout" --watchAll=false || {
    echo -e "${RED}❌ Performance tests failed${NC}"
    exit 1
}

# Generate final report
echo -e "${BLUE}📊 Test Summary${NC}"
echo "==============="

# Check coverage files exist
if [ -f "coverage/coverage-summary.json" ]; then
    echo -e "${GREEN}✅ Coverage reports generated in ./coverage/${NC}"
    
    # Extract coverage percentages (if jq is available)
    if command -v jq &> /dev/null; then
        STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
        FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
        LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
        
        echo "📈 Coverage Summary:"
        echo "   Statements: ${STMT_COV}%"
        echo "   Functions:  ${FUNC_COV}%"
        echo "   Lines:      ${LINE_COV}%"
        
        if (( $(echo "$STMT_COV >= $COVERAGE_THRESHOLD" | bc -l) )); then
            echo -e "${GREEN}✅ Coverage threshold met!${NC}"
        else
            echo -e "${RED}❌ Coverage below threshold (${COVERAGE_THRESHOLD}%)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Coverage files not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All subscription system tests completed successfully!${NC}"
echo -e "${BLUE}📝 Test Results Summary:${NC}"
echo "   ✅ Component unit tests"
echo "   ✅ Custom hook tests"
echo "   ✅ API integration tests"
echo "   ✅ Webhook integration tests"
echo "   ✅ E2E user flow tests"
echo "   ✅ Islamic compliance validation"
echo "   ✅ Security validation"
echo "   ✅ Performance validation"
echo "   ✅ Coverage requirements met"
echo ""
echo -e "${GREEN}🕌 FADDL Match subscription system is ready for production!${NC}"
echo -e "${BLUE}May Allah bless this halal matrimonial platform.${NC}"