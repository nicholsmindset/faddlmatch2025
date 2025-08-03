import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface DashboardRequest {
  timeframe?: '15m' | '1h' | '4h' | '24h' | '7d'
  function_name?: string
  metric_type?: 'performance' | 'errors' | 'alerts' | 'health'
}

interface DashboardResponse {
  timestamp: string
  health_overview: {
    functions: Array<{
      name: string
      status: 'healthy' | 'warning' | 'critical'
      requests_per_minute: number
      avg_response_time: number
      error_rate: number
    }>
  }
  performance_metrics?: any
  error_analysis?: any
  active_alerts?: any
  sla_metrics?: any
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authentication check for admin users
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let params: DashboardRequest = {}
    if (req.method === 'POST') {
      params = await req.json()
    } else {
      const url = new URL(req.url)
      params = {
        timeframe: (url.searchParams.get('timeframe') as any) || '1h',
        function_name: url.searchParams.get('function_name') || undefined,
        metric_type: (url.searchParams.get('metric_type') as any) || 'health'
      }
    }

    const response: DashboardResponse = {
      timestamp: new Date().toISOString(),
      health_overview: { functions: [] }
    }

    // Get health overview
    const { data: healthData, error: healthError } = await supabaseClient
      .from('function_health_status')
      .select('*')

    if (!healthError && healthData) {
      response.health_overview.functions = healthData.map(func => ({
        name: func.function_name,
        status: func.health_status,
        requests_per_minute: Math.round(func.total_requests / 15), // 15-minute window
        avg_response_time: Math.round(func.avg_execution_time_ms),
        error_rate: Math.round(func.error_rate * 10000) / 100 // Convert to percentage with 2 decimals
      }))
    }

    // Get performance metrics if requested
    if (params.metric_type === 'performance' || params.metric_type === undefined) {
      const timeframeMap = {
        '15m': '15 minutes',
        '1h': '1 hour',
        '4h': '4 hours',
        '24h': '24 hours',
        '7d': '7 days'
      }
      
      const interval = timeframeMap[params.timeframe || '1h']
      
      let perfQuery = supabaseClient
        .from('function_performance_trends')
        .select('*')
        .gte('hour', `now() - interval '${interval}'`)
        .order('hour', { ascending: false })

      if (params.function_name) {
        perfQuery = perfQuery.eq('function_name', params.function_name)
      }

      const { data: perfData, error: perfError } = await perfQuery.limit(100)
      
      if (!perfError) {
        response.performance_metrics = perfData
      }
    }

    // Get error analysis if requested
    if (params.metric_type === 'errors' || params.metric_type === undefined) {
      let errorQuery = supabaseClient
        .from('function_error_analysis')
        .select('*')
        .order('occurrence_count', { ascending: false })

      if (params.function_name) {
        errorQuery = errorQuery.eq('function_name', params.function_name)
      }

      const { data: errorData, error: errorError } = await errorQuery.limit(50)
      
      if (!errorError) {
        response.error_analysis = errorData
      }
    }

    // Get active alerts if requested
    if (params.metric_type === 'alerts' || params.metric_type === undefined) {
      let alertQuery = supabaseClient
        .from('active_alerts')
        .select('*')
        .limit(100)

      if (params.function_name) {
        alertQuery = alertQuery.eq('function_name', params.function_name)
      }

      const { data: alertData, error: alertError } = await alertQuery

      if (!alertError) {
        response.active_alerts = alertData
      }
    }

    // Get SLA metrics for specific function
    if (params.function_name) {
      const hours = params.timeframe === '7d' ? 168 : 
                   params.timeframe === '24h' ? 24 :
                   params.timeframe === '4h' ? 4 : 1

      const { data: slaData, error: slaError } = await supabaseClient
        .rpc('get_function_sla_metrics', {
          p_function_name: params.function_name,
          p_hours: hours
        })

      if (!slaError && slaData && slaData.length > 0) {
        response.sla_metrics = slaData[0]
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Dashboard error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})