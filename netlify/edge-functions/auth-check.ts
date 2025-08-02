import { Context } from "@netlify/edge-functions"

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  
  // Skip auth check for public routes
  const publicRoutes = ['/auth', '/api/auth', '/api/geo', '/_next', '/favicon.ico']
  if (publicRoutes.some(route => url.pathname.startsWith(route))) {
    return context.next()
  }
  
  // Extract token from various sources
  const authHeader = request.headers.get('Authorization')
  const cookieHeader = request.headers.get('Cookie')
  
  let token = authHeader?.replace('Bearer ', '')
  
  // Try to get token from cookies if not in header
  if (!token && cookieHeader) {
    const cookies = parseCookies(cookieHeader)
    token = cookies['sb-access-token'] || cookies['supabase-auth-token']
  }
  
  if (!token) {
    // Redirect to login for dashboard routes
    if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/matches')) {
      return Response.redirect(new URL('/auth/login', request.url))
    }
    return context.next()
  }

  try {
    // Verify token with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://dvydbgjoagrzgpqdhqoq.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseKey) {
      console.error('Missing SUPABASE_ANON_KEY environment variable')
      return Response.redirect(new URL('/auth/login', request.url))
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    })

    if (!response.ok) {
      console.log('Auth verification failed:', response.status)
      return Response.redirect(new URL('/auth/login', request.url))
    }

    const user = await response.json()
    
    // Check if user profile is complete for matrimonial requirements
    const profileComplete = await checkProfileCompleteness(user.id, supabaseUrl, supabaseKey)
    
    // Add user context to request headers
    const newHeaders = new Headers(request.headers)
    newHeaders.set('X-User-ID', user.id)
    newHeaders.set('X-User-Email', user.email || '')
    newHeaders.set('X-User-Role', user.user_metadata?.role || 'user')
    newHeaders.set('X-Profile-Complete', profileComplete.toString())
    newHeaders.set('X-Islamic-Verification', user.user_metadata?.islamic_verified || 'false')
    newHeaders.set('X-Guardian-Approved', user.user_metadata?.guardian_approved || 'false')
    
    // Create new request with updated headers
    const newRequest = new Request(request, { headers: newHeaders })
    
    // Check if accessing restricted areas without proper verification
    if (url.pathname.startsWith('/matches') && !profileComplete) {
      return Response.redirect(new URL('/onboarding', request.url))
    }
    
    if (url.pathname.startsWith('/messaging') && !user.user_metadata?.islamic_verified) {
      return Response.redirect(new URL('/verification/islamic', request.url))
    }
    
    return context.next(newRequest)
    
  } catch (error) {
    console.error('Auth check error:', error)
    return Response.redirect(new URL('/auth/login', request.url))
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=')
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  })
  return cookies
}

async function checkProfileCompleteness(
  userId: string, 
  supabaseUrl: string, 
  supabaseKey: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      return false
    }
    
    const profiles = await response.json()
    const profile = profiles[0]
    
    if (!profile) {
      return false
    }
    
    // Check required fields for Islamic matrimonial profile
    const requiredFields = [
      'full_name',
      'age',
      'gender',
      'location',
      'education_level',
      'profession',
      'religious_practice_level',
      'prayer_frequency',
      'islamic_knowledge_level',
      'family_values',
      'marriage_timeline'
    ]
    
    const missingFields = requiredFields.filter(field => 
      !profile[field] || profile[field] === '' || profile[field] === null
    )
    
    // Profile is complete if no missing required fields and has photo
    return missingFields.length === 0 && profile.profile_photos && profile.profile_photos.length > 0
    
  } catch (error) {
    console.error('Profile completeness check error:', error)
    return false
  }
}