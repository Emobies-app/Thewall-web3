export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
app/page.tsx → edit → replace with:
export default function Home() {
  return (
    <main>
      <h1>⬡ THE WALL</h1>
    </main>
  )
}
