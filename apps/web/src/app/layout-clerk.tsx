import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { clerkConfig } from '@/lib/clerk/config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FADDL Match - Halal Marriage Platform',
  description: 'A respectful matrimonial platform for divorced and widowed Muslims seeking meaningful remarriage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={clerkConfig.appearance}
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}