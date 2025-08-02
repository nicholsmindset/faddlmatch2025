import { Suspense } from 'react'
import { Metadata } from 'next'
import { MatchesView } from './components/MatchesView'
import { MatchesFilters } from './components/MatchesFilters'
import { MatchesSkeleton } from './components/MatchesSkeleton'

export const metadata: Metadata = {
  title: 'Your Matches - FADDL Match',
  description: 'Discover compatible Muslim partners for marriage'
}

export default async function MatchesPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Your Matches
              </h1>
              <p className="text-sm text-neutral-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <MatchesFilters />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<MatchesSkeleton />}>
          <MatchesView />
        </Suspense>
      </main>
    </div>
  )
}