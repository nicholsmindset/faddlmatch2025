export function MatchesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter Bar Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-neutral-200 rounded animate-pulse"></div>
      </div>
      
      {/* Matches Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Profile Image Skeleton */}
            <div className="h-48 bg-neutral-200 animate-pulse"></div>
            
            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              {/* Name and Age */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-neutral-200 rounded-full animate-pulse"></div>
              </div>
              
              {/* Location */}
              <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse"></div>
              
              {/* Bio */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
              
              {/* Tags */}
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-neutral-200 rounded-full animate-pulse"></div>
                <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse"></div>
                <div className="h-6 w-12 bg-neutral-200 rounded-full animate-pulse"></div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <div className="h-9 flex-1 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-9 flex-1 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More Button Skeleton */}
      <div className="flex justify-center pt-6">
        <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}