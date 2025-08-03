import { Metadata } from 'next'
import { SettingsInterface } from './components/SettingsInterface'

export const metadata: Metadata = {
  title: 'Settings - FADDL Match',
  description: 'Manage your account settings and preferences'
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-1">Manage your account settings and preferences</p>
        </div>
        
        <SettingsInterface />
      </div>
    </div>
  )
}