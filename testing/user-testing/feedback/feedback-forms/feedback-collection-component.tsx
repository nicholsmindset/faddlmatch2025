'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../../../apps/web/src/components/ui/Button'
import { Input } from '../../../../apps/web/src/components/ui/Input'
import { Label } from '../../../../apps/web/src/components/ui/Label'
import { RadioGroup } from '../../../../apps/web/src/components/ui/RadioGroup'
import { Progress } from '../../../../apps/web/src/components/ui/Progress'
import { createClient } from '@supabase/supabase-js'

// Import survey templates
import islamicComplianceSurvey from '../survey-templates/islamic-compliance-survey.json'
import guardianSatisfactionSurvey from '../survey-templates/guardian-satisfaction-survey.json'
import usabilityTestingSurvey from '../survey-templates/usability-testing-survey.json'

interface FeedbackCollectionProps {
  surveyType: 'islamic_compliance' | 'guardian_satisfaction' | 'usability_testing'
  userId: string
  userType: 'user' | 'guardian'
  culturalBackground: string
  onComplete: (responses: Record<string, any>) => void
  onCancel?: () => void
}

interface Question {
  id: string
  type: string
  question: string
  options?: string[]
  required: boolean
  followUp?: {
    condition: string
    question: string
    type: string
    options?: string[]
  }
  maxSelections?: number
  placeholder?: string
}

interface Section {
  id: string
  title: string
  description: string
  questions: Question[]
}

const FeedbackCollection: React.FC<FeedbackCollectionProps> = ({
  surveyType,
  userId,
  userType,
  culturalBackground,
  onComplete,
  onCancel
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpResponse, setFollowUpResponse] = useState('')

  // Get survey configuration
  const getSurveyConfig = () => {
    switch (surveyType) {
      case 'islamic_compliance':
        return islamicComplianceSurvey.islamicComplianceSurvey
      case 'guardian_satisfaction':
        return guardianSatisfactionSurvey.guardianSatisfactionSurvey
      case 'usability_testing':
        return usabilityTestingSurvey.usabilityTestingSurvey
      default:
        return islamicComplianceSurvey.islamicComplianceSurvey
    }
  }

  const surveyConfig = getSurveyConfig()
  const sections: Section[] = surveyConfig.sections
  const currentSection = sections[currentSectionIndex]
  const currentQuestion = currentSection?.questions[currentQuestionIndex]
  const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0)
  const answeredQuestions = Object.keys(responses).length
  const progress = (answeredQuestions / totalQuestions) * 100

  // Initialize analytics tracking
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Track survey start
    trackEvent('survey_started', {
      surveyType,
      userType,
      culturalBackground,
      totalQuestions
    })
  }, [])

  const trackEvent = async (eventType: string, properties: Record<string, any>) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: `feedback_${eventType}`,
          properties: {
            surveyType,
            ...properties,
            timestamp: new Date().toISOString()
          }
        })
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  const handleResponse = (questionId: string, answer: any) => {
    const newResponses = { ...responses, [questionId]: answer }
    setResponses(newResponses)

    // Check for follow-up questions
    if (currentQuestion?.followUp) {
      const shouldShowFollowUp = evaluateFollowUpCondition(
        currentQuestion.followUp.condition,
        answer
      )
      setShowFollowUp(shouldShowFollowUp)
    } else {
      setShowFollowUp(false)
    }

    // Track response
    trackEvent('question_answered', {
      questionId,
      sectionId: currentSection.id,
      answer,
      questionType: currentQuestion?.type
    })
  }

  const evaluateFollowUpCondition = (condition: string, answer: any): boolean => {
    // Simple condition evaluation
    if (condition === 'always') return true
    if (condition.includes('score <=')) {
      const threshold = parseInt(condition.split('<=')[1].trim())
      return typeof answer === 'number' && answer <= threshold
    }
    if (condition.includes('score >=')) {
      const threshold = parseInt(condition.split('>=')[1].trim())
      return typeof answer === 'number' && answer >= threshold
    }
    if (condition.includes('answer ===')) {
      const expectedAnswer = condition.split('===')[1].trim().replace(/'/g, '')
      return answer === expectedAnswer
    }
    return false
  }

  const handleFollowUpResponse = (answer: any) => {
    if (currentQuestion?.followUp) {
      const followUpId = `${currentQuestion.id}_followup`
      handleResponse(followUpId, answer)
    }
    setFollowUpResponse('')
    setShowFollowUp(false)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentSectionIndex < sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
      
      // Track section completion
      trackEvent('section_completed', {
        sectionId: currentSection.id,
        sectionIndex: currentSectionIndex,
        questionsAnswered: currentSection.questions.length
      })
    } else {
      // Survey complete
      handleSubmit()
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      setCurrentQuestionIndex(sections[currentSectionIndex - 1].questions.length - 1)
    }
    setShowFollowUp(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Track completion
      await trackEvent('survey_completed', {
        totalResponses: Object.keys(responses).length,
        completionRate: (Object.keys(responses).length / totalQuestions) * 100,
        culturalBackground,
        userType
      })

      // Submit responses
      onComplete(responses)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    await trackEvent('survey_abandoned', {
      sectionIndex: currentSectionIndex,
      questionIndex: currentQuestionIndex,
      responsesProvided: Object.keys(responses).length
    })
    onCancel?.()
  }

  const renderQuestion = (question: Question) => {
    const currentAnswer = responses[question.id]

    switch (question.type) {
      case 'likert_5':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">{question.question}</Label>
            <RadioGroup
              value={currentAnswer?.toString() || ''}
              onValueChange={(value) => handleResponse(question.id, parseInt(value))}
              className="space-y-2"
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${question.id}_${index}`}
                    name={question.id}
                    value={index + 1}
                    className="text-blue-600"
                  />
                  <Label htmlFor={`${question.id}_${index}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'multiple_choice':
        const selectedOptions = currentAnswer || []
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">{question.question}</Label>
            {question.maxSelections && (
              <p className="text-sm text-gray-600">
                Select up to {question.maxSelections} options
              </p>
            )}
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${question.id}_${index}`}
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => {
                      let newSelection = [...selectedOptions]
                      if (e.target.checked) {
                        if (!question.maxSelections || newSelection.length < question.maxSelections) {
                          newSelection.push(option)
                        }
                      } else {
                        newSelection = newSelection.filter(item => item !== option)
                      }
                      handleResponse(question.id, newSelection)
                    }}
                    className="text-blue-600"
                  />
                  <Label htmlFor={`${question.id}_${index}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case 'nps':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">{question.question}</Label>
            <div className="flex space-x-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleResponse(question.id, i)}
                  className={`w-10 h-10 rounded border ${
                    currentAnswer === i
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Not likely at all</span>
              <span>Extremely likely</span>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">{question.question}</Label>
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )

      case 'yes_no':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">{question.question}</Label>
            <RadioGroup
              value={currentAnswer || ''}
              onValueChange={(value) => handleResponse(question.id, value)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <input type="radio" id={`${question.id}_yes`} name={question.id} value="yes" />
                <Label htmlFor={`${question.id}_yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id={`${question.id}_no`} name={question.id} value="no" />
                <Label htmlFor={`${question.id}_no`}>No</Label>
              </div>
            </RadioGroup>
          </div>
        )

      default:
        return <div>Unsupported question type: {question.type}</div>
    }
  }

  const renderFollowUp = () => {
    if (!showFollowUp || !currentQuestion?.followUp) return null

    const followUp = currentQuestion.followUp

    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <h4 className="text-md font-medium text-blue-900 mb-3">Follow-up Question</h4>
        
        {followUp.type === 'text' ? (
          <div className="space-y-3">
            <Label className="text-blue-800">{followUp.question}</Label>
            <textarea
              value={followUpResponse}
              onChange={(e) => setFollowUpResponse(e.target.value)}
              className="w-full p-2 border border-blue-200 rounded-md min-h-[80px]"
              placeholder="Please share your thoughts..."
            />
            <Button
              onClick={() => handleFollowUpResponse(followUpResponse)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!followUpResponse.trim()}
            >
              Submit Follow-up
            </Button>
          </div>
        ) : followUp.type === 'multiple_choice' && followUp.options ? (
          <div className="space-y-3">
            <Label className="text-blue-800">{followUp.question}</Label>
            <div className="space-y-2">
              {followUp.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleFollowUpResponse([option])}
                  className="block w-full text-left p-2 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false
    const answer = responses[currentQuestion.id]
    if (currentQuestion.required && !answer) return false
    return true
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading survey...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {surveyConfig.metadata.title}
          </h1>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Exit Survey
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {Math.round(progress)}% complete</span>
            <span>
              Section {currentSectionIndex + 1} of {sections.length}: {currentSection.title}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            {currentSection.title}
          </h2>
          <p className="text-blue-700 text-sm">{currentSection.description}</p>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {currentSection.questions.length} in this section
          </span>
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </div>
        
        {renderQuestion(currentQuestion)}
        {renderFollowUp()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={previousQuestion}
          variant="outline"
          disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="text-sm text-gray-500">
          Question {answeredQuestions} of {totalQuestions} answered
        </div>

        <Button
          onClick={nextQuestion}
          disabled={!isCurrentQuestionAnswered() || (showFollowUp && !responses[`${currentQuestion.id}_followup`])}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {currentSectionIndex === sections.length - 1 && 
           currentQuestionIndex === currentSection.questions.length - 1
            ? (isSubmitting ? 'Submitting...' : 'Complete Survey')
            : 'Next'
          }
        </Button>
      </div>

      {/* Survey Info */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Estimated time remaining: {Math.max(1, Math.ceil((totalQuestions - answeredQuestions) * 0.5))} minutes
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Your feedback helps us improve the Islamic matrimonial experience for all users
        </p>
      </div>
    </div>
  )
}

export default FeedbackCollection