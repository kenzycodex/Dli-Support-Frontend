// app/layout.tsx
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClientProviderWrapper } from "@/providers/query-client-provider"
import { Toaster } from "sonner"
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
        <QueryClientProviderWrapper>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    color: '#374151',
                  },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  )
}