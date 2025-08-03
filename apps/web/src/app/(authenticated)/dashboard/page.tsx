import { Metadata } from 'next'
import { DashboardContent } from './components/DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard - FADDL Match',
  description: 'Your matrimonial journey dashboard'
}

export default function DashboardPage() {
  return <DashboardContent />
}