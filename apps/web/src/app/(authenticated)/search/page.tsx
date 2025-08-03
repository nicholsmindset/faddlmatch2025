import { Metadata } from 'next'
import { SearchInterface } from './components/SearchInterface'

export const metadata: Metadata = {
  title: 'Search Matches - FADDL Match',
  description: 'Find your ideal marriage partner'
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Search Matches</h1>
        <p className="text-neutral-600 mt-1">Find your ideal marriage partner with advanced filters</p>
      </div>
      
      <SearchInterface />
    </div>
  )
}