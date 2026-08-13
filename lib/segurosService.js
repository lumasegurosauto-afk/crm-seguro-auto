'use client';

import { useEffect, useState } from 'react';
import { 
  buscarContadoresDashboard, 
  buscarRenovacoesProximas, 
  buscarParcelasFinanceiro 
} from '../lib/segurosService';

export default function Dashboard() {
  const [contadores, setContadores] = useState({ totalClientes: 0, totalPropostas: 0 });
  const [renovacoes, setRenovacoes] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resContadores, resRenovacoes, resParcelas] = await Promise.all([
          buscarContadoresDashboard(),
          buscarRenovacoesProximas(),
          buscarParcelasFinanceiro()
        ]);
        
        setContadores(resContadores);
        setRenovacoes(resRenovacoes);
        setParcelas(resParcelas);
      } catch (error) {
        console.error("Erro ao carregar dados do CRM:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  if (carregando) return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando dados do CRM...</div>;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Painel de Controle - Luma Seguros Auto</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #0070f3' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Quantidade de Clientes</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#0070f3' }}>{contadores.totalClientes}</p>
        </div>
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #ff9800' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Propostas em Cotação</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#ff9800' }}>{contadores.totalPropostas}</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '20px' }}>⏳ Alertas de Renovações (Próximos 30 Dias)</h2>
        {renovacoes.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma apólice vencendo nos próximos 30 dias.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Cliente</th>
                <th style={{ padding: '10px' }}>Veículo / Placa</th>
                <th style={{ padding: '10px' }}>Vencimento</th>
                <th style={{ padding: '10px' }}>Prêmio Total</th>
              </tr>
            </thead>
            <tbody>
              {renovacoes.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: '#fff9e6' }}>
                  <td style={{ padding: '10px' }}>{item.clientes?.nome}</td>
                  <td style={{ padding: '10px' }}>{item.veiculos?.marca_modelo} ({item.veiculos?.placa})</td>
                  <td style={{ padding: '10px', color: '#d32f2f', fontWeight: 'bold' }}>
                    {new Date(item.data_fim_vigencia).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '10px' }}>R$ {Number(item.premio_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '20px' }}>💳 Controle Financeiro (Parcelas em Aberto)</h2>
        {parcelas.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhuma parcela pendente ou em atraso.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Cliente</th>
                <th style={{ padding: '10px' }}>Nº Parcela</th>
                <th style={{ padding: '10px' }}>Valor</th>
                <th style={{ padding: '10px' }}>Vencimento</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{p.apolices?.clientes?.nome}</td>
                  <td style={{ padding: '10px' }}>{p.numero_parcela}ª Parcela</td>
                  <td style={{ padding: '10px' }}>R$ {Number(p.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '10px' }}>{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: p.status_pagamento === 'Atrasado' ? '#ffebee' : '#fff3e0', color: p.status_pagamento === 'Atrasado' ? '#c62828' : '#ef6c00' }}>
                      {p.status_pagamento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
