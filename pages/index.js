import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalPropostas, setTotalPropostas] = useState(0)
  const [renovacoes, setRenovacoes] = useState([])

  useEffect(() => {
    async function carregarDashboard() {
      // Conta quantidade total de clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
      setTotalClientes(clientesCount || 0)

      // Conta quantidade total de propostas/cálculos
      const { count: propostasCount } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
      setTotalPropostas(propostasCount || 0)

      // Busca apólices que vencem nos próximos 30 dias
      const hoje = new Date().toISOString().split('T')[0]
      const trintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('apolices')
        .select('*, clientes(nome)')
        .gte('fim_vigencia', hoje)
        .lte('fim_vigencia', trintaDias)
      
      setRenovacoes(data || [])
    }
    carregarDashboard()
  }, [])

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b' }}>📊 Painel do seu CRM de Seguro Auto</h1>
      
      {/* Cards de Métricas */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <div style={{ flex: 1, background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: 0, color: '#1e40af' }}>Quantidade de Clientes</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{totalClientes}</p>
        </div>
        <div style={{ flex: 1, background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: 0, color: '#92400e' }}>Cálculos e Propostas</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{totalPropostas}</p>
        </div>
      </div>

      {/* Lista de Renovações Alerta */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '30px' }}>
        <h2 style={{ color: '#dc2626', margin: '0 0 15px 0' }}>🚨 Próximas Renovações (Vencendo em até 30 dias)</h2>
        {renovacoes.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhuma apólice vencendo no momento.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px' }}>Cliente</th>
                <th>Seguradora</th>
                <th>Apólice Nº</th>
                <th>Data de Término</th>
              </tr>
            </thead>
            <tbody>
              {renovacoes.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{item.clientes?.nome}</td>
                  <td>{item.seguradora}</td>
                  <td>{item.numero_apolice}</td>
                  <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{new Date(item.fim_vigencia).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
