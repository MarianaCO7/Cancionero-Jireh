import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JirehSelah - Cancionero',
  description: 'Cancionero inteligente para la congregación Jireh',
  manifest: '/manifest.json',
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
        <nav className="bg-indigo-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              🎵 JirehSelah
            </Link>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-indigo-200 transition">
                Canciones
              </Link>
              <Link href="/setlists" className="hover:text-indigo-200 transition">
                Setlists
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
