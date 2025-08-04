import { Context } from "@netlify/edge-functions"

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  
  // Skip auth check for public routes and static files
  const publicRoutes = ['/', '/auth', '/api', '/_next', '/favicon.ico', '/sign-in', '/sign-up', '.js', '.css', '.png', '.jpg', '.svg']
  const isPublicRoute = publicRoutes.some(route => url.pathname.includes(route))
  
  if (isPublicRoute) {
    return context.next()
  }
  
  // For now, just pass through all requests
  // You can add authentication logic here later when environment variables are properly set
  return context.next()
}

export const config = {
  path: "/*"
}
