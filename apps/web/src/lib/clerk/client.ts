import { createClerkClient } from '@clerk/nextjs/server'

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  // Additional options for server-side
  apiUrl: process.env.CLERK_API_URL,
  apiVersion: 'v1',
  httpOptions: {
    timeout: 10000,
    retry: {
      attempts: 3,
      delay: 100
    }
  }
})