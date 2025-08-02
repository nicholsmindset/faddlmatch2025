import { Context } from "@netlify/edge-functions"

interface BetaTestingConfig {
  enabled: boolean
  allowedUsers: string[]
  allowedDomains: string[]
  maxBetaUsers: number
  features: string[]
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  
  // Only apply to beta routes and features
  if (!url.pathname.startsWith('/beta') && !isBetaFeature(url.pathname)) {
    return context.next()
  }
  
  const betaConfig = await getBetaConfig()
  
  if (!betaConfig.enabled) {
    return new Response(JSON.stringify({
      error: 'Beta testing is currently disabled',
      message: 'Please check back later or contact support@faddlmatch.com'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '3600'
      }
    })
  }
  
  // Extract user information
  const userId = request.headers.get('X-User-ID')
  const userEmail = request.headers.get('X-User-Email')
  const clientIP = context.ip
  
  // Check if user is allowed in beta
  const isAllowed = await checkBetaAccess(userId, userEmail, clientIP, betaConfig)
  
  if (!isAllowed.allowed) {
    return new Response(JSON.stringify({
      error: 'Beta access not granted',
      message: isAllowed.reason,
      waitlist: 'Join our beta waitlist at https://faddlmatch.com/beta-waitlist'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Beta-Status': 'denied'
      }
    })
  }
  
  // Log beta usage for analytics
  await logBetaUsage(userId, userEmail, url.pathname, clientIP)
  
  // Add beta context headers
  const newHeaders = new Headers(request.headers)
  newHeaders.set('X-Beta-User', 'true')
  newHeaders.set('X-Beta-Features', betaConfig.features.join(','))
  newHeaders.set('X-Beta-Session', generateBetaSessionId())
  
  const newRequest = new Request(request, { headers: newHeaders })
  return context.next(newRequest)
}

function isBetaFeature(pathname: string): boolean {
  const betaFeatures = [
    '/matches/ai-enhanced',
    '/messaging/video-call',
    '/profile/compatibility-ai',
    '/guardian/dashboard-v2',
    '/islamic/prayer-tracker',
    '/community/events-beta'
  ]
  
  return betaFeatures.some(feature => pathname.startsWith(feature))
}

async function getBetaConfig(): Promise<BetaTestingConfig> {
  // In production, this would come from a database or config service
  // For now, using environment variables and defaults
  const envConfig = Deno.env.get('BETA_CONFIG')
  
  if (envConfig) {
    try {
      return JSON.parse(envConfig)
    } catch (error) {
      console.error('Error parsing BETA_CONFIG:', error)
    }
  }
  
  // Default beta configuration for family testing
  return {
    enabled: true,
    allowedUsers: [
      // Add specific beta tester user IDs here
    ],
    allowedDomains: [
      'faddlmatch.com',
      'gmail.com', // For Muslim family beta testers
      'outlook.com',
      'yahoo.com'
    ],
    maxBetaUsers: 100, // Limit for controlled testing
    features: [
      'ai-matching',
      'video-calling',
      'guardian-oversight',
      'islamic-calendar',
      'prayer-reminders',
      'family-tree',
      'compatibility-scoring'
    ]
  }
}

async function checkBetaAccess(
  userId: string | null,
  userEmail: string | null,
  clientIP: string,
  config: BetaTestingConfig
): Promise<{ allowed: boolean; reason: string }> {
  
  // Check if user is explicitly allowed
  if (userId && config.allowedUsers.includes(userId)) {
    return { allowed: true, reason: 'Explicit user access' }
  }
  
  // Check domain allowlist for family testing
  if (userEmail) {
    const domain = userEmail.split('@')[1]?.toLowerCase()
    if (domain && config.allowedDomains.includes(domain)) {
      
      // Additional checks for email-based access
      const betaUserCount = await getCurrentBetaUserCount()
      if (betaUserCount >= config.maxBetaUsers) {
        return { 
          allowed: false, 
          reason: 'Beta testing capacity reached. You have been added to the waitlist.' 
        }
      }
      
      return { allowed: true, reason: 'Domain-based family access' }
    }
  }
  
  // Check for internal testing (company IPs, etc.)
  if (await isInternalTester(clientIP)) {
    return { allowed: true, reason: 'Internal testing access' }
  }
  
  return { 
    allowed: false, 
    reason: 'Beta access is currently limited to invited families. Please join our waitlist.' 
  }
}

async function getCurrentBetaUserCount(): Promise<number> {
  try {
    // This would typically query your database for current beta user count
    // For now, return a mock count
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return 0
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/beta_users?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    })
    
    if (response.ok) {
      const countHeader = response.headers.get('Content-Range')
      if (countHeader) {
        const count = parseInt(countHeader.split('/')[1] || '0')
        return count
      }
    }
    
    return 0
  } catch (error) {
    console.error('Error getting beta user count:', error)
    return 0
  }
}

async function isInternalTester(clientIP: string): Promise<boolean> {
  // Define internal/company IP ranges for testing
  const internalIPs = [
    '127.0.0.1',
    '::1'
  ]
  
  // Add company office IP ranges here
  const companyIPRanges = Deno.env.get('COMPANY_IP_RANGES')?.split(',') || []
  
  return internalIPs.includes(clientIP) || 
         companyIPRanges.some(range => clientIP.startsWith(range.trim()))
}

async function logBetaUsage(
  userId: string | null,
  userEmail: string | null,
  pathname: string,
  clientIP: string
): Promise<void> {
  try {
    const logData = {
      user_id: userId,
      user_email: userEmail,
      pathname,
      client_ip: clientIP,
      timestamp: new Date().toISOString(),
      user_agent: 'EdgeFunction', // Would get from request headers in real implementation
      session_id: generateBetaSessionId()
    }
    
    // Log to Supabase analytics table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/beta_analytics`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(logData)
      })
    }
    
    // Also log to external analytics if configured
    const analyticsEndpoint = Deno.env.get('BETA_ANALYTICS_ENDPOINT')
    if (analyticsEndpoint) {
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      })
    }
    
  } catch (error) {
    console.error('Error logging beta usage:', error)
  }
}

function generateBetaSessionId(): string {
  return `beta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}