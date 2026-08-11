export const metadata = {
  title: 'CRM Seguro Auto',
  description: 'Sistema de gestão de seguros',
}

export default function RootLayout({ children }) {
  return (
    <html lang='pt-BR'>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
