import React, { useState, useEffect } from 'react';

export default function DashboardCRM() {
  // Simulando os dados que viriam do Supabase
  const [metricas, setMetricas] = useState({ totalPremios: 0, totalComissao: 0, leadsAtivos: 0 });
  const [fasesFunil, setFasesFunil] = useState([]);

  useEffect(() => {
    // Aqui o site calcula os valores para mostrar na tela
    const dadosFicticios = { totalPremios: 45000, totalComissao: 4500, leadsAtivos: 12 };
    const funil = [
      { nome: 'Cotação Solicitada', qtd: 5, cor: '#3B82F6' },
      { nome: 'Proposta Enviada', qtd: 4, cor: '#F59E0B' },
      { nome: 'Emitida/Ganha', qtd: 3, cor: '#10B981' }
    ];
    setMetricas(dadosFicticios);
    setFasesFunil(funil);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1F2937', margin: 0 }}>🚗 Meu CRM de Seguro Auto</h1>
        <p style={{ color: '#6B7280', margin: '5px 0 0 0' }}>Bem-vindo de volta! Aqui está o resumo da sua corretora:</p>
      </header>

      {/* Cartões com os números de Dinheiro */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>💰 Total em Prêmios</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '10px 0 0 0' }}>R$ {metricas.totalPremios.toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>📈 Minha Comissão Estimada</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', margin: '10px 0 0 0' }}>R$ {metricas.totalComissao.toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>👥 Leads Ativos no Funil</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6', margin: '10px 0 0 0' }}>{metricas.leadsAtivos} Clientes</p>
        </div>
      </div>

      {/* Desenho do Funil de Vendas */}
      <h2 style={{ color: '#374151', fontSize: '18px', marginBottom: '15px' }}>📊 Funil de Vendas (Acompanhamento)</h2>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {fasesFunil.map((fase, index) => (
          <div key={index} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: `6px solid ${fase.cor}`, flex: '1', minWidth: '180px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: 0, color: '#4B5563' }}>{fase.nome}</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#111827' }}>{fase.qtd} {fase.qtd === 1 ? 'cliente' : 'clientes'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
