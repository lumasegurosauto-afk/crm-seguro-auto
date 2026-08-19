import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'

// Carrega o componente do gráfico sem renderização do lado do servidor para evitar conflito no Next.js
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false })

export default function Dashboard() {
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalPropostas, setTotalPropostas] = useState(0)
  const [renovacoes, setRenovacoes] = useState([])
  
  // Estados do Gráfico de Comissões
  const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [dadosGrafico, setDadosGrafico] = useState(Array(12).fill(0))
  const [totalAno, setTotalAno] = useState(0)
  const [chartPronto, setChartPronto] = useState(false)

  useEffect(() => {
    // Inicializa as dependências do Chart.js diretamente no navegador
    import('chart.js').then((ChartJSMod) => {
      ChartJSMod.Chart.register(
        ChartJSMod.CategoryScale,
        ChartJSMod.LinearScale,
        ChartJSMod.BarElement,
        ChartJSMod.Title,
        ChartJSMod.Tooltip,
        ChartJSMod.Legend
      )
      setChartPronto(true)
    })

    async function carregarDashboard() {
      // 1. Conta a quantidade de clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
      setTotalClientes(clientesCount || 0)

      // 2. Conta a quantidade de propostas/registros totais
      const { count: propostasCount } = await supabase
        .from('propostas')
        .select('*', { count: 'exact', head: true })
      setTotalPropostas(propostasCount || 0)

      // 3. Busca apólices vencendo nos próximos 30 dias para a lista de alertas
      const hoje = new Date().toISOString().split('T')[0]
      const trintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data: dadosApolices } = await supabase
        .from('apolices')
        .select('*, clientes(nome)')
        .gte('fim_vigencia', hoje)
        .lte('fim_vigencia', trintaDias)
      setRenovacoes(dadosApolices || [])

      // 4. CORREÇÃO DA BUSCA: Puxa todas as propostas para computar a comissão independente do status do texto
      const anoAtual = new Date().getFullYear()
      const { data: dadosPropostas } = await supabase
        .from('propostas')
        .select('valor_calculado, comissao_valor, criado_em')

      if (dadosPropostas) {
        const valoresMeses = Array(12).fill(0)
        let somaTotal = 0

        dadosPropostas.forEach(item => {
          // Captura o valor digitado no campo Comissão. Se estiver zerado, projeta uma margem de 15% do prêmio bruto
          const comissao = item.comissao_valor > 0 ? parseFloat(item.comissao_valor) : parseFloat(item.valor_calculado || 0) * 0.15
          
          const dataCriacao = new Date(item.criado_em)
          if (dataCriacao.getFullYear() === anoAtual) {
            const mes = dataCriacao.getMonth() // Retorna a posição do mês no array (Jan = 0, Fev = 1...)
            valoresMeses[mes] += comissao
            somaTotal += comissao
          }
        })

        setDadosGrafico(valoresMeses)
        setTotalAno(somaTotal)
      }
    }
    
    carregarDashboard()
  }, [])

  const chartData = {
    labels: mesesLabels,
    datasets: [
      {
        label: 'Comissões Faturadas (R$)',
        data: dadosGrafico,
        backgroundColor: '#10b981', // Barras na cor verde dinheiro
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b' }}>📊 Painel do seu CRM de Seguro Auto</h1>
      
      {/* Indicadores do Topo */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <div style={{ flex: 1, background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ margin: 0, color: '#1e40af' }}>Quantidade de Clientes</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{totalClientes}</p>
        </div>
        <div style={{ flex: 1, background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: 0, color: '#92400e' }}>Cálculos e Propostas</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{totalPropostas}</p>
        </div>
        <div style={{ flex: 1, background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <h3 style={{ margin: 0, color: '#065f46' }}>Comissões no Ano</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#047857' }}>
            R$ {totalAno.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Gráfico de Desempenho Mensal */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h2 style={{ color: '#1e293b', margin: '0 0 15px 0' }}>📈 Produção de Comissões por Mês</h2>
        <div style={{ height: '350px', position: 'relative' }}>
          {chartPronto ? <Bar data={chartData} options={chartOptions} /> : <p>Montando gráfico financeiro...</p>}
        </div>
      </div>

      {/* Tabela de Notificações de Vencimento */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#dc2626', margin: '0 0 15px 0' }}>🚨 Próximas Renovações (Até 30 dias)</h2>
        {renovacoes.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhuma apólice ou proposta vencendo nos próximos dias.</p>
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
