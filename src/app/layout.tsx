import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'TickOS Client - Support Desk for Developers',
  description: 'Open-source ticket inbox powered by TickOS API. Deploy your own support desk in seconds.',
  keywords: ['ticketing system', 'support desk', 'API', 'developers', 'customer support', 'open source'],
  authors: [{ name: 'TickOS' }],
  openGraph: {
    title: 'TickOS Client - Support Desk for Developers',
    description: 'Open-source ticket inbox powered by TickOS API. Deploy your own support desk in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${GeistMono.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
