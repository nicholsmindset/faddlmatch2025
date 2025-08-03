/**
 * WebSocket Performance Testing Module
 * 
 * Specialized testing for WebSocket connection performance,
 * concurrent capacity, and real-time message delivery latency.
 */

import { WebSocket } from 'ws'
import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'

export interface WebSocketTestConfig {
  serverUrl: string
  maxConnections: number
  connectionTimeout: number
  messageInterval: number
  testDuration: number
  heartbeatInterval: number
}

export interface ConnectionMetrics {
  id: string
  connectionTime: number
  isConnected: boolean
  messagesSent: number
  messagesReceived: number
  lastPingTime?: number
  lastPongTime?: number
  averageLatency: number
  errors: string[]
}

export interface WebSocketTestResults {
  totalConnections: number
  successfulConnections: number
  failedConnections: number
  averageConnectionTime: number
  maxConnectionTime: number
  minConnectionTime: number
  
  totalMessages: number
  messagesDelivered: number
  messagesFailed: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
  
  connectionStability: number
  heartbeatSuccess: number
  
  errors: Array<{
    timestamp: number
    connectionId: string
    type: string
    message: string
  }>
}

/**
 * WebSocket Performance Tester
 * Tests WebSocket connection capacity, stability, and message delivery performance
 */
export class WebSocketPerformanceTester extends EventEmitter {
  private config: WebSocketTestConfig
  private connections: Map<string, WebSocket>
  private metrics: Map<string, ConnectionMetrics>
  private testResults: WebSocketTestResults
  private isRunning: boolean
  private startTime: number

  constructor(config: WebSocketTestConfig) {
    super()
    this.config = config
    this.connections = new Map()
    this.metrics = new Map()
    this.isRunning = false
    this.startTime = 0
    this.testResults = this.initializeResults()
  }

  private initializeResults(): WebSocketTestResults {
    return {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageConnectionTime: 0,
      maxConnectionTime: 0,
      minConnectionTime: Infinity,
      
      totalMessages: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      
      connectionStability: 0,
      heartbeatSuccess: 0,
      
      errors: []
    }
  }

  /**
   * Run comprehensive WebSocket performance test
   */
  async runPerformanceTest(): Promise<WebSocketTestResults> {
    console.log('🔌 Starting WebSocket Performance Test')
    console.log(`   Server: ${this.config.serverUrl}`)
    console.log(`   Max Connections: ${this.config.maxConnections}`)
    console.log(`   Test Duration: ${this.config.testDuration}s`)

    this.isRunning = true
    this.startTime = performance.now()

    try {
      // Phase 1: Connection Establishment Test
      await this.testConnectionEstablishment()
      
      // Phase 2: Message Throughput Test
      await this.testMessageThroughput()
      
      // Phase 3: Connection Stability Test
      await this.testConnectionStability()
      
      // Phase 4: Heartbeat/Ping-Pong Test
      await this.testHeartbeat()
      
      // Calculate final results
      this.calculateFinalResults()
      
    } catch (error) {
      this.addError('TEST_EXECUTION', `Test execution failed: ${error.message}`)
    } finally {
      await this.cleanup()
      this.isRunning = false
    }

    return this.testResults
  }

  /**
   * Test WebSocket connection establishment performance
   */
  private async testConnectionEstablishment(): Promise<void> {
    console.log('🚀 Testing connection establishment...')
    
    const connectionPromises: Promise<void>[] = []
    const batchSize = 10 // Connect in small batches to avoid overwhelming

    for (let i = 0; i < this.config.maxConnections; i += batchSize) {
      const batch = Math.min(batchSize, this.config.maxConnections - i)
      
      for (let j = 0; j < batch; j++) {
        const connectionId = `conn-${i + j}`
        connectionPromises.push(this.establishConnection(connectionId))
      }
      
      // Wait for batch to complete
      await Promise.allSettled(connectionPromises.splice(0, batch))
      
      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Emit progress
      this.emit('connectionProgress', {
        completed: i + batch,
        total: this.config.maxConnections,
        successful: this.testResults.successfulConnections
      })
    }

    console.log(`✅ Connection establishment completed`)
    console.log(`   Successful: ${this.testResults.successfulConnections}/${this.config.maxConnections}`)
    console.log(`   Average time: ${this.testResults.averageConnectionTime.toFixed(2)}ms`)
  }

  private async establishConnection(connectionId: string): Promise<void> {
    const startTime = performance.now()
    
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.config.serverUrl)
        
        const connectionTimeout = setTimeout(() => {
          ws.terminate()
          this.addError(connectionId, 'CONNECTION_TIMEOUT', 'Connection timed out')
          this.testResults.failedConnections++
          reject(new Error('Connection timeout'))
        }, this.config.connectionTimeout)

        ws.on('open', () => {
          clearTimeout(connectionTimeout)
          
          const connectionTime = performance.now() - startTime
          
          // Store connection and metrics
          this.connections.set(connectionId, ws)
          this.metrics.set(connectionId, {
            id: connectionId,
            connectionTime,
            isConnected: true,
            messagesSent: 0,
            messagesReceived: 0,
            averageLatency: 0,
            errors: []
          })
          
          // Update test results
          this.testResults.totalConnections++
          this.testResults.successfulConnections++
          this.updateConnectionTimeMetrics(connectionTime)
          
          // Setup message handlers
          this.setupMessageHandlers(connectionId, ws)
          
          resolve()
        })

        ws.on('error', (error) => {
          clearTimeout(connectionTimeout)
          this.addError(connectionId, 'CONNECTION_ERROR', error.message)
          this.testResults.failedConnections++
          reject(error)
        })

        ws.on('close', () => {
          const metrics = this.metrics.get(connectionId)
          if (metrics) {
            metrics.isConnected = false
          }
        })

      } catch (error) {
        this.addError(connectionId, 'CONNECTION_SETUP_ERROR', error.message)
        this.testResults.failedConnections++
        reject(error)
      }
    })
  }

  private setupMessageHandlers(connectionId: string, ws: WebSocket): void {
    const metrics = this.metrics.get(connectionId)!

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        
        if (message.type === 'pong') {
          // Handle ping-pong latency measurement
          const latency = performance.now() - metrics.lastPingTime!
          this.updateLatencyMetrics(connectionId, latency)
          metrics.lastPongTime = performance.now()
        } else if (message.type === 'echo') {
          // Handle echo response for latency measurement
          const latency = performance.now() - message.timestamp
          this.updateLatencyMetrics(connectionId, latency)
          metrics.messagesReceived++
          this.testResults.messagesDelivered++
        }
        
      } catch (error) {
        this.addError(connectionId, 'MESSAGE_PARSE_ERROR', error.message)
      }
    })

    ws.on('error', (error) => {
      this.addError(connectionId, 'WEBSOCKET_ERROR', error.message)
      metrics.errors.push(error.message)
    })
  }

  /**
   * Test message throughput and latency
   */
  private async testMessageThroughput(): Promise<void> {
    console.log('📨 Testing message throughput...')
    
    const testDuration = Math.min(this.config.testDuration * 0.4, 30000) // 40% of test time or 30s max
    const messageInterval = this.config.messageInterval
    
    const messageTimer = setInterval(() => {
      this.sendEchoMessages()
    }, messageInterval)

    // Run for specified duration
    await new Promise(resolve => setTimeout(resolve, testDuration))
    
    clearInterval(messageTimer)
    
    // Wait for remaining responses
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`✅ Message throughput test completed`)
    console.log(`   Messages sent: ${this.testResults.totalMessages}`)
    console.log(`   Messages delivered: ${this.testResults.messagesDelivered}`)
    console.log(`   Average latency: ${this.testResults.averageLatency.toFixed(2)}ms`)
  }

  private sendEchoMessages(): void {
    const activeConnections = Array.from(this.connections.entries())
      .filter(([_, ws]) => ws.readyState === WebSocket.OPEN)
    
    if (activeConnections.length === 0) return

    // Send message to random subset of connections
    const sampleSize = Math.min(10, activeConnections.length)
    const selectedConnections = this.sampleArray(activeConnections, sampleSize)

    selectedConnections.forEach(([connectionId, ws]) => {
      try {
        const message = {
          type: 'echo',
          timestamp: performance.now(),
          payload: `test-message-${Date.now()}`
        }

        ws.send(JSON.stringify(message))
        
        const metrics = this.metrics.get(connectionId)!
        metrics.messagesSent++
        this.testResults.totalMessages++
        
      } catch (error) {
        this.addError(connectionId, 'MESSAGE_SEND_ERROR', error.message)
        this.testResults.messagesFailed++
      }
    })
  }

  /**
   * Test connection stability over time
   */
  private async testConnectionStability(): Promise<void> {
    console.log('🔗 Testing connection stability...')
    
    const stabilityTestDuration = Math.min(this.config.testDuration * 0.3, 20000) // 30% of test time or 20s max
    const checkInterval = 2000 // Check every 2 seconds
    const checks = Math.floor(stabilityTestDuration / checkInterval)
    
    const stabilityChecks: number[] = []

    for (let i = 0; i < checks; i++) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      
      const activeConnections = this.getActiveConnectionCount()
      const stabilityPercentage = (activeConnections / this.testResults.successfulConnections) * 100
      
      stabilityChecks.push(stabilityPercentage)
      
      this.emit('stabilityCheck', {
        check: i + 1,
        totalChecks: checks,
        activeConnections,
        stabilityPercentage
      })
    }

    // Calculate average stability
    this.testResults.connectionStability = stabilityChecks.reduce((sum, val) => sum + val, 0) / stabilityChecks.length

    console.log(`✅ Connection stability test completed`)
    console.log(`   Average stability: ${this.testResults.connectionStability.toFixed(2)}%`)
  }

  /**
   * Test WebSocket heartbeat/ping-pong mechanism
   */
  private async testHeartbeat(): Promise<void> {
    console.log('💓 Testing heartbeat mechanism...')
    
    const heartbeatTests = Math.min(100, this.getActiveConnectionCount())
    const activeConnections = Array.from(this.connections.entries())
      .filter(([_, ws]) => ws.readyState === WebSocket.OPEN)
      .slice(0, heartbeatTests)

    const heartbeatPromises = activeConnections.map(([connectionId, ws]) => 
      this.testConnectionHeartbeat(connectionId, ws)
    )

    const results = await Promise.allSettled(heartbeatPromises)
    
    const successfulHeartbeats = results.filter(result => result.status === 'fulfilled').length
    this.testResults.heartbeatSuccess = (successfulHeartbeats / heartbeatTests) * 100

    console.log(`✅ Heartbeat test completed`)
    console.log(`   Success rate: ${this.testResults.heartbeatSuccess.toFixed(2)}%`)
  }

  private async testConnectionHeartbeat(connectionId: string, ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const metrics = this.metrics.get(connectionId)!
      
      try {
        metrics.lastPingTime = performance.now()
        
        const pingMessage = {
          type: 'ping',
          timestamp: metrics.lastPingTime
        }

        ws.send(JSON.stringify(pingMessage))

        // Wait for pong response (with timeout)
        const timeout = setTimeout(() => {
          reject(new Error('Heartbeat timeout'))
        }, 5000)

        const originalHandler = ws.listeners('message')[0]
        
        const heartbeatHandler = (data: any) => {
          try {
            const message = JSON.parse(data.toString())
            if (message.type === 'pong') {
              clearTimeout(timeout)
              ws.removeListener('message', heartbeatHandler)
              resolve()
            }
          } catch (error) {
            // Ignore parse errors for heartbeat test
          }
        }

        ws.on('message', heartbeatHandler)
        
      } catch (error) {
        reject(error)
      }
    })
  }

  private updateConnectionTimeMetrics(connectionTime: number): void {
    const current = this.testResults.averageConnectionTime
    const count = this.testResults.successfulConnections
    
    this.testResults.averageConnectionTime = (current * (count - 1) + connectionTime) / count
    this.testResults.maxConnectionTime = Math.max(this.testResults.maxConnectionTime, connectionTime)
    this.testResults.minConnectionTime = Math.min(this.testResults.minConnectionTime, connectionTime)
  }

  private updateLatencyMetrics(connectionId: string, latency: number): void {
    const metrics = this.metrics.get(connectionId)!
    
    // Update per-connection average
    const messageCount = metrics.messagesReceived
    metrics.averageLatency = (metrics.averageLatency * (messageCount - 1) + latency) / messageCount
    
    // Update global average
    const totalMessages = this.testResults.messagesDelivered
    this.testResults.averageLatency = (this.testResults.averageLatency * (totalMessages - 1) + latency) / totalMessages
  }

  private calculateFinalResults(): void {
    // Calculate percentile latencies
    const latencies = Array.from(this.metrics.values())
      .filter(metrics => metrics.messagesReceived > 0)
      .map(metrics => metrics.averageLatency)
      .sort((a, b) => a - b)

    if (latencies.length > 0) {
      const p95Index = Math.floor(latencies.length * 0.95)
      const p99Index = Math.floor(latencies.length * 0.99)
      
      this.testResults.p95Latency = latencies[p95Index] || 0
      this.testResults.p99Latency = latencies[p99Index] || 0
    }

    // Ensure minimum connection time is not infinity
    if (this.testResults.minConnectionTime === Infinity) {
      this.testResults.minConnectionTime = 0
    }
  }

  private getActiveConnectionCount(): number {
    return Array.from(this.connections.values())
      .filter(ws => ws.readyState === WebSocket.OPEN)
      .length
  }

  private addError(connectionId: string, type: string, message: string): void {
    this.testResults.errors.push({
      timestamp: Date.now(),
      connectionId,
      type,
      message
    })
  }

  private sampleArray<T>(array: T[], sampleSize: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, sampleSize)
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up WebSocket connections...')
    
    const closePromises: Promise<void>[] = []
    
    this.connections.forEach((ws, connectionId) => {
      closePromises.push(
        new Promise(resolve => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
          resolve()
        })
      )
    })

    await Promise.all(closePromises)
    
    this.connections.clear()
    
    console.log('✅ Cleanup completed')
  }

  /**
   * Get real-time performance metrics
   */
  getCurrentMetrics() {
    const activeConnections = this.getActiveConnectionCount()
    const totalMessages = this.testResults.totalMessages
    const deliveredMessages = this.testResults.messagesDelivered
    const elapsedTime = (performance.now() - this.startTime) / 1000

    return {
      activeConnections,
      totalConnections: this.testResults.totalConnections,
      connectionSuccessRate: this.testResults.totalConnections > 0 
        ? (this.testResults.successfulConnections / this.testResults.totalConnections) * 100 
        : 0,
      
      messagesPerSecond: elapsedTime > 0 ? totalMessages / elapsedTime : 0,
      messageDeliveryRate: totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0,
      averageLatency: this.testResults.averageLatency,
      
      elapsedTime,
      errorCount: this.testResults.errors.length,
      
      connectionStability: this.testResults.connectionStability
    }
  }
}

/**
 * WebSocket Load Testing Scenarios
 */
export class WebSocketLoadScenarios {
  /**
   * Light load test - suitable for initial testing
   */
  static getLightLoadConfig(serverUrl: string): WebSocketTestConfig {
    return {
      serverUrl,
      maxConnections: 50,
      connectionTimeout: 5000,
      messageInterval: 1000,
      testDuration: 30,
      heartbeatInterval: 30000
    }
  }

  /**
   * Moderate load test - typical production load
   */
  static getModerateLoadConfig(serverUrl: string): WebSocketTestConfig {
    return {
      serverUrl,
      maxConnections: 200,
      connectionTimeout: 10000,
      messageInterval: 500,
      testDuration: 300,
      heartbeatInterval: 30000
    }
  }

  /**
   * Heavy load test - stress testing
   */
  static getHeavyLoadConfig(serverUrl: string): WebSocketTestConfig {
    return {
      serverUrl,
      maxConnections: 500,
      connectionTimeout: 15000,
      messageInterval: 200,
      testDuration: 600,
      heartbeatInterval: 30000
    }
  }

  /**
   * Burst load test - sudden spike in connections
   */
  static getBurstLoadConfig(serverUrl: string): WebSocketTestConfig {
    return {
      serverUrl,
      maxConnections: 1000,
      connectionTimeout: 20000,
      messageInterval: 100,
      testDuration: 900,
      heartbeatInterval: 30000
    }
  }
}

/**
 * WebSocket Performance Monitor
 * Real-time monitoring during tests
 */
export class WebSocketPerformanceMonitor {
  private tester: WebSocketPerformanceTester
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(tester: WebSocketPerformanceTester) {
    this.tester = tester
  }

  startMonitoring(intervalMs: number = 5000): void {
    console.log(`📊 Starting real-time performance monitoring (${intervalMs}ms intervals)`)
    
    this.monitoringInterval = setInterval(() => {
      const metrics = this.tester.getCurrentMetrics()
      this.displayMetrics(metrics)
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('📊 Performance monitoring stopped')
    }
  }

  private displayMetrics(metrics: any): void {
    console.log('\n📊 Real-time Metrics:')
    console.log(`   🔌 Active Connections: ${metrics.activeConnections}/${metrics.totalConnections}`)
    console.log(`   📈 Connection Success: ${metrics.connectionSuccessRate.toFixed(1)}%`)
    console.log(`   📨 Messages/sec: ${metrics.messagesPerSecond.toFixed(1)}`)
    console.log(`   ✅ Delivery Rate: ${metrics.messageDeliveryRate.toFixed(1)}%`)
    console.log(`   ⚡ Avg Latency: ${metrics.averageLatency.toFixed(1)}ms`)
    console.log(`   🔗 Stability: ${metrics.connectionStability.toFixed(1)}%`)
    console.log(`   ❌ Errors: ${metrics.errorCount}`)
    console.log(`   ⏱️  Elapsed: ${metrics.elapsedTime.toFixed(1)}s`)
  }
}