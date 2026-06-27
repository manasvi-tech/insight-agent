import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "insight-agent",
  description: "Knowledge base assistant",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className="bg-[#F7F5F3] antialiased">
        {children}
      </body>
    </html>
  )
}