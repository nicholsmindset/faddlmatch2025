'use client'

import { useState } from 'react'
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  MessageCircle,
  Heart,
  Camera,
  Calendar,
  Star,
  Award,
  Target,
  BarChart3
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import type { SupervisedProfile } from '../hooks/useGuardianData'

interface ComplianceMetric {
  id: string
  name: string
  description: string
  weight: number
  score: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  recommendations: string[]
  details: {
    current: number
    target: number
    unit: string
    status: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  }
}

interface ComplianceReportProps {
  profiles: SupervisedProfile[]
}

export function ComplianceReport({ profiles }: ComplianceReportProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>(profiles[0]?.id || '')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')

  // Get current profile data
  const currentProfile = profiles.find(p => p.id === selectedProfile)

  // Mock compliance metrics for the selected profile
  const complianceMetrics: ComplianceMetric[] = [
    {
      id: 'communication',
      name: 'Communication Standards',
      description: 'Adherence to Islamic communication guidelines',
      weight: 30,
      score: 95,
      trend: 'up',
      trendValue: 5,
      recommendations: [
        'Continue maintaining respectful tone',
        'Keep messages focused on marriage intentions'
      ],
      details: {
        current: 95,
        target: 95,
        unit: '%',
        status: 'excellent'
      }
    },
    {
      id: 'photo_compliance',
      name: 'Photo Guidelines',
      description: 'Profile photos meet Islamic modesty standards',
      weight: 25,
      score: 88,
      trend: 'stable',
      trendValue: 0,
      recommendations: [
        'Consider updating main profile photo',
        'Ensure all photos show appropriate dress'
      ],
      details: {
        current: 88,
        target: 95,
        unit: '%',
        status: 'good'
      }
    },
    {
      id: 'interaction_timing',
      name: 'Interaction Timing',
      description: 'Appropriate timing for communications',
      weight: 20,
      score: 92,
      trend: 'up',
      trendValue: 3,
      recommendations: [
        'Good adherence to prayer times',
        'Maintain current communication schedule'
      ],
      details: {
        current: 92,
        target: 90,
        unit: '%',
        status: 'excellent'
      }
    },
    {
      id: 'family_involvement',
      name: 'Family Involvement',
      description: 'Level of family engagement in the process',
      weight: 15,
      score: 85,
      trend: 'down',
      trendValue: -2,
      recommendations: [
        'Increase family consultation frequency',
        'Schedule more family discussions'
      ],
      details: {
        current: 85,
        target: 90,
        unit: '%',
        status: 'good'
      }
    },
    {
      id: 'meeting_protocol',
      name: 'Meeting Protocol',
      description: 'Proper arrangements for in-person meetings',
      weight: 10,
      score: 100,
      trend: 'stable',
      trendValue: 0,
      recommendations: [
        'Excellent adherence to chaperoned meetings',
        'Continue current approach'
      ],
      details: {
        current: 100,
        target: 100,
        unit: '%',
        status: 'excellent'
      }
    }
  ]

  // Calculate overall compliance score
  const overallScore = Math.round(
    complianceMetrics.reduce((sum, metric) => sum + (metric.score * metric.weight / 100), 0)
  )

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-amber-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 95) return 'success'
    if (score >= 85) return 'warning'
    if (score >= 70) return 'info'
    return 'danger'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="h-4 w-4 text-green-600" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'needs_improvement':
        return <Target className="h-4 w-4 text-amber-600" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-neutral-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Compliance Report</h2>
          <p className="text-neutral-600">Islamic values adherence and behavioral insights</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              Overall Compliance Score
            </h3>
            <p className="text-sm text-neutral-600">
              For {currentProfile?.name} • {selectedTimeframe}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <Badge variant={getScoreBadgeVariant(overallScore) as any} size="sm">
              {overallScore >= 95 ? 'Excellent' : overallScore >= 85 ? 'Good' : overallScore >= 70 ? 'Fair' : 'Needs Attention'}
            </Badge>
          </div>
        </div>
        
        <Progress value={overallScore} className="mb-4" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Excellent Areas</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">
              {complianceMetrics.filter(m => m.score >= 95).length}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">Good Areas</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">
              {complianceMetrics.filter(m => m.score >= 85 && m.score < 95).length}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Improving</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">
              {complianceMetrics.filter(m => m.trend === 'up').length}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Needs Focus</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">
              {complianceMetrics.filter(m => m.score < 85).length}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6">
        {complianceMetrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(metric.details.status)}
                  <h3 className="text-lg font-semibold text-neutral-900">{metric.name}</h3>
                  <Badge variant="outline" size="sm">
                    {metric.weight}% weight
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600 mb-3">{metric.description}</p>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(metric.score)} mb-1`}>
                  {metric.score}%
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  {metric.trendValue !== 0 && (
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-neutral-600'
                    }`}>
                      {metric.trend === 'up' ? '+' : ''}{metric.trendValue}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Current Progress</span>
                <span className="text-sm font-medium text-neutral-900">
                  {metric.details.current}{metric.details.unit} / {metric.details.target}{metric.details.unit}
                </span>
              </div>
              <Progress value={metric.score} className="mb-1" />
            </div>
            
            {metric.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {metric.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Historical Trends */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compliance Trends
          </h3>
          <Button variant="outline" size="sm">
            View Full Report
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-1">+2.5%</div>
            <p className="text-sm text-green-700">Improvement this month</p>
            <p className="text-xs text-green-600 mt-1">vs. last month</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">94%</div>
            <p className="text-sm text-blue-700">Average score</p>
            <p className="text-xs text-blue-600 mt-1">last 3 months</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">5</div>
            <p className="text-sm text-purple-700">Areas improved</p>
            <p className="text-xs text-purple-600 mt-1">this quarter</p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recommended Actions
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <div className="bg-amber-100 p-1 rounded">
              <Camera className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">Update Profile Photos</p>
              <p className="text-sm text-amber-700">Consider refreshing main profile photo to maintain high compliance score</p>
              <Badge variant="warning" size="sm" className="mt-1">Priority: Medium</Badge>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <div className="bg-amber-100 p-1 rounded">
              <Heart className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">Increase Family Discussions</p>
              <p className="text-sm text-amber-700">Schedule weekly family meetings to discuss marriage progress</p>
              <Badge variant="info" size="sm" className="mt-1">Priority: Low</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}