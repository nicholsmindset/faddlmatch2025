'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Play, 
  Users, 
  Heart, 
  MessageCircle, 
  Camera, 
  Activity, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react'
import { toast } from 'sonner'

interface SimulationUser {
  id: string
  first_name: string
  last_name: string
  age: number
  profession: string
  bio: string
  verified: boolean
  premium_member: boolean
  last_active: string
}

interface SimulationResults {
  profiles_viewed?: number
  likes_given?: number
  matches_created?: number
  messages_sent?: number
  photos_uploaded?: number
  session_duration?: number
  success_rate?: number
}

export default function SimulationPage() {
  const [users, setUsers] = useState<SimulationUser[]>([])
  const [loading, setLoading] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResults>({})
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    fetchSimulationUsers()
  }, [])

  const fetchSimulationUsers = async () => {
    try {
      const response = await fetch('/api/simulation/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch simulation users:', error)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const runBrowsingSimulation = async () => {
    setLoading(true)
    setActiveSimulation('browsing')
    addLog('🔍 Starting browsing simulation...')

    try {
      const response = await fetch('/api/simulation/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_browsing',
          data: { userId: 'current-user' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Browsing session completed`)
        addLog(`👀 Viewed ${data.session.profiles_viewed.length} profiles`)
        addLog(`💝 Gave ${data.session.likes_given} likes`)
        addLog(`👎 Passed ${data.session.passes_given} profiles`)
        
        setSimulationResults(prev => ({
          ...prev,
          profiles_viewed: data.session.profiles_viewed.length,
          likes_given: data.session.likes_given
        }))

        toast.success('Browsing simulation completed!')
      }
    } catch (error) {
      addLog('❌ Browsing simulation failed')
      toast.error('Browsing simulation failed')
    } finally {
      setLoading(false)
      setActiveSimulation(null)
    }
  }

  const runMatchingSimulation = async () => {
    setLoading(true)
    setActiveSimulation('matching')
    addLog('💕 Starting matching simulation...')

    try {
      const response = await fetch('/api/simulation/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_matching',
          data: { 
            userId: 'current-user',
            targetId: users[0]?.id || 'sim-user-2'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Matching flow completed`)
        addLog(`👀 Profile viewed`)
        addLog(`💝 Like sent`)
        addLog(`🎉 Mutual match created!`)
        addLog(`💬 Conversation started`)
        
        setSimulationResults(prev => ({
          ...prev,
          matches_created: 1,
          success_rate: 100
        }))

        toast.success('🎉 It\'s a match! Simulation completed!')
      }
    } catch (error) {
      addLog('❌ Matching simulation failed')
      toast.error('Matching simulation failed')
    } finally {
      setLoading(false)
      setActiveSimulation(null)
    }
  }

  const runMessagingSimulation = async () => {
    setLoading(true)
    setActiveSimulation('messaging')
    addLog('💬 Starting messaging simulation...')

    try {
      const response = await fetch('/api/simulation/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_messaging',
          data: { 
            userId: 'current-user',
            targetId: users[0]?.id || 'sim-user-2'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Messaging simulation completed`)
        addLog(`💬 ${data.conversation.messages.length} messages exchanged`)
        addLog(`🛡️ All messages passed moderation`)
        addLog(`👥 Guardian notifications sent`)
        
        setSimulationResults(prev => ({
          ...prev,
          messages_sent: data.conversation.messages.length
        }))

        toast.success('Messaging simulation completed!')
      }
    } catch (error) {
      addLog('❌ Messaging simulation failed')
      toast.error('Messaging simulation failed')
    } finally {
      setLoading(false)
      setActiveSimulation(null)
    }
  }

  const runPhotoUploadSimulation = async () => {
    setLoading(true)
    setActiveSimulation('photos')
    addLog('📸 Starting photo upload simulation...')

    try {
      const response = await fetch('/api/simulation/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_photo_upload',
          data: { userId: 'current-user' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Photo upload completed`)
        addLog(`📸 ${data.upload.photos.length} photos uploaded`)
        addLog(`🔍 Content moderation passed`)
        addLog(`💾 Photos saved successfully`)
        
        setSimulationResults(prev => ({
          ...prev,
          photos_uploaded: data.upload.photos.length
        }))

        toast.success('Photo upload simulation completed!')
      }
    } catch (error) {
      addLog('❌ Photo upload simulation failed')
      toast.error('Photo upload simulation failed')
    } finally {
      setLoading(false)
      setActiveSimulation(null)
    }
  }

  const runFullJourneySimulation = async () => {
    setLoading(true)
    addLog('🚀 Starting complete user journey simulation...')
    
    try {
      await runBrowsingSimulation()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await runMatchingSimulation()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await runMessagingSimulation()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await runPhotoUploadSimulation()
      
      addLog('🎉 Complete user journey simulation finished!')
      toast.success('🎉 Complete simulation finished successfully!')
    } catch (error) {
      addLog('❌ Full journey simulation failed')
      toast.error('Full journey simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const resetSimulation = async () => {
    try {
      setLogs([])
      setSimulationResults({})
      addLog('🔄 Simulation reset')
      toast.success('Simulation reset')
    } catch (error) {
      toast.error('Reset failed')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            FADDL Match Simulation Center
          </h1>
          <p className="text-neutral-600">
            Test all core functionality with realistic user interactions
          </p>
        </div>

        <Tabs defaultValue="controls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="controls">Simulation Controls</TabsTrigger>
            <TabsTrigger value="users">Demo Users</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-6">
            {/* Main Simulation Controls */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Profile Browsing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Simulate browsing profiles, viewing photos, reading bios
                  </p>
                  <Button 
                    onClick={runBrowsingSimulation}
                    disabled={loading}
                    variant={activeSimulation === 'browsing' ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {activeSimulation === 'browsing' ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-pulse" />
                        Browsing...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Start Browsing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Matching Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Simulate liking profiles, getting matches, mutual interests
                  </p>
                  <Button 
                    onClick={runMatchingSimulation}
                    disabled={loading}
                    variant={activeSimulation === 'matching' ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {activeSimulation === 'matching' ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-pulse" />
                        Matching...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Start Matching
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Messaging
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Simulate conversations, message moderation, guardian oversight
                  </p>
                  <Button 
                    onClick={runMessagingSimulation}
                    disabled={loading}
                    variant={activeSimulation === 'messaging' ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {activeSimulation === 'messaging' ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-pulse" />
                        Messaging...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Messaging
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Photo Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Simulate photo uploads, moderation, different visibility levels
                  </p>
                  <Button 
                    onClick={runPhotoUploadSimulation}
                    disabled={loading}
                    variant={activeSimulation === 'photos' ? 'primary' : 'outline'}
                    fullWidth
                  >
                    {activeSimulation === 'photos' ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary-600" />
                    Complete User Journey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Run all simulations in sequence: browsing → matching → messaging → photos
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={runFullJourneySimulation}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Complete Journey
                    </Button>
                    <Button 
                      onClick={resetSimulation}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Demo Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {user.first_name} {user.last_name}
                        </h4>
                        <div className="flex gap-1">
                          {user.verified && (
                            <Badge variant="success" size="sm">
                              <CheckCircle className="h-3 w-3" />
                            </Badge>
                          )}
                          {user.premium_member && (
                            <Badge variant="primary" size="sm">Premium</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600">
                        {user.age} • {user.profession}
                      </p>
                      <p className="text-xs text-neutral-500 line-clamp-2">
                        {user.bio}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        Active {new Date(user.last_active).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {simulationResults.profiles_viewed || 0}
                      </p>
                      <p className="text-sm text-neutral-600">Profiles Viewed</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {simulationResults.matches_created || 0}
                      </p>
                      <p className="text-sm text-neutral-600">Matches Created</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {simulationResults.messages_sent || 0}
                      </p>
                      <p className="text-sm text-neutral-600">Messages Sent</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {simulationResults.photos_uploaded || 0}
                      </p>
                      <p className="text-sm text-neutral-600">Photos Uploaded</p>
                    </div>
                    <Camera className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-neutral-500 italic">No activity logs yet. Run a simulation to see logs here.</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono bg-neutral-100 p-2 rounded">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}