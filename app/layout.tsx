import type { Metadata, Viewport } from 'next'
import { Sora, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _sora = Sora({ subsets: ["latin"], weight: ["300", "400", "600", "700", "800"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"] })

export const metadata: Metadata = {
  title: 'Control de Atrasos - Liceo Bicentenario Industrial Ing. Ricardo Fenner Ruedi',
  description: 'Sistema de control de atrasos - Liceo Bicentenario Industrial Ingeniero Ricardo Fenner Ruedi - SNA Educa La Unión',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {children}
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111827',
              border: '1px solid #1e2d45',
              color: '#e8edf5',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
