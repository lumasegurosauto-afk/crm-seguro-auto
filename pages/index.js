'use client';
import { useEffect, useState } from 'react';
import { listarClientesCompleto } from '../lib/segurosService';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [dadosMapeados, setDadosMapeados] = useState(Array(12).fill(0));
  const [totalSegurados, setTotalSegurados] = useState(0);
  const [faturamentoPremios, setFaturamentoPremios] = useState(0);
  const [faturamentoComissoes, setFaturamentoComissoes] = useState(0);
  const [alertasRenovacao, setAlertasRenovacao] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    async function verificarSessaoECarregar() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login'; return; }

      try {
        const clientes = await listarClientesCompleto();
        setTotalSegurados(clientes?.length || 0);

        let somaPremios = 0;
        let somaComissoes = 0;
        const contagemMeses = Array(12).fill(0);
        const listaAlertas = [];
        const hoje = new Date();
        const trintaDiasPraFrente = new Date();
        trintaDiasPraFrente.setDate(hoje.getDate() + 30);

        clientes.forEach(c => {
          // 1. Soma o faturamento se for uma proposta/apólice válida
          somaPremios += parseFloat(c.valor_calculado || 0);
          somaComissoes += parseFloat(c.comissao_valor || 0);

          // 2. Alimenta o gráfico mensal
          const dataVigencia = c.apolices?.inicio_vigencia || c.inicio_vigencia;
          if (dataVigencia && typeof dataVigencia === 'string') {
            const partes = dataVigencia.split('-');
            if (partes.length >= 2) {
              const mesNum = parseInt(partes[1], 10);
              const indexMes = mesNum - 1;
              if (indexMes >= 0 && indexMes <= 11) contagemMeses[indexMes] += 1;
            }
          }

          // 3. Filtra seguros vencendo nos próximos 30 dias para Alerta
          if (c.apolices?.fim_vigencia) {
            const fimVigencia = new Date(c.apolices.fim_vigencia);
            if (fimVigencia >= hoje && fimVigencia <= trintaDiasPraFrente) {
              listaAlertas.push({
                id: c.id,
                nome: c.nome,
                telefone: c.telefone || 'Sem telefone',
                veiculo: c.veiculos?.marca_modelo || 'Não informado',
                vencimento: c.apolices.fim_vigencia.split('-').reverse().join('/')
              });
            }
          }
        });

        setFaturamentoPremios(somaPremios);
        setFaturamentoComissoes(somaComissoes);
        setDadosMapeados(contagemMeses);
        setAlertasRenovacao(listaAlertas);
      } catch (err) { console.error(err); } finally { setCarregando(false); }
    }
    verificarSessaoECarregar();
  }, []);

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = '/login'; }
  const maiorVolume = Math.max(...dadosMapeados, 1);
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#333' }}>🚀 Painel de Controle CRM</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🔒 Sair</button>
      </div>

      {/* BLOCO DE CARDS INDICADORES */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minWidth: '220px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>📋 Carteira Ativa</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>{carregando ? '...' : totalSegurados} Clientes</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minWidth: '220px', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>💰 Total em Prêmios</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#10b981' }}>R$ {faturamentoPremios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minWidth: '220px', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>📈 Comissões Ganhas</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>R$ {faturamentoComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', margin: '25px 0' }}>
        <a href="/cadastro" style={{ padding: '12px 20px', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>📝 Novo Cadastro</a>
        <a href="/clientes" style={{ padding: '12px 20px', background: '#fff', color: '#0070f3', border: '1px solid #0070f3', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>👤 Ver Carteira</a>
      </div>

      {/* SEÇÃO DE AVISOS DE RENOVAÇÃO (PRÓXIMOS 30 DIAS) */}
      <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#ef4444' }}>⏰ Alertas de Renovação (Vencendo nos próximos 30 dias)</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0' }}>Lista de clientes com apólices perto do fim. Ligue para garantir a renovação.</p>
        {carregando ? <p>Carregando alertas...</p> : alertasRenovacao.length === 0 ? (
          <p style={{ color: '#059669', fontWeight: 'bold', margin: 0 }}>✅ Nenhuma apólice vencendo nos próximos 30 dias!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {alertasRenovacao.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{a.nome}</span>
                  <span style={{ fontSize: '13px', color: '#475569', marginLeft: '15px' }}>🚗 {a.veiculo}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', color: '#b91c1c', marginRight: '15px' }}>Vence em: {a.vencimento}</span>
                  <a href={`tel:${a.telefone.replace(/\D/g,'')}`} style={{ background: '#ef4444', color: '#fff', textDecoration: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>📞 Ligar: {a.telefone}</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRÁFICO OPERACIONAL */}
      <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>📊 Produção Mensal de Seguros</h3>
        {carregando ? <p>Calculando volumes...</p> : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', padding: '10px 20px', borderBottom: '2px solid #cbd5e1', background: '#f8fafc', borderRadius: '6px', marginTop: '15px' }}>
            {dadosMapeados.map((quantidade, index) => {
              const alturaBarra = (quantidade / maiorVolume) * 100;
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  {quantidade > 0 && <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>{quantidade}</span>}
                  <div style={{ width: '50%', height: `${alturaBarra || 4}%`, background: quantidade > 0 ? '#0070f3' : '#e2e8f0', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '6px' }}>{mesesNomes[index]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
