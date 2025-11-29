import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { cn } from "@/lib/utils"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Symplepass - Plataforma de Eventos Esportivos",
  description: "Encontre e participe de eventos esportivos. Inscrições simplificadas para corridas, triatlos e mais.",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF7A00",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn(GeistSans.variable, "font-sans")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
