import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FADDL Match - Islamic Matrimonial Platform',
  description: 'A respectful, Islamic matrimonial platform designed for divorced and widowed Muslims seeking meaningful remarriage with family involvement and Islamic values at the center.',
  keywords: 'Islamic matrimony, Muslim marriage, halal dating, Islamic values, remarriage, Singapore Muslim',
  authors: [{ name: 'FADDL Match Team' }],
  openGraph: {
    title: 'FADDL Match - Find Your Halal Life Partner',
    description: 'Respectful Islamic matrimonial platform for divorced and widowed Muslims in Singapore',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FADDL Match - Islamic Matrimonial Platform',
    description: 'Find your halal life partner through our respectful Islamic matrimonial platform',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}