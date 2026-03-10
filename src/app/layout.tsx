import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'BareUptime Status',
  description: 'Public status page for uptime monitoring',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider defaultTheme="system" storageKey="status-page-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
