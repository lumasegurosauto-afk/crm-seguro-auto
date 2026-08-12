'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardCRM() {
  const [clientes, setClientes] = useState([]);
  const [metricas, setMetricas] = useState({ totalPremios: 0, totalComissao: 0, renovacoesTrintaDias: 0 });
  const [carregando, setCarregando] = useState(true);
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [premio, setPremio] = useState('');
  const [comissao, setComissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  async function carregarDados() {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('apolices')
        .select('*, clientes(nome, cpf_cnpj), veiculos(marca_modelo)');
        
      if (error) throw error;

      if (data) {
        let premios = 0;
        let comissoes = 0;
        let alertasVencimento = 0;
        const hoje = new Date();

        data.forEach(ap => {
          premios += Number(ap.premio_total || 0);
          comissoes += Number(ap.valor_comissao_receber || 0);
          
          const fimVigencia = new Date(ap.data_fim_vigencia);
          const diferencaDias = Math.ceil((fimVigencia - hoje) / (1000 * 60 * 60 * 24));
          if (diferencaDias >= 0 && diferencaDias <= 30) {
            alertasVencimento++;
          }
        });

        setMetricas({ totalPremios: premios, totalComissao: comissoes, renovacoesTrintaDias: alertasVencimento });
        setClientes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      carregarDados();
    }
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const { data: novoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert([{ nome, cpf_cnpj: cpf }])
        .select()
        .single();
        
      if (errCliente) throw errCliente;

      const { data: novoVeiculo, error: errVeiculo } = await supabase
        .from('veiculos')
        .insert([{ cliente_id: novoCliente.id, marca_modelo: veiculo }])
        .select()
        .single();

      if (errVeiculo) throw errVeiculo;

      const dataInicio = new Date().toISOString().split('T')[0];
      const { error: errApolice } = await supabase
        .from('apolices')
        .insert([{
          cliente_id: novoCliente.id,
          veiculo_id: novoVeiculo.id,
          premio_total: parseFloat(premio),
          porcentagem_comissao: parseFloat(comissao),
          data_inicio_vigencia: dataInicio,
          data_fim_vigencia: dataVencimento
        }]);

      if (errApolice) throw errApolice;

      alert('Cliente e Apólice salvos com sucesso no Banco de Dados!');
      
      setNome(''); setCpf(''); setVeiculo(''); setPremio(''); setComissao(''); setDataVencimento('');
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1F2937', margin: 0 }}>🚗 Meu CRM de Seguro Auto</h1>
        <p style={{ color: '#6B7280', margin: '5px 0 0 0' }}>Painel Administrativo Conectado ao Banco de Dados</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>💰 Minha Carteira (Total Prêmios)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '10px 0 0 0' }}>R$ {metricas.totalPremios.toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>📈 Minha Comissão Acumulada</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', margin: '10px 0 0 0' }}>R$ {metricas.totalComissao.toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: '1', minWidth: '200px' }}>
          <h3 style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>⏰ Alertas de Renovação (30 dias)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444', margin: '10px 0 0 0' }}>{metricas.renovacoesTrintaDias} Clientes</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', flex: '1', minWidth: '320px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#374151' }}>📝 Cadastrar Nova Apólice</h2>
          <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder='Nome do Cliente' value={nome} onChange={e => setNome(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            <input placeholder='CPF ou CNPJ' value={cpf} onChange={e => setCpf(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            <input placeholder='Veículo (Marca/Modelo/Ano)' value={veiculo} onChange={e => setVeiculo(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            <input placeholder='Prêmio Total (R$)' type='number' value={premio} onChange={e => setPremio(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            <input placeholder='Comissão (%)' type='number' value={comissao} onChange={e => setComissao(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280' }}>Data Final de Vigência (Vencimento):</label>
              <input type='date' value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D1D5DB' }} />
            </div>
            <button type='submit' style={{ background: '#10B981', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar no Supabase</button>
          </form>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', flex: '2', minWidth: '320px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#374151' }}>📋 Clientes Cadastrados na Carteira</h2>
          {carregando ? (
            <p>Carregando dados do banco...</p>
          ) : clientes.length === 0 ? (
            <p style={{ color: '#9CA3AF' }}>Sua carteira está vazia. Digite os dados ao lado e clique em salvar para começar!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clientes.map((item, idx) => {
                const hoje = new Date();
                const fim = new Date(item.data_fim_vigencia);
                const diasRestantes = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
                const corAlerta = diasRestantes <= 30 ? '#EF4444' : '#10B981';

                return (
                  <div key={idx} style={{ padding: '15px', borderRadius: '8px', borderLeft: '6px solid ' + corAlerta, backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#1F2937' }}>{item.clientes?.nome}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>{item.veiculos?.marca_modelo} | CPF: {item.clientes?.cpf_cnpj}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Prêmio: R$ {Number(item.premio_total).toLocaleString('pt-BR')}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#10B981', fontWeight: 'bold' }}>Comissão: R$ {Number(item.valor_comissao_receber).toLocaleString('pt-BR')}</p>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: corAlerta, fontWeight: 'bold' }}>
                        {diasRestantes < 0 ? '❌ Vencido!' : `⏰ Vence em ${diasRestantes} dias`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
