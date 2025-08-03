#!/usr/bin/env ts-node
/**
 * FADDL Match Real-Time Messaging Load Test Runner
 * 
 * Command-line interface for executing comprehensive messaging load tests
 * with various configurations and scenarios.
 */

import { Command } from 'commander'
import { config } from 'dotenv'
import { RealTimeMessagingLoadTester, LoadTestConfig, runLoadTest } from './realtime-messaging-load-test'
import { join } from 'path'
import { existsSync } from 'fs'

// Load environment variables
config()

const program = new Command()

program
  .name('faddl-messaging-load-test')
  .description('FADDL Match Real-Time Messaging Load Testing Suite')
  .version('1.0.0')

// Default test scenarios
const TEST_SCENARIOS = {
  light: {
    maxWebSocketConnections: 50,
    concurrentConversations: 100,
    messagesPerMinute: 1000,
    testDurationMinutes: 5,
    guardiansToSimulate: 5,
    moderationRulesTests: 100
  },
  moderate: {
    maxWebSocketConnections: 200,
    concurrentConversations: 500,
    messagesPerMinute: 5000,
    testDurationMinutes: 15,
    guardiansToSimulate: 20,
    moderationRulesTests: 500
  },
  heavy: {
    maxWebSocketConnections: 500,
    concurrentConversations: 1000,
    messagesPerMinute: 10000,
    testDurationMinutes: 30,
    guardiansToSimulate: 50,
    moderationRulesTests: 1000
  },
  stress: {
    maxWebSocketConnections: 1000,
    concurrentConversations: 2000,
    messagesPerMinute: 20000,
    testDurationMinutes: 60,
    guardiansToSimulate: 100,
    moderationRulesTests: 2000
  }
}

program
  .command('run')
  .description('Run real-time messaging load test')
  .option('-s, --scenario <type>', 'Test scenario: light, moderate, heavy, stress', 'moderate')
  .option('-c, --connections <number>', 'Maximum WebSocket connections', '200')
  .option('-m, --messages <number>', 'Messages per minute', '5000')
  .option('-d, --duration <number>', 'Test duration in minutes', '15')
  .option('-g, --guardians <number>', 'Number of guardians to simulate', '20')
  .option('--region <regions...>', 'Test regions', ['singapore', 'malaysia'])
  .option('--network <conditions...>', 'Network conditions to test', ['5G', '4G', '3G', 'WiFi'])
  .option('--islamic-compliance', 'Focus on Islamic compliance testing', true)
  .option('--mobile-simulation', 'Include mobile device simulation', true)
  .option('--config <path>', 'Custom configuration file path')
  .action(async (options) => {
    console.log('🚀 Starting FADDL Match Real-Time Messaging Load Test')
    console.log('='* 60)
    
    // Validate environment
    if (!validateEnvironment()) {
      process.exit(1)
    }
    
    try {
      // Build configuration
      const config = await buildConfiguration(options)
      
      // Display configuration
      displayConfiguration(config)
      
      // Confirm execution
      if (await confirmExecution(config)) {
        await runLoadTest(config)
      } else {
        console.log('Test cancelled by user')
      }
      
    } catch (error) {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    }
  })

program
  .command('validate')
  .description('Validate system readiness for load testing')
  .action(async () => {
    console.log('🔍 Validating system readiness...')
    
    const validationResults = await validateSystemReadiness()
    
    if (validationResults.ready) {
      console.log('✅ System is ready for load testing')
      console.log('📋 Validation Summary:')
      validationResults.checks.forEach(check => {
        console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`)
      })
    } else {
      console.log('❌ System is not ready for load testing')
      console.log('🔧 Issues to address:')
      validationResults.checks
        .filter(check => !check.passed)
        .forEach(check => {
          console.log(`   ❌ ${check.name}: ${check.message}`)
        })
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('Analyze previous test results')
  .argument('<reportPath>', 'Path to test report JSON file')
  .option('--format <type>', 'Output format: json, markdown, csv', 'markdown')
  .action(async (reportPath, options) => {
    console.log(`📊 Analyzing test report: ${reportPath}`)
    
    if (!existsSync(reportPath)) {
      console.error(`❌ Report file not found: ${reportPath}`)
      process.exit(1)
    }
    
    try {
      await analyzeTestReport(reportPath, options.format)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      process.exit(1)
    }
  })

program
  .command('monitor')
  .description('Real-time monitoring of ongoing test')
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '10')
  .option('--metrics <metrics...>', 'Metrics to monitor', ['latency', 'throughput', 'errors'])
  .action(async (options) => {
    console.log('📊 Starting real-time test monitoring...')
    
    await startRealTimeMonitoring(options)
  })

async function validateEnvironment(): Promise<boolean> {
  console.log('🔍 Validating environment...')
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('\nPlease set these environment variables before running the test.')
    return false
  }
  
  console.log('✅ Environment validation passed')
  return true
}

async function buildConfiguration(options: any): Promise<LoadTestConfig> {
  let config: Partial<LoadTestConfig> = {}
  
  // Use scenario preset if specified
  if (options.scenario && TEST_SCENARIOS[options.scenario]) {
    config = { ...TEST_SCENARIOS[options.scenario] }
    console.log(`📋 Using ${options.scenario} test scenario`)
  }
  
  // Override with command line options
  if (options.connections) {
    config.maxWebSocketConnections = parseInt(options.connections, 10)
  }
  
  if (options.messages) {
    config.messagesPerMinute = parseInt(options.messages, 10)
  }
  
  if (options.duration) {
    config.testDurationMinutes = parseInt(options.duration, 10)
  }
  
  if (options.guardians) {
    config.guardiansToSimulate = parseInt(options.guardians, 10)
  }
  
  if (options.region) {
    config.regions = options.region
  }
  
  // Load custom configuration if specified
  if (options.config) {
    const customConfig = await loadCustomConfiguration(options.config)
    config = { ...config, ...customConfig }
  }
  
  // Set default network conditions
  const networkConditionMap = {
    '5G': { name: '5G', latency: 20, bandwidth: 1000, packetLoss: 0.01 },
    '4G': { name: '4G', latency: 50, bandwidth: 100, packetLoss: 0.1 },
    '3G': { name: '3G', latency: 200, bandwidth: 10, packetLoss: 1 },
    'WiFi': { name: 'WiFi', latency: 10, bandwidth: 500, packetLoss: 0.05 }
  }
  
  if (options.network) {
    config.networkConditions = options.network.map(nc => networkConditionMap[nc]).filter(Boolean)
  }
  
  return config as LoadTestConfig
}

async function loadCustomConfiguration(configPath: string): Promise<Partial<LoadTestConfig>> {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`)
  }
  
  const { readFileSync } = await import('fs')
  const configContent = readFileSync(configPath, 'utf-8')
  
  try {
    return JSON.parse(configContent)
  } catch (error) {
    throw new Error(`Invalid JSON in configuration file: ${error.message}`)
  }
}

function displayConfiguration(config: LoadTestConfig): void {
  console.log('\n📋 Test Configuration:')
  console.log('='* 40)
  console.log(`🔌 Max WebSocket Connections: ${config.maxWebSocketConnections}`)
  console.log(`💬 Concurrent Conversations: ${config.concurrentConversations}`)
  console.log(`📨 Messages per Minute: ${config.messagesPerMinute}`)
  console.log(`⏱️  Test Duration: ${config.testDurationMinutes} minutes`)
  console.log(`👨‍👩‍👧‍👦 Guardians to Simulate: ${config.guardiansToSimulate}`)
  console.log(`🕌 Moderation Tests: ${config.moderationRulesTests}`)
  console.log(`🌍 Regions: ${config.regions.join(', ')}`)
  console.log(`📱 Network Conditions: ${config.networkConditions.map(nc => nc.name).join(', ')}`)
  console.log('\n🎯 Performance Targets:')
  console.log(`   - Max Latency: ${config.maxLatencyMs}ms`)
  console.log(`   - Min Connection Uptime: ${config.minConnectionUptime}%`)
  console.log(`   - Max Moderation Delay: ${config.maxModerationDelayMs}ms`)
  console.log('')
}

async function confirmExecution(config: LoadTestConfig): Promise<boolean> {
  const { confirm } = await import('enquirer')
  
  const estimatedLoad = estimateSystemLoad(config)
  
  console.log('⚠️  Load Test Impact Estimation:')
  console.log(`   - Estimated CPU Usage: ${estimatedLoad.cpuUsage}%`)
  console.log(`   - Estimated Memory Usage: ${estimatedLoad.memoryUsage}MB`)
  console.log(`   - Estimated Network Bandwidth: ${estimatedLoad.networkBandwidth}Mbps`)
  console.log(`   - Database Connections: ${estimatedLoad.dbConnections}`)
  console.log('')
  
  if (estimatedLoad.isHeavy) {
    console.log('🚨 WARNING: This is a heavy load test that may impact system performance')
    console.log('   - Ensure this is running in a test environment')
    console.log('   - Monitor system resources during execution')
    console.log('   - Have incident response procedures ready')
    console.log('')
  }
  
  try {
    const response = await confirm({
      name: 'proceed',
      message: 'Do you want to proceed with this load test?'
    })
    
    return response.proceed
  } catch (error) {
    // Handle Ctrl+C or other interruptions
    return false
  }
}

function estimateSystemLoad(config: LoadTestConfig) {
  const connections = config.maxWebSocketConnections
  const messageRate = config.messagesPerMinute / 60
  
  return {
    cpuUsage: Math.min(95, connections * 0.1 + messageRate * 0.05),
    memoryUsage: connections * 2 + messageRate * 0.1,
    networkBandwidth: messageRate * 0.5,
    dbConnections: Math.min(100, connections * 0.2),
    isHeavy: connections > 500 || messageRate > 100
  }
}

async function validateSystemReadiness() {
  const checks = []
  
  // Check Supabase connectivity
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    checks.push({
      name: 'Supabase Connectivity',
      passed: !error,
      message: error ? error.message : 'Successfully connected to Supabase'
    })
  } catch (error) {
    checks.push({
      name: 'Supabase Connectivity',
      passed: false,
      message: `Failed to connect to Supabase: ${error.message}`
    })
  }
  
  // Check system resources
  const { totalmem, freemem, cpus } = await import('os')
  const totalMemGB = totalmem() / (1024 * 1024 * 1024)
  const freeMemGB = freemem() / (1024 * 1024 * 1024)
  const cpuCount = cpus().length
  
  checks.push({
    name: 'System Memory',
    passed: freeMemGB > 2,
    message: `${freeMemGB.toFixed(1)}GB free of ${totalMemGB.toFixed(1)}GB total`
  })
  
  checks.push({
    name: 'CPU Cores',
    passed: cpuCount >= 2,
    message: `${cpuCount} CPU cores available`
  })
  
  // Check network connectivity
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execPromise = promisify(exec)
    
    await execPromise('ping -c 1 google.com')
    checks.push({
      name: 'Network Connectivity',
      passed: true,
      message: 'Internet connectivity verified'
    })
  } catch (error) {
    checks.push({
      name: 'Network Connectivity',
      passed: false,
      message: 'No internet connectivity detected'
    })
  }
  
  const allPassed = checks.every(check => check.passed)
  
  return {
    ready: allPassed,
    checks
  }
}

async function analyzeTestReport(reportPath: string, format: string) {
  const { readFileSync, writeFileSync } = await import('fs')
  
  try {
    const reportContent = readFileSync(reportPath, 'utf-8')
    const report = JSON.parse(reportContent)
    
    console.log('📊 Test Report Analysis')
    console.log('='* 40)
    
    // Performance Analysis
    console.log('\n🚀 Performance Metrics:')
    console.log(`   Connection Success Rate: ${report.summary.connectionSuccessRate.toFixed(2)}%`)
    console.log(`   Average Latency: ${report.summary.averageLatency.toFixed(2)}ms`)
    console.log(`   Message Throughput: ${report.summary.messagesThroughput.toFixed(0)} msg/min`)
    console.log(`   Error Rate: ${report.summary.errorRate.toFixed(4)}%`)
    
    // Islamic Compliance Analysis
    console.log('\n🕌 Islamic Compliance:')
    console.log(`   Moderation Accuracy: ${report.islamicCompliance.moderationAccuracy.toFixed(2)}%`)
    console.log(`   Average Moderation Time: ${report.islamicCompliance.averageModerationTime.toFixed(2)}ms`)
    console.log(`   Guardian Notification Success: ${report.islamicCompliance.guardianNotificationSuccess.toFixed(2)}%`)
    console.log(`   Compliance Violation Rate: ${report.islamicCompliance.complianceViolationRate.toFixed(2)}%`)
    
    // Real-time Features
    console.log('\n⚡ Real-time Features:')
    console.log(`   Typing Indicators: ${report.realTimeFeatures.typingIndicatorDelivery}`)
    console.log(`   Presence Updates: ${report.realTimeFeatures.presenceUpdateProcessing}`)
    console.log(`   Read Receipts: ${report.realTimeFeatures.readReceiptDelivery}`)
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    }
    
    // Generate analysis report
    if (format === 'csv') {
      generateCsvAnalysis(report, reportPath.replace('.json', '-analysis.csv'))
    } else {
      generateMarkdownAnalysis(report, reportPath.replace('.json', '-analysis.md'))
    }
    
  } catch (error) {
    throw new Error(`Failed to analyze report: ${error.message}`)
  }
}

function generateCsvAnalysis(report: any, outputPath: string) {
  const { writeFileSync } = require('fs')
  
  const csvData = [
    'Metric,Value,Unit,Status',
    `Connection Success Rate,${report.summary.connectionSuccessRate.toFixed(2)},%,${report.summary.connectionSuccessRate >= 95 ? 'PASS' : 'FAIL'}`,
    `Average Latency,${report.summary.averageLatency.toFixed(2)},ms,${report.summary.averageLatency <= 100 ? 'PASS' : 'FAIL'}`,
    `Message Throughput,${report.summary.messagesThroughput.toFixed(0)},msg/min,INFO`,
    `Error Rate,${report.summary.errorRate.toFixed(4)},%,${report.summary.errorRate <= 1 ? 'PASS' : 'FAIL'}`,
    `Moderation Accuracy,${report.islamicCompliance.moderationAccuracy.toFixed(2)},%,${report.islamicCompliance.moderationAccuracy >= 90 ? 'PASS' : 'FAIL'}`,
    `Guardian Notification Success,${report.islamicCompliance.guardianNotificationSuccess.toFixed(2)},%,${report.islamicCompliance.guardianNotificationSuccess >= 95 ? 'PASS' : 'FAIL'}`
  ].join('\n')
  
  writeFileSync(outputPath, csvData)
  console.log(`📊 CSV analysis saved to: ${outputPath}`)
}

function generateMarkdownAnalysis(report: any, outputPath: string) {
  const { writeFileSync } = require('fs')
  
  const markdown = `
# Load Test Analysis Report

**Report Generated:** ${new Date().toISOString()}
**Original Test Date:** ${new Date(report.testConfiguration.timestamp || Date.now()).toISOString()}

## Performance Summary

| Metric | Value | Target | Status |
|--------|-------|---------|--------|
| Connection Success Rate | ${report.summary.connectionSuccessRate.toFixed(2)}% | ≥95% | ${report.summary.connectionSuccessRate >= 95 ? '✅' : '❌'} |
| Average Latency | ${report.summary.averageLatency.toFixed(2)}ms | ≤100ms | ${report.summary.averageLatency <= 100 ? '✅' : '❌'} |
| Message Throughput | ${report.summary.messagesThroughput.toFixed(0)} msg/min | - | ℹ️ |
| Error Rate | ${report.summary.errorRate.toFixed(4)}% | ≤1% | ${report.summary.errorRate <= 1 ? '✅' : '❌'} |

## Islamic Compliance Analysis

| Metric | Value | Target | Status |
|--------|-------|---------|--------|
| Moderation Accuracy | ${report.islamicCompliance.moderationAccuracy.toFixed(2)}% | ≥90% | ${report.islamicCompliance.moderationAccuracy >= 90 ? '✅' : '❌'} |
| Moderation Speed | ${report.islamicCompliance.averageModerationTime.toFixed(2)}ms | ≤200ms | ${report.islamicCompliance.averageModerationTime <= 200 ? '✅' : '❌'} |
| Guardian Notifications | ${report.islamicCompliance.guardianNotificationSuccess.toFixed(2)}% | ≥95% | ${report.islamicCompliance.guardianNotificationSuccess >= 95 ? '✅' : '❌'} |

## Key Findings

### Strengths
- High-performing areas identified during testing

### Areas for Improvement
- Performance bottlenecks requiring attention

## Detailed Recommendations

${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---
*Analysis generated by FADDL Match Load Testing Suite*
  `.trim()
  
  writeFileSync(outputPath, markdown)
  console.log(`📄 Markdown analysis saved to: ${outputPath}`)
}

async function startRealTimeMonitoring(options: any) {
  console.log(`📊 Monitoring test progress every ${options.interval} seconds...`)
  console.log('Press Ctrl+C to stop monitoring\n')
  
  const monitoringInterval = parseInt(options.interval, 10) * 1000
  
  const startTime = Date.now()
  let lastCheckTime = startTime
  
  const interval = setInterval(async () => {
    const currentTime = Date.now()
    const elapsedMinutes = (currentTime - startTime) / 1000 / 60
    
    // In a real implementation, this would connect to the running test
    // and display real-time metrics
    
    console.log(`⏱️  Elapsed: ${elapsedMinutes.toFixed(1)}m`)
    console.log(`📊 Sample Metrics (simulated):`)
    console.log(`   - Active Connections: ${Math.floor(Math.random() * 500) + 200}`)
    console.log(`   - Messages/min: ${Math.floor(Math.random() * 5000) + 3000}`)
    console.log(`   - Avg Latency: ${Math.floor(Math.random() * 50) + 30}ms`)
    console.log(`   - Error Rate: ${(Math.random() * 0.5).toFixed(3)}%`)
    console.log('')
    
    lastCheckTime = currentTime
  }, monitoringInterval)
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\n👋 Monitoring stopped')
    process.exit(0)
  })
}

// Parse command line arguments
program.parse()

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp()
}