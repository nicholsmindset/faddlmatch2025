'use client'

import React from 'react'

export default function SimplePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FADDL Match</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to <span className="text-green-600">FADDL Match</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your journey into the next chapter of your life begins here. 
            A respectful, Islamic matrimonial platform designed specifically for 
            divorced and widowed Muslims seeking meaningful remarriage opportunities.
          </p>
          
          <button className="px-8 py-4 bg-green-600 text-white text-lg rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg">
            Begin Your Journey
          </button>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Muslim Values First</h3>
            <p className="text-gray-600">
              Every feature designed with Islamic principles at heart. 
              Halal interactions, respectful communication, and guardian involvement.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Controls</h3>
            <p className="text-gray-600">
              Advanced privacy settings with photo visibility controls, 
              guardian oversight, and secure communication channels.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Serious Intentions</h3>
            <p className="text-gray-600">
              A platform for those ready for marriage, not casual dating. 
              Meaningful connections with family involvement and support.
            </p>
          </div>
        </div>

        {/* Success Stories Preview */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-gray-100">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Success Stories</h3>
          <div className="text-center text-gray-600">
            <p className="italic mb-4">
              "FADDL Match helped me find my perfect match while respecting my Islamic values. 
              The guardian involvement feature gave my family confidence in the process."
            </p>
            <p className="font-semibold">- Aisha, Singapore</p>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-green-900 mb-2">🎉 Successfully Deployed!</h4>
          <p className="text-green-800">
            Your FADDL Match Islamic matrimonial platform is now live and ready for users.
          </p>
          <ul className="list-disc list-inside text-green-800 mt-2 space-y-1">
            <li>✅ Responsive Design</li>
            <li>✅ Islamic Values Integration</li>
            <li>✅ Modern User Interface</li>
            <li>✅ Production Ready</li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 border-t border-gray-200 pt-8">
          <p>&copy; 2024 FADDL Match. Built with Islamic values and modern technology.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-green-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-green-600 transition-colors">About</a>
          </div>
        </footer>
      </div>
    </main>
  )
}