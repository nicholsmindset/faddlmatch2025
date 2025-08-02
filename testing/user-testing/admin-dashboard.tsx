'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../apps/web/src/components/ui/Button'
import { Tabs } from '../../apps/web/src/components/ui/Tabs'
import { Progress } from '../../apps/web/src/components/ui/Progress'
import { Badge } from '../../apps/web/src/components/ui/Badge'

// Import our testing infrastructure
import { StagingEnvironmentManager } from './environment/staging-setup'
import { TestDataSeeder } from './environment/data-seeding'
import { FeedbackAnalyticsManager } from './feedback/analytics-collection/feedback-analytics'
import { UserBehaviorAnalytics } from './environment/analytics-monitoring'
import { IslamicComplianceTestSuite } from './scenarios/islamic-compliance-tests'
import { MessagingScenarioTester } from './scenarios/messaging-scenarios'

interface DashboardProps {
  supabaseUrl: string
  supabaseServiceKey: string
  supabaseAnonKey: string
}

interface TestSession {
  id: string
  name: string
  status: 'planned' | 'active' | 'completed' | 'paused'
  participants: number
  startDate: string
  endDate: string
  progress: number
  results?: {
    satisfaction: number
    islamicCompliance: number
    usability: number
    feedback: string[]
  }
}

interface RealTimeMetrics {
  activeUsers: number
  activeGuardians: number
  activeTests: number
  messagesPerMinute: number
  islamicComplianceScore: number
  systemHealthScore: number
}

const UserTestingDashboard: React.FC<DashboardProps> = ({
  supabaseUrl,
  supabaseServiceKey,
  supabaseAnonKey
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [testSessions, setTestSessions] = useState<TestSession[]>([])
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  // Initialize managers
  const [stagingManager] = useState(() => new StagingEnvironmentManager({
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey,
    testingMode: true,
    environment: 'staging',
    enableAnalytics: true,
    enableRealTimeFeatures: true,
    testDuration: 14
  }))

  const [analyticsManager] = useState(() => new FeedbackAnalyticsManager(supabaseUrl, supabaseServiceKey))
  const [behaviorAnalytics] = useState(() => new UserBehaviorAnalytics(supabaseUrl, supabaseServiceKey))
  const [complianceTests] = useState(() => new IslamicComplianceTestSuite(supabaseUrl, supabaseAnonKey))
  const [messagingTests] = useState(() => new MessagingScenarioTester(supabaseUrl, supabaseAnonKey))

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load test sessions
      const sessionsData = await stagingManager.monitorTestingSessions()
      setTestSessions(sessionsData.activeSessions.map(session => ({
        ...session,
        participants: session.participants.length,
        progress: session.status === 'completed' ? 100 : 
                 session.status === 'active' ? 65 : 
                 session.status === 'paused' ? 35 : 10
      })))

      // Load real-time metrics
      const metrics = await behaviorAnalytics.getRealTimeMetrics()
      setRealTimeMetrics({
        activeUsers: metrics.activeUsers,
        activeGuardians: metrics.activeGuardians,
        activeTests: sessionsData.overallMetrics.activeTests,
        messagesPerMinute: metrics.messagesPerMinute,
        islamicComplianceScore: metrics.islamicComplianceScore,
        systemHealthScore: metrics.systemHealthScore
      })

      // Load recent activity and alerts
      const dashboardData = await behaviorAnalytics.getDashboardData()
      setRecentActivity(dashboardData.recentActivity)
      setAlerts(dashboardData.alerts)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewTestSession = async () => {
    try {
      const sessionId = await stagingManager.createTestingSession({
        name: `User Testing Session ${new Date().toLocaleDateString()}`,
        description: 'Comprehensive Islamic matrimonial platform testing',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        participants: [],
        scenarios: ['islamic_compliance', 'guardian_oversight', 'cross_cultural_matching'],
        status: 'planned'
      })

      console.log('Created new testing session:', sessionId)
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Error creating test session:', error)
    }
  }

  const runIslamicComplianceTests = async (userId: string = 'test_user_demo') => {
    try {
      const results = await complianceTests.runAllComplianceTests(userId)
      console.log('Islamic compliance test results:', results)
      
      // Show results in UI (you could open a modal or navigate to results page)
      alert(`Islamic compliance tests completed!\nPassed: ${results.overall.passed}/${results.overall.passed + results.overall.failed}\nOverall Score: ${results.overall.score.toFixed(1)}/100`)
    } catch (error) {
      console.error('Error running Islamic compliance tests:', error)
    }
  }

  const runMessagingScenarios = async () => {
    try {
      const results = await messagingTests.runAllMessagingScenarios()
      console.log('Messaging scenario results:', results)
      
      alert(`Messaging scenarios completed!\nPassed: ${results.overall.passed}/${results.overall.passed + results.overall.failed}\nAverage Score: ${results.overall.averageScore.toFixed(1)}/100\nIslamic Compliance: ${results.overall.averageIslamicCompliance.toFixed(1)}/100`)
    } catch (error) {
      console.error('Error running messaging scenarios:', error)
    }
  }

  const generateComprehensiveReport = async (sessionId: string) => {
    try {
      const report = await stagingManager.generateTestingReport(sessionId)
      console.log('Comprehensive report:', report)
      
      // In a real implementation, this would open a detailed report view
      alert(`Report generated for session: ${report.session.name}\nOverall satisfaction: ${report.feedback.islamicCompliance.toFixed(1)}/100`)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const MetricCard: React.FC<{ title: string; value: string | number; subtitle?: string; status?: 'good' | 'warning' | 'critical' }> = ({
    title, value, subtitle, status = 'good'
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-3 h-3 rounded-full ${
          status === 'good' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      </div>
    </div>
  )

  const TestSessionCard: React.FC<{ session: TestSession }> = ({ session }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
          <p className="text-sm text-gray-600">{session.participants} participants</p>
        </div>
        <Badge className={`${
          session.status === 'active' ? 'bg-green-100 text-green-800' :
          session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          session.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {session.status}
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{session.progress}%</span>
        </div>
        <Progress value={session.progress} className="w-full" />
      </div>

      {session.results && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{session.results.satisfaction}/100</div>
            <div className="text-gray-500">Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{session.results.islamicCompliance}/100</div>
            <div className="text-gray-500">Islamic</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{session.results.usability}/100</div>
            <div className="text-gray-500">Usability</div>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setSelectedSession(session.id)}
        >
          View Details
        </Button>
        <Button 
          size="sm"
          onClick={() => generateComprehensiveReport(session.id)}
        >
          Generate Report
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FADDL Match User Testing Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                FADDL Match User Testing Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Islamic Matrimonial Platform Testing & Analytics
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={createNewTestSession}>
                New Test Session
              </Button>
              <Button variant="outline" onClick={loadDashboardData}>
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'sessions', label: 'Test Sessions' },
                { id: 'islamic-compliance', label: 'Islamic Compliance' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'feedback', label: 'Feedback Analysis' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realTimeMetrics && (
                  <>
                    <MetricCard
                      title="Active Users"
                      value={realTimeMetrics.activeUsers}
                      subtitle="Currently online"
                      status="good"
                    />
                    <MetricCard
                      title="Active Guardians"
                      value={realTimeMetrics.activeGuardians}
                      subtitle="Providing oversight"
                      status="good"
                    />
                    <MetricCard
                      title="Active Tests"
                      value={realTimeMetrics.activeTests}
                      subtitle="Running scenarios"
                      status="good"
                    />
                    <MetricCard
                      title="Messages/Minute"
                      value={realTimeMetrics.messagesPerMinute.toFixed(1)}
                      subtitle="Real-time activity"
                      status="good"
                    />
                    <MetricCard
                      title="Islamic Compliance"
                      value={`${realTimeMetrics.islamicComplianceScore.toFixed(1)}/100`}
                      subtitle="Adherence score"
                      status={realTimeMetrics.islamicComplianceScore >= 80 ? 'good' : 'warning'}
                    />
                    <MetricCard
                      title="System Health"
                      value={`${realTimeMetrics.systemHealthScore.toFixed(1)}/100`}
                      subtitle="Overall system status"
                      status={realTime Metrics.systemHealthScore >= 90 ? 'good' : 'warning'}
                    />
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button onClick={() => runIslamicComplianceTests()}>
                    Run Islamic Compliance Tests
                  </Button>
                  <Button onClick={runMessagingScenarios}>
                    Test Messaging Scenarios
                  </Button>
                  <Button onClick={createNewTestSession}>
                    Create Test Session
                  </Button>
                  <Button variant="outline" onClick={loadDashboardData}>
                    Generate Full Report
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                        <p className="text-xs text-gray-500">{activity.event} • {activity.user}</p>
                        {activity.islamicRelevance && (
                          <p className="text-xs text-blue-600">🕌 {activity.islamicRelevance}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Test Sessions</h2>
                <Button onClick={createNewTestSession}>
                  Create New Session
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testSessions.map(session => (
                  <TestSessionCard key={session.id} session={session} />
                ))}
                
                {testSessions.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-500 mb-4">No active test sessions</p>
                    <Button onClick={createNewTestSession}>
                      Create Your First Test Session
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Islamic Compliance Tab */}
          {activeTab === 'islamic-compliance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Islamic Compliance Testing</h2>
                <Button onClick={() => runIslamicComplianceTests()}>
                  Run All Tests
                </Button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Test Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Messaging Compliance', description: 'Islamic etiquette and content validation' },
                    { name: 'Guardian System', description: 'Wali authority and oversight testing' },
                    { name: 'Prayer Time Integration', description: 'Islamic schedule awareness' },
                    { name: 'Cultural Sensitivity', description: 'Cross-cultural Islamic respect' },
                    { name: 'Matching Algorithm', description: 'Islamic compatibility weighting' },
                    { name: 'Content Moderation', description: 'Islamic standards enforcement' }
                  ].map(category => (
                    <div key={category.name} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      <Button size="sm" className="mt-2" variant="outline">
                        Run Tests
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">User Behavior Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Islamic Feature Usage */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Islamic Feature Usage</h3>
                  <div className="space-y-4">
                    {[
                      { feature: 'Prayer Time Awareness', usage: 87, color: 'bg-green-500' },
                      { feature: 'Islamic Greetings', usage: 92, color: 'bg-blue-500' },
                      { feature: 'Guardian Interactions', usage: 78, color: 'bg-purple-500' },
                      { feature: 'Islamic Content', usage: 85, color: 'bg-indigo-500' }
                    ].map(item => (
                      <div key={item.feature}>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{item.feature}</span>
                          <span>{item.usage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.usage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cultural Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cultural Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { group: 'Malay Muslim', count: 45, satisfaction: 88 },
                      { group: 'Indian Muslim', count: 32, satisfaction: 85 },
                      { group: 'Chinese Muslim', count: 18, satisfaction: 90 },
                      { group: 'International Muslim', count: 25, satisfaction: 82 }
                    ].map(item => (
                      <div key={item.group} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{item.group}</span>
                          <span className="text-sm text-gray-500 ml-2">({item.count} users)</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {item.satisfaction}% satisfied
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Analysis Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Feedback Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricCard
                  title="Overall Satisfaction"
                  value="87/100"
                  subtitle="User satisfaction score"
                  status="good"
                />
                <MetricCard
                  title="Islamic Compliance"
                  value="91/100"
                  subtitle="Religious adherence"
                  status="good"
                />
                <MetricCard
                  title="Guardian Satisfaction"
                  value="84/100"
                  subtitle="Family approval"
                  status="good"
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Feedback Highlights</h3>
                <div className="space-y-4">
                  {[
                    { type: 'positive', text: 'The Islamic guidance features help maintain proper etiquette', category: 'Islamic Compliance' },
                    { type: 'neutral', text: 'Guardian approval process could be faster', category: 'Guardian System' },
                    { type: 'positive', text: 'Cross-cultural matching respects Islamic values', category: 'Cultural Sensitivity' },
                    { type: 'negative', text: 'Mobile app needs prayer time reminders', category: 'Prayer Integration' }
                  ].map((feedback, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        feedback.type === 'positive' ? 'bg-green-500' :
                        feedback.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{feedback.text}</p>
                        <span className="text-xs text-gray-500">{feedback.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg shadow-lg ${
                alert.type === 'error' ? 'bg-red-500 text-white' :
                alert.type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              <p className="text-sm font-medium">{alert.message}</p>
              <button
                onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                className="text-xs underline mt-1"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserTestingDashboard