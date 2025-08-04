import { Context } from "@netlify/edge-functions"

export default async (request: Request, context: Context) => {
  // Simple beta testing check - just pass through for now
  return context.next()
}

export const config = {
  path: "/beta/*"
}
