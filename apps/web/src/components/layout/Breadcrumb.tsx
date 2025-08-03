'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  matches: 'Matches',
  messages: 'Messages',
  search: 'Search',
  guardian: 'Guardian',
  profile: 'Profile',
  settings: 'Settings',
  onboarding: 'Onboarding',
  subscription: 'Subscription',
  success: 'Success',
  // Add more route mappings as needed
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  // Don't show breadcrumbs on homepage or sign-in pages
  if (pathname === '/' || pathname.includes('/sign-')) {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)
  
  // Don't show breadcrumbs if we're at root authenticated route
  if (segments.length <= 1) {
    return null
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-4 h-4" />
    }
  ]

  // Build breadcrumb items from path segments
  let currentPath = ''
  segments.forEach((segment, index) => {
    // Skip the first segment if it's just the base authenticated route
    if (index === 0 && segment === 'dashboard') {
      return
    }
    
    currentPath += `/${segment}`
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    breadcrumbItems.push({
      label,
      href: currentPath
    })
  })

  return (
    <nav className="bg-white border-b border-neutral-200 px-4 py-3">
      <div className="container mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
              )}
              
              {index === breadcrumbItems.length - 1 ? (
                // Current page - not a link
                <span className={cn(
                  "flex items-center space-x-1 font-medium text-neutral-900",
                  index === 0 && "text-green-700"
                )}>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              ) : (
                // Clickable breadcrumb
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 text-neutral-600 hover:text-green-700 transition-colors",
                    index === 0 && "text-green-600 hover:text-green-700 font-medium"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}

export default Breadcrumb