import Link from 'next/link'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* BARRA DE NAVEGAÇÃO SUPERIOR */}
      <nav style={{
        background: '#1e293b',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
          🛡️ CRM Seguro Auto
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>
            📊 Dashboard
          </Link>
          <Link href="/cadastro" style={{ color: '#fff', background: '#2563eb', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>
            ➕ Novo Cadastro
          </Link>
          <Link href="/clientes" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>
            👥 Clientes e Apólices
          </Link>
        </div>
      </nav>

      {/* CONTEÚDO DA PÁGINA ATUAL */}
      <main style={{ minHeight: 'calc(100vh - 60px)', background: '#f8fafc' }}>
        <Component {...pageProps} />
      </main>
    </>
  )
}
