import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JirehSelah - Cancionero',
  description: 'Cancionero inteligente para la congregación Jireh con transposición, metrónomo y setlists',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JirehSelah'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={inter.className}>
        <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-3 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="text-lg md:text-xl font-bold flex-shrink-0">
              🎵 JirehSelah
            </Link>
            <div className="flex gap-2 md:gap-4 text-sm md:text-base flex-wrap justify-end">
              <Link href="/" className="hover:text-indigo-200 transition px-2 py-1 rounded">
                Canciones
              </Link>
              <Link href="/setlists" className="hover:text-indigo-200 transition px-2 py-1 rounded">
                Setlists
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-6 pb-20">
          {children}
        </main>
      </body>
    </html>
  )
}
