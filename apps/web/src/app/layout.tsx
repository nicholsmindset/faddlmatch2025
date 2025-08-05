import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FADDLmatch - Find Your Halal Life Partner | Islamic Matrimonial Platform Singapore',
  description: 'A trusted matrimonial platform for divorced and widowed Muslims in Singapore - facilitating meaningful marriage with a clear commitment to Islamic values.',
  keywords: 'halal marriage, islamic matrimonial, muslim marriage singapore, divorced muslim remarriage, widowed muslim marriage, islamic values, halal relationships',
  openGraph: {
    title: 'FADDLmatch - Find Your Halal Life Partner',
    description: 'A trusted matrimonial platform for divorced and widowed Muslims seeking meaningful marriage.',
    url: 'https://faddlmatch.com',
    siteName: 'FADDLmatch',
    locale: 'en_SG',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}