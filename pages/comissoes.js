import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'

// Importa o gráfico dinamicamente para evitar problemas de compilação no Next.js
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false })

export default function Comissoes() {
  const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [dadosGrafico, setDadosGrafico] = useState(Array(12).fill(0))
  const [totalAno, setTotalAno] = useState(0)
  const [chartPronto, setChartPronto] = useState(false)

  useEffect(() => {
    // Registra os componentes apenas no navegador
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

    async function carregarComissoes() {
      const anoAtual = new Date().getFullYear()
      
      const { data } = await supabase
        .from('propostas')
        .select('valor_calculado, comissao_valor, criado_em')
        .eq('status', 'Aprovada')

      if (data) {
        const valoresMeses = Array(12).fill(0)
        let somaTotal = 0

        data.forEach(item => {
          // Se houver valor cadastrado usa ele, senão calcula uma estimativa padrão de 15%
          const comissao = item.comissao_valor > 0 ? parseFloat(item.comissao_valor) : parseFloat(item.valor_calculado || 0) * 0.15
          
          const dataCriacao = new Date(item.criado_em)
          if (dataCriacao.getFullYear() === anoAtual) {
            const mes = dataCriacao.getMonth() 
            valoresMeses[mes] += comissao
            somaTotal += comissao
          }
        })

        setDadosGrafico(valoresMeses)
        setTotalAno(somaTotal)
      }
    }

    carregarComissoes()
  }, [])

  const data = {
    labels: mesesLabels,
    datasets: [
      {
        label: 'Comissões Ganhas por Mês (R$)',
        data: dadosGrafico,
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Ganhos Mensais de Comissão - Ano ${new Date().getFullYear()}`, font: { size: 16 } },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>📈 Histórico de Comissões e Produção</h1>
      
      <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '30px' }}>
        <h3 style={{ margin: 0, color: '#1e40af' }}>Total Acumulado Neste Ano</h3>
        <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#1d4ed8' }}>
          R$ {totalAno.toFixed(2).replace('.', ',')}
        </p>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minHeight: '300px' }}>
        {chartPronto ? <Bar data={data} options={options} /> : <p>Carregando gráfico...</p>}
      </div>
    </div>
  )
}
