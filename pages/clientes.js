'use client';

import { useEffect, useState } from 'react';
import { listarClientesCompleto, anexarApolice } from '../lib/segurosService';
import { supabase } from '../lib/supabaseClient';

export default function ListaClientes() {
  const [clientes, setClientes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [statusUpload, setStatusUpload] = useState({});
  const [clienteEdicao, setClienteEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function atualizarLista() {
    try {
      const res = await listarClientesCompleto();
      setClientes(res || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    atualizarLista();
  }, []);

  function abrirEdicao(cliente) {
    setClienteEdicao({ ...cliente });
  }

  async function salvarDadosEditados(e) {
    e.preventDefault();
    setSalvandoEdicao(true);

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: clienteEdicao.nome,
          cpf_cnpj: clienteEdicao.cpf_cnpj,
          telefone: clienteEdicao.telefone,
          email: clienteEdicao.email,
        })
        .eq('id', clienteEdicao.id);

      if (error) throw error;

      alert('Dados do cliente atualizados com sucesso!');
      setClienteEdicao(null);
      await atualizarLista();
    } catch (error) {
      alert(`Erro ao salvar edições: ${error.message}`);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleUploadTardio(e, apoliceId, clienteId) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;

    setStatusUpload(prev => ({ ...prev, [clienteId]: 'Enviando...' }));

    try {
      let idDaApolice = apoliceId;

      if (!idDaApolice) {
        const { data: novaApolice, error } = await supabase
          .from('apolices')
          .insert([{ 
            cliente_id: clienteId, 
            status_funil: 'Apólice Ativa', 
            premio_total: 0, 
            porcentagem_comissao: 0 
          }])
          .select()
          .single();
        
        if (error) throw error;
        idDaApolice = novaApolice.id;
      }

      const resultado = await anexarApolice(arquivos, idDaApolice);
      
      if (resultado.success) {
        setStatusUpload(prev => ({ ...prev, [clienteId]: '✅ Sucesso!' }));
        await atualizarLista();
      } else {
        alert(`Falha no upload: ${resultado.message}`);
        setStatusUpload(prev => ({ ...prev, [clienteId]: '' }));
      }
    } catch (error) {
      alert(`Erro no sistema: ${error.message}`);
      setStatusUpload(prev => ({ ...prev, [clienteId]: '' }));
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>👤 Clientes Cadastrados</h1>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← Voltar ao Painel</a>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {carregando || clientes === null ? (
          <p style={{ color: '#0070f3', textAlign: 'center', fontWeight: 'bold' }}>🔄 Carregando listagem de clientes...</p>
        ) : clientes.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>Nenhum cliente localizado no banco de dados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', color: '#666' }}>
                <th style={{ padding: '12px' }}>Nome</th>
                <th style={{ padding: '12px' }}>CPF / CNPJ</th>
                <th style={{ padding: '12px' }}>Contato</th>
                <th style={{ padding: '12px' }}>Veículo</th>
                <th style={{ padding: '12px' }}>Origem</th>
                <th style={{ padding: '12px' }}>Ações de Cadastro</th>
                <th style={{ padding: '12px' }}>Apólice</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const carro = Array.isArray(c.veiculos) ? c.veiculos : c.veiculos;
                let apolice = null;
                if (c.apolices) {
                  if (Array.isArray(c.apolices) && c.apolices.length > 0) {
                    apolice = c.apolices[0];
                  } else if (!Array.isArray(c.apolices)) {
                    apolice = c.apolices;
                  }
                }

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{c.nome}</td>
                    <td style={{ padding: '12px', color: '#555', fontFamily: 'monospace' }}>{c.cpf_cnpj}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>
                      📞 {c.telefone || 'Não informado'}<br />
                      ✉️ {c.email || 'Não informado'}
                    </td>
                    <td style={{ padding: '12px', color: '#0070f3', fontWeight: '500' }}>
                      🚗 {carro?.marca_modelo || 'Nenhum carro vinculado'}<br />
                      <span style={{ fontSize: '12px', color: '#666' }}>Placa: {carro?.placa || '-'}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                        {c.origem_lead || 'Direto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => abrirEdicao(c)}
                        style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        ✏️ Editar Dados
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {apolice?.url_pdf_apolice ? (
                        <a 
                          href={apolice.url_pdf_apolice} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ background: '#0070f3', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}
                        >
                          📄 Ver PDF
                        </a>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>📎 Anexar:</label>
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            onChange={(e) => handleUploadTardio(e, apolice?.id, c.id)}
                            style={{ fontSize: '12px', maxWidth: '150px' }}
                          />
                          {statusUpload[c.id] && (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff9800' }}>
                              {statusUpload[c.id]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '450px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>📝 Editar Informações do Segurado</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Nome:</label>
              <input type="text" value={clienteEdicao.nome || ''} onChange={(e) => setClienteEdicao(prev => ({ ...prev, nome: e.target.value }))} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>CPF / CNPJ:</label>
              <input type="text" value={clienteEdicao.cpf_cnpj || ''} onChange={(e) => setClienteEdicao(prev => ({ ...prev, cpf_cnpj: e.target.value }))} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Telefone:</label>
              <input type="text" value={clienteEdicao.telefone || ''} onChange={(e) => setClienteEdicao(prev => ({ ...prev, telefone: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

