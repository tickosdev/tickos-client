import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TickOS Client - The Ticket Operating System for Developers',
  description: 'Convert emails & forms into support tickets using API, SDK, or CLI. Build your own service desk without complexity.',
  keywords: ['ticketing system', 'support desk', 'API', 'developers', 'customer support'],
  authors: [{ name: 'TickOS' }],
  openGraph: {
    title: 'TickOS - The Ticket Operating System for Developers',
    description: 'Convert emails & forms into support tickets using API, SDK, or CLI.',
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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
