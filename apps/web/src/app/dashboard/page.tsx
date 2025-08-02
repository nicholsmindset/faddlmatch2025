import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const { userId } = auth()

  if (!userId) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-green/5 to-islamic-gold/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
              <p className="text-neutral-600 mt-1">Welcome back to your matrimonial journey</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">New Matches</p>
                  <p className="text-2xl font-bold text-neutral-900">3</p>
                </div>
                <div className="w-12 h-12 bg-islamic-green/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-islamic-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Messages</p>
                  <p className="text-2xl font-bold text-neutral-900">2</p>
                </div>
                <div className="w-12 h-12 bg-islamic-gold/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-islamic-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Profile Views</p>
                  <p className="text-2xl font-bold text-neutral-900">12</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-neutral-900">85%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Daily Matches */}
              <div className="bg-white rounded-xl p-6 border border-neutral-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Today's Matches</h2>
                  <a href="/matches" className="text-islamic-green hover:text-islamic-green/80 transition-colors">
                    View All
                  </a>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="w-16 h-16 bg-neutral-200 rounded-full"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">Sister Fatima</h3>
                        <p className="text-sm text-neutral-600">32 years • Central Singapore • Malay</p>
                        <p className="text-sm text-islamic-green font-medium">95% compatibility</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-islamic-green text-white rounded-lg hover:bg-islamic-green/90 transition-colors">
                          Interest
                        </button>
                        <button className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                          Pass
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 border border-neutral-100">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Recent Activity</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-islamic-green rounded-full mt-2"></div>
                    <div>
                      <p className="text-neutral-900">New match with Sister Aisha</p>
                      <p className="text-sm text-neutral-600">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-islamic-gold rounded-full mt-2"></div>
                    <div>
                      <p className="text-neutral-900">Message from Brother Ahmad</p>
                      <p className="text-sm text-neutral-600">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-neutral-900">Profile viewed by 3 people</p>
                      <p className="text-sm text-neutral-600">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Islamic Quote */}
              <div className="bg-gradient-to-br from-islamic-green/10 to-islamic-gold/10 rounded-xl p-6 border border-neutral-100">
                <h3 className="font-semibold text-neutral-900 mb-3">Daily Reminder</h3>
                <p className="text-neutral-700 italic text-sm leading-relaxed">
                  "And among His signs is that He created for you mates from among yourselves, 
                  that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
                </p>
                <p className="text-xs text-neutral-600 mt-3">- Quran 30:21</p>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 border border-neutral-100">
                <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <a href="/profile/edit" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-neutral-900">Edit Profile</span>
                  </a>
                  
                  <a href="/matches/search" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-neutral-900">Search Matches</span>
                  </a>
                  
                  <a href="/messages" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-neutral-900">Messages</span>
                  </a>
                  
                  <a href="/settings" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-neutral-900">Settings</span>
                  </a>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-white rounded-xl p-6 border border-neutral-100">
                <h3 className="font-semibold text-neutral-900 mb-4">Complete Your Profile</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Profile Progress</span>
                    <span className="text-sm font-semibold text-islamic-green">85%</span>
                  </div>
                  
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-islamic-green h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  
                  <div className="text-xs text-neutral-600 space-y-1">
                    <p>✓ Basic information complete</p>
                    <p>✓ Photos uploaded</p>
                    <p>! Add more about your preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}