'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  CheckCircle,
  ArrowRight,
  Settings,
  Search,
  User,
  Shield
} from 'lucide-react'

export function DashboardContent() {
  const { user } = useUser()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Assalamu Alaikum, {user?.firstName || 'Sister/Brother'}
            </h1>
            <p className="text-neutral-600 mt-1">
              Welcome back to your matrimonial journey
            </p>
          </div>
          
          <Link href="/profile">
            <Button variant="primary" className="gap-2">
              <Settings className="h-4 w-4" />
              Complete Profile
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/matches">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">New Matches</p>
                  <p className="text-2xl font-bold text-neutral-900">5</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/messages">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Messages</p>
                  <p className="text-2xl font-bold text-neutral-900">2</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl p-6 border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Profile Views</p>
                <p className="text-2xl font-bold text-neutral-900">12</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <Link href="/profile">
            <div className="bg-white rounded-xl p-6 border border-neutral-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-neutral-900">85%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <p className="text-neutral-600">No recent activity to show.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl p-6 border border-neutral-100">
              <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/search" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Search className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Search Matches</span>
                </Link>
                <Link href="/guardian" className="flex items-center space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-neutral-600" />
                  <span className="text-neutral-900">Guardian</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
