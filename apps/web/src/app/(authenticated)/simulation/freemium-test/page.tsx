/**
 * 🎯 Freemium-First Flow Testing Page
 * Comprehensive simulation of Strategy A implementation
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Heart, 
  Star, 
  Crown,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

interface JourneyStep {
  step: number
  action: string
  timestamp: string
  details: any
  status: string
  message: string
}

interface SimulationResult {
  success: boolean
  simulation_type: string
  timestamp: string
  journey: JourneyStep[]
  metrics: any
  recommendations: string[]
}

export default function FreemiumTestPage() {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null)
  const [simulationResults, setSimulationResults] = useState<{[key: string]: SimulationResult}>({})
  const [loading, setLoading] = useState<{[key: string]: boolean}>({})

  const simulationTypes = [
    {
      id: 'free',
      title: 'Free User Journey',
      description: 'Test the complete freemium experience from homepage to upgrade consideration',
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'paid',
      title: 'Direct Paid Journey',
      description: 'Test high-intent users who directly select premium plans',
      icon: CreditCard,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'upgrade',
      title: 'Free-to-Paid Conversion',
      description: 'Test the upgrade journey for engaged free users',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  const runSimulation = async (type: string) => {
    setLoading(prev => ({ ...prev, [type]: true }))
    setActiveSimulation(type)
    
    try {
      const response = await fetch(`/api/demo/freemium-journey?userType=${type}`)
      const result = await response.json()
      
      setSimulationResults(prev => ({ ...prev, [type]: result }))
    } catch (error) {
      console.error(`Simulation failed for ${type}:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    if (status.includes('SUCCESS')) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status.includes('LIMITED') || status.includes('CONSIDERING')) return <AlertCircle className="w-5 h-5 text-orange-500" />
    if (status.includes('READY') || status.includes('PREMIUM') || status.includes('UPGRADED')) return <Star className="w-5 h-5 text-blue-500" />
    return <Clock className="w-5 h-5 text-gray-500" />
  }

  const getStatusColor = (status: string) => {
    if (status.includes('SUCCESS')) return 'text-green-700 bg-green-100'
    if (status.includes('LIMITED') || status.includes('CONSIDERING')) return 'text-orange-700 bg-orange-100'
    if (status.includes('READY') || status.includes('PREMIUM') || status.includes('UPGRADED')) return 'text-blue-700 bg-blue-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Freemium-First Flow Testing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive simulation of Strategy A implementation. Test all user journeys 
            from free onboarding to premium conversions.
          </p>
        </div>

        {/* Simulation Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {simulationTypes.map((sim) => {
            const IconComponent = sim.icon
            const isLoading = loading[sim.id]
            const hasResults = simulationResults[sim.id]
            
            return (
              <motion.div
                key={sim.id}
                className={`${sim.bgColor} ${sim.borderColor} border-2 rounded-2xl p-6 relative`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: simulationTypes.indexOf(sim) * 0.1 }}
              >
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${sim.color} flex items-center justify-center`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{sim.title}</h3>
                  <p className="text-gray-600 text-sm">{sim.description}</p>
                </div>

                <button
                  onClick={() => runSimulation(sim.id)}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isLoading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `bg-gradient-to-r ${sim.color} text-white hover:shadow-lg transform hover:-translate-y-0.5`
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Run Simulation</span>
                    </>
                  )}
                </button>

                {hasResults && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Simulation Complete</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Results Section */}
        {Object.keys(simulationResults).length > 0 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Simulation Results
            </h2>

            {Object.entries(simulationResults).map(([type, result]) => (
              <motion.div
                key={type}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      {simulationTypes.find(s => s.id === type)?.title} Results
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Success Rate: {Math.round(result.metrics.success_rate * 100)}%</span>
                      <span>Steps: {result.journey.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Metrics Overview */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Journey Type</h4>
                      <p className="text-blue-700 capitalize">{result.metrics.journey_type}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Strategy Effectiveness</h4>
                      <p className="text-green-700 text-sm">{result.metrics.strategy_effectiveness}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Islamic Compliance</h4>
                      <p className="text-purple-700">{result.metrics.islamic_compliance}</p>
                    </div>
                  </div>

                  {/* Journey Steps */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">Journey Steps</h4>
                    {result.journey.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(step.status)}
                            <h5 className="font-semibold text-gray-900">{step.action}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                              {step.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{step.message}</p>
                          <div className="text-xs text-gray-500">
                            {new Date(step.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2 text-yellow-800 text-sm">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Islamic Values Notice */}
        <div className="mt-12 text-center bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Islamic Compliance</span>
          </div>
          <p className="text-green-700 text-sm">
            All simulation scenarios maintain strict adherence to Islamic values and halal guidelines 
            throughout the entire user journey.
          </p>
        </div>
      </div>
    </div>
  )
}