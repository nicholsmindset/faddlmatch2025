/**
 * Mobile Messaging Simulator
 * 
 * Simulates real mobile device messaging behavior including:
 * - iOS and Android messaging patterns
 * - Background app state handling
 * - Push notification delivery
 * - Network switching (WiFi <-> Cellular)
 * - Battery optimization impacts
 * - Offline message queuing
 */

import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'

export interface MobileDeviceConfig {
  deviceType: 'ios' | 'android'
  osVersion: string
  appVersion: string
  networkType: '5G' | '4G' | '3G' | 'WiFi'
  batteryLevel: number
  batteryOptimizationEnabled: boolean
  backgroundAppRefreshEnabled: boolean
  pushNotificationsEnabled: boolean
  locationRegion: 'singapore' | 'malaysia' | 'indonesia' | 'brunei'
}

export interface NetworkCondition {
  type: '5G' | '4G' | '3G' | 'WiFi'
  latency: number
  bandwidth: number
  packetLoss: number
  connectionStability: number
}

export interface MobileMessagingMetrics {
  // Message Delivery
  messagesSent: number
  messagesDelivered: number
  messagesFailed: number
  messagesQueued: number
  
  // Timing Metrics
  averageDeliveryLatency: number
  p95DeliveryLatency: number
  p99DeliveryLatency: number
  backgroundDeliveryLatency: number
  
  // Push Notifications
  pushNotificationsSent: number
  pushNotificationsDelivered: number
  pushNotificationLatency: number
  
  // Network Performance
  networkSwitches: number
  connectionDrops: number
  reconnectionTime: number
  offlineMessagesSynced: number
  
  // Battery Impact
  batteryUsageScore: number
  backgroundSyncEvents: number
  batteryOptimizationTriggers: number
  
  // Device-Specific
  iosSpecificMetrics?: iOSMessagingMetrics
  androidSpecificMetrics?: AndroidMessagingMetrics
  
  errors: MobileError[]
  warnings: MobileWarning[]
}

interface iOSMessagingMetrics {
  apnsDeliveryRate: number
  backgroundAppRefreshEvents: number
  silentNotificationDelivery: number
  appStateTransitions: number
  coreDataSyncOperations: number
}

interface AndroidMessagingMetrics {
  fcmDeliveryRate: number
  dozeModeTriggers: number
  appStandbyEvents: number
  workManagerTasks: number
  roomDatabaseOperations: number
}

interface MobileError {
  timestamp: number
  deviceId: string
  type: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  networkType?: string
  batteryLevel?: number
}

interface MobileWarning {
  timestamp: number
  deviceId: string
  type: string
  message: string
  metric: string
  actualValue: number
  expectedValue: number
}

/**
 * Mobile Device Simulator
 */
export class MobileDeviceSimulator extends EventEmitter {
  private config: MobileDeviceConfig
  private deviceId: string
  private metrics: MobileMessagingMetrics
  private isOnline: boolean
  private currentNetwork: NetworkCondition
  private appState: 'foreground' | 'background' | 'suspended'
  private messageQueue: any[]
  private batteryLevel: number
  private lastSyncTime: number
  private simulationStartTime: number

  constructor(deviceId: string, config: MobileDeviceConfig) {
    super()
    this.deviceId = deviceId
    this.config = config
    this.metrics = this.initializeMetrics()
    this.isOnline = true
    this.currentNetwork = this.getNetworkCondition(config.networkType)
    this.appState = 'foreground'
    this.messageQueue = []
    this.batteryLevel = config.batteryLevel
    this.lastSyncTime = Date.now()
    this.simulationStartTime = performance.now()
    
    this.setupDeviceSpecificBehavior()
  }

  private initializeMetrics(): MobileMessagingMetrics {
    const baseMetrics: MobileMessagingMetrics = {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      messagesQueued: 0,
      
      averageDeliveryLatency: 0,
      p95DeliveryLatency: 0,
      p99DeliveryLatency: 0,
      backgroundDeliveryLatency: 0,
      
      pushNotificationsSent: 0,
      pushNotificationsDelivered: 0,
      pushNotificationLatency: 0,
      
      networkSwitches: 0,
      connectionDrops: 0,
      reconnectionTime: 0,
      offlineMessagesSynced: 0,
      
      batteryUsageScore: 100,
      backgroundSyncEvents: 0,
      batteryOptimizationTriggers: 0,
      
      errors: [],
      warnings: []
    }

    if (this.config.deviceType === 'ios') {
      baseMetrics.iosSpecificMetrics = {
        apnsDeliveryRate: 0,
        backgroundAppRefreshEvents: 0,
        silentNotificationDelivery: 0,
        appStateTransitions: 0,
        coreDataSyncOperations: 0
      }
    } else {
      baseMetrics.androidSpecificMetrics = {
        fcmDeliveryRate: 0,
        dozeModeTriggers: 0,
        appStandbyEvents: 0,
        workManagerTasks: 0,
        roomDatabaseOperations: 0
      }
    }

    return baseMetrics
  }

  private getNetworkCondition(networkType: string): NetworkCondition {
    const conditions = {
      '5G': { type: '5G' as const, latency: 20, bandwidth: 1000, packetLoss: 0.01, connectionStability: 0.95 },
      '4G': { type: '4G' as const, latency: 50, bandwidth: 100, packetLoss: 0.1, connectionStability: 0.90 },
      '3G': { type: '3G' as const, latency: 200, bandwidth: 10, packetLoss: 1, connectionStability: 0.85 },
      'WiFi': { type: 'WiFi' as const, latency: 10, bandwidth: 500, packetLoss: 0.05, connectionStability: 0.98 }
    }
    
    return conditions[networkType] || conditions['4G']
  }

  private setupDeviceSpecificBehavior(): void {
    // Set up periodic battery drain
    setInterval(() => {
      this.simulateBatteryDrain()
    }, 30000) // Every 30 seconds

    // Set up periodic network condition changes
    setInterval(() => {
      this.simulateNetworkConditionChange()
    }, 60000) // Every minute

    // Set up app state transitions
    setInterval(() => {
      this.simulateAppStateTransition()
    }, 45000) // Every 45 seconds
  }

  /**
   * Simulate sending a message from this mobile device
   */
  async sendMessage(content: string, recipientId: string): Promise<boolean> {
    const startTime = performance.now()
    
    try {
      this.metrics.messagesSent++

      // Check if device is online
      if (!this.isOnline) {
        return this.queueMessage(content, recipientId)
      }

      // Simulate network latency based on current conditions
      const networkLatency = this.calculateNetworkLatency()
      await new Promise(resolve => setTimeout(resolve, networkLatency))

      // Simulate device-specific sending behavior
      const success = await this.simulateDeviceSpecificSending(content)

      const deliveryLatency = performance.now() - startTime

      if (success) {
        this.metrics.messagesDelivered++
        this.updateDeliveryLatencyMetrics(deliveryLatency)
        
        this.emit('messageSent', {
          deviceId: this.deviceId,
          content,
          recipientId,
          latency: deliveryLatency,
          networkType: this.currentNetwork.type
        })
        
        return true
      } else {
        this.metrics.messagesFailed++
        this.addError('MESSAGE_SEND_FAILED', 'Failed to send message', 'medium')
        return false
      }

    } catch (error) {
      this.metrics.messagesFailed++
      this.addError('MESSAGE_SEND_ERROR', error.message, 'high')
      return false
    }
  }

  /**
   * Simulate receiving a message on this mobile device
   */
  async receiveMessage(content: string, senderId: string): Promise<boolean> {
    try {
      // Determine delivery method based on app state
      if (this.appState === 'foreground') {
        return this.deliverDirectMessage(content, senderId)
      } else {
        return this.deliverPushNotification(content, senderId)
      }

    } catch (error) {
      this.addError('MESSAGE_RECEIVE_ERROR', error.message, 'medium')
      return false
    }
  }

  private async deliverDirectMessage(content: string, senderId: string): Promise<boolean> {
    // Simulate immediate delivery in foreground
    const deliveryLatency = this.calculateNetworkLatency()
    await new Promise(resolve => setTimeout(resolve, deliveryLatency))

    this.emit('messageReceived', {
      deviceId: this.deviceId,
      content,
      senderId,
      deliveryMethod: 'direct',
      latency: deliveryLatency
    })

    return true
  }

  private async deliverPushNotification(content: string, senderId: string): Promise<boolean> {
    const startTime = performance.now()

    try {
      if (!this.config.pushNotificationsEnabled) {
        this.addWarning(
          'PUSH_NOTIFICATIONS_DISABLED',
          'Push notifications are disabled',
          'push_delivery',
          0,
          1
        )
        return false
      }

      this.metrics.pushNotificationsSent++

      // Simulate push notification delivery based on device type
      const deliverySuccess = await this.simulatePushDelivery()
      const deliveryLatency = performance.now() - startTime

      if (deliverySuccess) {
        this.metrics.pushNotificationsDelivered++
        this.metrics.pushNotificationLatency = 
          (this.metrics.pushNotificationLatency * (this.metrics.pushNotificationsDelivered - 1) + deliveryLatency) /
          this.metrics.pushNotificationsDelivered

        this.emit('pushNotificationReceived', {
          deviceId: this.deviceId,
          content,
          senderId,
          latency: deliveryLatency,
          deviceType: this.config.deviceType
        })

        // Simulate app opening from notification
        if (Math.random() < 0.7) { // 70% chance user opens app
          this.appState = 'foreground'
          this.syncOfflineMessages()
        }

        return true
      } else {
        this.addError('PUSH_DELIVERY_FAILED', 'Push notification delivery failed', 'medium')
        return false
      }

    } catch (error) {
      this.addError('PUSH_NOTIFICATION_ERROR', error.message, 'high')
      return false
    }
  }

  private async simulatePushDelivery(): Promise<boolean> {
    if (this.config.deviceType === 'ios') {
      return this.simulateAPNSDelivery()
    } else {
      return this.simulateFCMDelivery()
    }
  }

  private async simulateAPNSDelivery(): Promise<boolean> {
    // Simulate APNS delivery characteristics
    const baseLatency = 1000 // 1 second base latency
    const variability = Math.random() * 2000 // Up to 2 seconds additional
    const deliveryLatency = baseLatency + variability

    await new Promise(resolve => setTimeout(resolve, deliveryLatency))

    // APNS typically has 95%+ delivery rate
    const deliverySuccess = Math.random() < 0.95

    if (this.metrics.iosSpecificMetrics) {
      this.metrics.iosSpecificMetrics.apnsDeliveryRate = 
        (this.metrics.iosSpecificMetrics.apnsDeliveryRate * (this.metrics.pushNotificationsSent - 1) + 
         (deliverySuccess ? 1 : 0)) / this.metrics.pushNotificationsSent
    }

    return deliverySuccess
  }

  private async simulateFCMDelivery(): Promise<boolean> {
    // Simulate FCM delivery characteristics
    const baseLatency = 800 // Slightly faster than APNS
    const variability = Math.random() * 1500
    const deliveryLatency = baseLatency + variability

    await new Promise(resolve => setTimeout(resolve, deliveryLatency))

    // FCM delivery rate affected by device doze mode and app standby
    let deliveryRate = 0.92 // Base rate

    if (this.batteryLevel < 20 && this.config.batteryOptimizationEnabled) {
      deliveryRate *= 0.8 // Reduced during battery optimization
      this.metrics.batteryOptimizationTriggers++
    }

    const deliverySuccess = Math.random() < deliveryRate

    if (this.metrics.androidSpecificMetrics) {
      this.metrics.androidSpecificMetrics.fcmDeliveryRate = 
        (this.metrics.androidSpecificMetrics.fcmDeliveryRate * (this.metrics.pushNotificationsSent - 1) + 
         (deliverySuccess ? 1 : 0)) / this.metrics.pushNotificationsSent

      if (this.batteryLevel < 15) {
        this.metrics.androidSpecificMetrics.dozeModeTriggers++
      }
    }

    return deliverySuccess
  }

  private queueMessage(content: string, recipientId: string): boolean {
    this.messageQueue.push({
      content,
      recipientId,
      timestamp: Date.now(),
      retryCount: 0
    })
    
    this.metrics.messagesQueued++
    
    this.emit('messageQueued', {
      deviceId: this.deviceId,
      queueSize: this.messageQueue.length
    })
    
    return true
  }

  private async syncOfflineMessages(): Promise<void> {
    if (this.messageQueue.length === 0) return

    console.log(`📱 Syncing ${this.messageQueue.length} offline messages for device ${this.deviceId}`)
    
    const messagesToSync = [...this.messageQueue]
    this.messageQueue = []

    for (const message of messagesToSync) {
      try {
        const success = await this.sendMessage(message.content, message.recipientId)
        if (success) {
          this.metrics.offlineMessagesSynced++
        } else {
          // Re-queue if failed
          this.messageQueue.push(message)
        }
      } catch (error) {
        this.addError('OFFLINE_SYNC_ERROR', error.message, 'medium')
        this.messageQueue.push(message)
      }
    }

    this.emit('offlineSync', {
      deviceId: this.deviceId,
      synced: this.metrics.offlineMessagesSynced,
      remaining: this.messageQueue.length
    })
  }

  private async simulateDeviceSpecificSending(content: string): Promise<boolean> {
    if (this.config.deviceType === 'ios') {
      return this.simulateiOSSending(content)
    } else {
      return this.simulateAndroidSending(content)
    }
  }

  private async simulateiOSSending(content: string): Promise<boolean> {
    // iOS-specific sending behavior
    const processingTime = 50 + Math.random() * 100 // 50-150ms processing

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // iOS typically has higher reliability
    const success = Math.random() < 0.97

    if (this.metrics.iosSpecificMetrics) {
      this.metrics.iosSpecificMetrics.coreDataSyncOperations++
    }

    return success
  }

  private async simulateAndroidSending(content: string): Promise<boolean> {
    // Android-specific sending behavior
    const processingTime = 40 + Math.random() * 120 // 40-160ms processing

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // Android success rate affected by background restrictions
    let successRate = 0.95

    if (this.appState === 'background' && this.config.batteryOptimizationEnabled) {
      successRate *= 0.9 // Reduced when in background with battery optimization
    }

    const success = Math.random() < successRate

    if (this.metrics.androidSpecificMetrics) {
      this.metrics.androidSpecificMetrics.roomDatabaseOperations++
      
      if (this.appState === 'background') {
        this.metrics.androidSpecificMetrics.workManagerTasks++
      }
    }

    return success
  }

  private calculateNetworkLatency(): number {
    const baseLatency = this.currentNetwork.latency
    const jitter = Math.random() * baseLatency * 0.3 // 30% jitter
    const packetLossDelay = Math.random() < (this.currentNetwork.packetLoss / 100) ? baseLatency * 2 : 0
    
    return baseLatency + jitter + packetLossDelay
  }

  private simulateBatteryDrain(): void {
    // Simulate battery drain based on usage
    const drainRate = this.appState === 'foreground' ? 0.5 : 0.1 // Faster drain in foreground
    this.batteryLevel = Math.max(0, this.batteryLevel - drainRate)

    // Calculate battery usage score (higher is better)
    this.metrics.batteryUsageScore = Math.max(0, 100 - (100 - this.batteryLevel) * 2)

    this.emit('batteryChange', {
      deviceId: this.deviceId,
      batteryLevel: this.batteryLevel,
      batteryUsageScore: this.metrics.batteryUsageScore
    })
  }

  private simulateNetworkConditionChange(): void {
    // Randomly switch networks occasionally
    if (Math.random() < 0.2) { // 20% chance per check
      const networkTypes = ['5G', '4G', '3G', 'WiFi']
      const newNetworkType = networkTypes[Math.floor(Math.random() * networkTypes.length)]
      
      if (newNetworkType !== this.currentNetwork.type) {
        this.currentNetwork = this.getNetworkCondition(newNetworkType)
        this.metrics.networkSwitches++
        
        this.emit('networkSwitch', {
          deviceId: this.deviceId,
          from: this.config.networkType,
          to: newNetworkType
        })
        
        this.config.networkType = newNetworkType as any
      }
    }

    // Simulate connection drops
    if (Math.random() < (1 - this.currentNetwork.connectionStability)) {
      this.simulateConnectionDrop()
    }
  }

  private async simulateConnectionDrop(): Promise<void> {
    this.isOnline = false
    this.metrics.connectionDrops++
    
    this.emit('connectionLost', {
      deviceId: this.deviceId,
      networkType: this.currentNetwork.type
    })

    // Simulate reconnection time
    const reconnectionTime = 2000 + Math.random() * 8000 // 2-10 seconds
    
    setTimeout(() => {
      this.isOnline = true
      this.metrics.reconnectionTime = 
        (this.metrics.reconnectionTime * (this.metrics.connectionDrops - 1) + reconnectionTime) /
        this.metrics.connectionDrops

      this.emit('connectionRestored', {
        deviceId: this.deviceId,
        reconnectionTime
      })

      // Sync any queued messages
      this.syncOfflineMessages()
    }, reconnectionTime)
  }

  private simulateAppStateTransition(): void {
    const states = ['foreground', 'background', 'suspended']
    const currentIndex = states.indexOf(this.appState)
    
    // More likely to go to background from foreground, and vice versa
    let newState: string
    if (this.appState === 'foreground') {
      newState = Math.random() < 0.7 ? 'background' : 'suspended'
    } else if (this.appState === 'background') {
      newState = Math.random() < 0.6 ? 'foreground' : 'suspended'
    } else {
      newState = Math.random() < 0.8 ? 'foreground' : 'background'
    }

    if (newState !== this.appState) {
      const oldState = this.appState
      this.appState = newState as any

      this.emit('appStateChange', {
        deviceId: this.deviceId,
        from: oldState,
        to: newState
      })

      // Update device-specific metrics
      if (this.config.deviceType === 'ios' && this.metrics.iosSpecificMetrics) {
        this.metrics.iosSpecificMetrics.appStateTransitions++
        
        if (newState === 'background' && this.config.backgroundAppRefreshEnabled) {
          this.metrics.iosSpecificMetrics.backgroundAppRefreshEvents++
        }
      }

      if (this.config.deviceType === 'android' && this.metrics.androidSpecificMetrics) {
        if (newState === 'suspended') {
          this.metrics.androidSpecificMetrics.appStandbyEvents++
        }
      }

      // Sync messages when coming to foreground
      if (newState === 'foreground') {
        this.syncOfflineMessages()
      }
    }
  }

  private updateDeliveryLatencyMetrics(latency: number): void {
    const count = this.metrics.messagesDelivered
    
    // Update average latency
    this.metrics.averageDeliveryLatency = 
      (this.metrics.averageDeliveryLatency * (count - 1) + latency) / count
    
    // Update background delivery latency if app is in background
    if (this.appState === 'background') {
      this.metrics.backgroundDeliveryLatency = 
        (this.metrics.backgroundDeliveryLatency + latency) / 2
    }
  }

  private addError(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.metrics.errors.push({
      timestamp: Date.now(),
      deviceId: this.deviceId,
      type,
      message,
      severity,
      networkType: this.currentNetwork.type,
      batteryLevel: this.batteryLevel
    })
  }

  private addWarning(type: string, message: string, metric: string, actualValue: number, expectedValue: number): void {
    this.metrics.warnings.push({
      timestamp: Date.now(),
      deviceId: this.deviceId,
      type,
      message,
      metric,
      actualValue,
      expectedValue
    })
  }

  /**
   * Get current device status
   */
  getDeviceStatus() {
    return {
      deviceId: this.deviceId,
      deviceType: this.config.deviceType,
      osVersion: this.config.osVersion,
      isOnline: this.isOnline,
      networkType: this.currentNetwork.type,
      appState: this.appState,
      batteryLevel: this.batteryLevel,
      queuedMessages: this.messageQueue.length,
      lastSyncTime: this.lastSyncTime
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MobileMessagingMetrics {
    return { ...this.metrics }
  }

  /**
   * Force sync of offline messages
   */
  async forceSyncOfflineMessages(): Promise<void> {
    await this.syncOfflineMessages()
  }

  /**
   * Simulate app being opened by user
   */
  openApp(): void {
    this.appState = 'foreground'
    this.syncOfflineMessages()
    
    this.emit('appOpened', {
      deviceId: this.deviceId
    })
  }

  /**
   * Simulate app being backgrounded
   */
  backgroundApp(): void {
    this.appState = 'background'
    
    this.emit('appBackgrounded', {
      deviceId: this.deviceId
    })
  }

  /**
   * Cleanup device simulator
   */
  cleanup(): void {
    this.removeAllListeners()
  }
}

/**
 * Mobile Device Fleet Manager
 * Manages multiple mobile device simulators for load testing
 */
export class MobileDeviceFleet {
  private devices: Map<string, MobileDeviceSimulator>
  private fleetMetrics: {
    totalDevices: number
    activeDevices: number
    messagesSentAcrossFleet: number
    messagesDeliveredAcrossFleet: number
    averageFleetLatency: number
    fleetBatteryScore: number
  }

  constructor() {
    this.devices = new Map()
    this.fleetMetrics = {
      totalDevices: 0,
      activeDevices: 0,
      messagesSentAcrossFleet: 0,
      messagesDeliveredAcrossFleet: 0,
      averageFleetLatency: 0,
      fleetBatteryScore: 0
    }
  }

  /**
   * Create diverse fleet of mobile devices
   */
  createDeviceFleet(deviceCount: number): MobileDeviceSimulator[] {
    const devices: MobileDeviceSimulator[] = []
    
    for (let i = 0; i < deviceCount; i++) {
      const device = this.createRandomDevice(`device-${i}`)
      this.devices.set(device.getDeviceStatus().deviceId, device)
      devices.push(device)
    }
    
    this.fleetMetrics.totalDevices = deviceCount
    this.fleetMetrics.activeDevices = deviceCount
    
    console.log(`📱 Created fleet of ${deviceCount} mobile devices`)
    this.logFleetComposition()
    
    return devices
  }

  private createRandomDevice(deviceId: string): MobileDeviceSimulator {
    const deviceTypes = ['ios', 'android']
    const osVersions = {
      ios: ['15.0', '16.0', '17.0'],
      android: ['11', '12', '13', '14']
    }
    const networkTypes = ['5G', '4G', '3G', 'WiFi']
    const regions = ['singapore', 'malaysia', 'indonesia', 'brunei']
    
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)] as 'ios' | 'android'
    
    const config: MobileDeviceConfig = {
      deviceType,
      osVersion: osVersions[deviceType][Math.floor(Math.random() * osVersions[deviceType].length)],
      appVersion: '1.0.0',
      networkType: networkTypes[Math.floor(Math.random() * networkTypes.length)] as any,
      batteryLevel: 20 + Math.random() * 80, // 20-100%
      batteryOptimizationEnabled: Math.random() < 0.6, // 60% have battery optimization
      backgroundAppRefreshEnabled: Math.random() < 0.8, // 80% allow background refresh
      pushNotificationsEnabled: Math.random() < 0.9, // 90% have push notifications enabled
      locationRegion: regions[Math.floor(Math.random() * regions.length)] as any
    }
    
    return new MobileDeviceSimulator(deviceId, config)
  }

  private logFleetComposition(): void {
    const composition = {
      ios: 0,
      android: 0,
      networkTypes: { '5G': 0, '4G': 0, '3G': 0, 'WiFi': 0 },
      regions: { singapore: 0, malaysia: 0, indonesia: 0, brunei: 0 }
    }
    
    this.devices.forEach(device => {
      const status = device.getDeviceStatus()
      composition[status.deviceType]++
      composition.networkTypes[status.networkType]++
      // Additional composition tracking could be added here
    })
    
    console.log('📊 Fleet Composition:')
    console.log(`   iOS: ${composition.ios}, Android: ${composition.android}`)
    console.log(`   5G: ${composition.networkTypes['5G']}, 4G: ${composition.networkTypes['4G']}, 3G: ${composition.networkTypes['3G']}, WiFi: ${composition.networkTypes.WiFi}`)
  }

  /**
   * Simulate realistic messaging behavior across fleet
   */
  async simulateFleetMessaging(durationMinutes: number, messagesPerMinute: number): Promise<void> {
    console.log(`📱 Starting fleet messaging simulation for ${durationMinutes} minutes`)
    
    const endTime = Date.now() + (durationMinutes * 60 * 1000)
    const messageInterval = 60000 / messagesPerMinute // Interval between messages
    
    while (Date.now() < endTime) {
      // Select random devices to send messages
      const sendingDevices = this.selectRandomDevices(Math.min(10, this.devices.size))
      const receivingDevices = this.selectRandomDevices(Math.min(10, this.devices.size))
      
      // Send messages between devices
      const messagingPromises = sendingDevices.map((sender, index) => {
        const receiver = receivingDevices[index % receivingDevices.length]
        return this.simulateDeviceToDeviceMessage(sender, receiver)
      })
      
      await Promise.allSettled(messagingPromises)
      
      // Update fleet metrics
      this.updateFleetMetrics()
      
      // Wait for next message interval
      await new Promise(resolve => setTimeout(resolve, messageInterval))
    }
    
    console.log('✅ Fleet messaging simulation completed')
  }

  private selectRandomDevices(count: number): MobileDeviceSimulator[] {
    const allDevices = Array.from(this.devices.values())
    const shuffled = allDevices.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  private async simulateDeviceToDeviceMessage(sender: MobileDeviceSimulator, receiver: MobileDeviceSimulator): Promise<void> {
    const messageContent = this.generateRandomMessage()
    const senderStatus = sender.getDeviceStatus()
    const receiverStatus = receiver.getDeviceStatus()
    
    try {
      // Send message from sender
      const sendSuccess = await sender.sendMessage(messageContent, receiverStatus.deviceId)
      
      if (sendSuccess) {
        // Deliver to receiver
        await receiver.receiveMessage(messageContent, senderStatus.deviceId)
      }
      
    } catch (error) {
      console.error(`Failed to simulate message between ${senderStatus.deviceId} and ${receiverStatus.deviceId}:`, error)
    }
  }

  private generateRandomMessage(): string {
    const messages = [
      "Assalamu alaikum! How are you today?",
      "I hope you're having a blessed day.",
      "What are your thoughts on family values?",
      "I'd love to learn more about your faith journey.",
      "Perhaps we could arrange a family meeting?",
      "Wa alaikum assalam, thank you for your message.",
      "I enjoy spending time with my family.",
      "My prayers are very important to me.",
      "What Islamic practices do you follow?",
      "I believe in the importance of halal relationships."
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  private updateFleetMetrics(): void {
    let totalSent = 0
    let totalDelivered = 0
    let totalLatency = 0
    let totalBatteryScore = 0
    let activeDevices = 0
    
    this.devices.forEach(device => {
      const metrics = device.getMetrics()
      const status = device.getDeviceStatus()
      
      totalSent += metrics.messagesSent
      totalDelivered += metrics.messagesDelivered
      totalLatency += metrics.averageDeliveryLatency
      totalBatteryScore += metrics.batteryUsageScore
      
      if (status.isOnline) {
        activeDevices++
      }
    })
    
    this.fleetMetrics.messagesSentAcrossFleet = totalSent
    this.fleetMetrics.messagesDeliveredAcrossFleet = totalDelivered
    this.fleetMetrics.averageFleetLatency = totalLatency / this.devices.size
    this.fleetMetrics.fleetBatteryScore = totalBatteryScore / this.devices.size
    this.fleetMetrics.activeDevices = activeDevices
  }

  /**
   * Get aggregated fleet metrics
   */
  getFleetMetrics() {
    this.updateFleetMetrics()
    return { ...this.fleetMetrics }
  }

  /**
   * Get individual device metrics
   */
  getDeviceMetrics(deviceId: string): MobileMessagingMetrics | null {
    const device = this.devices.get(deviceId)
    return device ? device.getMetrics() : null
  }

  /**
   * Cleanup entire fleet
   */
  cleanup(): void {
    this.devices.forEach(device => device.cleanup())
    this.devices.clear()
  }
}