import { Context } from "@netlify/edge-functions"

export default async (request: Request, context: Context) => {
  // Add geolocation headers if available
  const geo = context.geo
  
  if (geo) {
    const headers = new Headers(request.headers)
    headers.set('X-User-Country', geo.country?.code || 'SG')
    headers.set('X-User-City', geo.city || 'Singapore')
    
    const newRequest = new Request(request, { headers })
    return context.next(newRequest)
  }
  
  return context.next()
}

export const config = {
  path: "/*"
}
