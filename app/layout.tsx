// app/layout.tsx
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from "@/contexts/AuthContext"
import './globals.css'

export const metadata: Metadata = {
  title: 'Student Support Hub',
  description: 'Your wellbeing is our priority',
  icons: {
    icon: '/favicon.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
