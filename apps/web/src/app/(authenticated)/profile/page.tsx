import { Metadata } from 'next'
import { ProfileEditor } from './components/ProfileEditor'

export const metadata: Metadata = {
  title: 'Profile Settings - FADDL Match',
  description: 'Edit your matrimonial profile'
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Profile Settings</h1>
          <p className="text-neutral-600 mt-1">Update your information to find better matches</p>
        </div>
        
        <ProfileEditor />
      </div>
    </div>
  )
}