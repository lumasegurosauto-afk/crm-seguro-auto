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

  // NOVO ESTADO: Armazena o link do PDF que será exibido no leitor interno
  const [pdfVisualizacao, setPdfVisualizacao] = useState(null);

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
    setClienteEdicao({
      id: cliente.id,
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj,
      telefone: cliente.telefone,
      email: cliente.email,
      veiculo_modelo: cliente.veiculos?.marca_modelo || '',
      veiculo_placa: cliente.veiculos?.placa || '',
      seguradora: cliente.apolices?.seguradora || '',
      numero_apolice: cliente.apolices?.numero_apolice || '',
      inicio_vigencia: cliente.apolices?.inicio_vigencia || '',
      fim_vigencia: cliente.apolices?.fim_vigencia || ''
    });
  }

  async function salvarDadosEditados(e) {
    e.preventDefault();
    setSalvandoEdicao(true);

    try {
      const { error: errCli } = await supabase
        .from('clientes')
        .update({
          nome: clienteEdicao.nome,
          cpf_cnpj: clienteEdicao.cpf_cnpj,
          telefone: clienteEdicao.telefone,
          email: clienteEdicao.email,
        })
        .eq('id', clienteEdicao.id);

      if (errCli) throw errCli;

      const { error: errProp } = await supabase
        .from('propostas')
        .update({
          veiculo_modelo: clienteEdicao.veiculo_modelo,
          veiculo_placa: clienteEdicao.veiculo_placa
        })
        .eq('cliente_id', clienteEdicao.id);

      if (errProp) throw errProp;

      const { error: errApol } = await supabase
        .from('apolices')
        .update({
          numero_apolice: clienteEdicao.numero_apolice,
          seguradora: clienteEdicao.seguradora,
          inicio_vigencia: clienteEdicao.inicio_vigencia,
          fim_vigencia: clienteEdicao.fim_vigencia
        })
        .eq('cliente_id', clienteEdicao.id);

      if (errApol) throw errApol;

      alert('🎉 Todas as informações do segurado foram atualizadas!');
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
            status_funil: 'Apólice Ativa'
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
        alert(`Falha: ${resultado.message}`);
        setStatusUpload(prev => ({ ...prev, [clienteId]: '' }));
      }
    } catch (error) {
      alert(`Erro: ${error.message}`);
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
                <th style={{ padding: '12px' }}>Ações</th>
                <th style={{ padding: '12px' }}>Apólice</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const carro = c.veiculos;
                let apolice = c.apolices;

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
                      <button 
                        onClick={() => abrirEdicao(c)}
                        style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        ✏️ Editar Dados
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {apolice?.url_pdf_apolice ? (
                        /* MODIFICAÇÃO: Botão que agora ativa o leitor interno embutido */
                        <button 
                          onClick={() => setPdfVisualizacao(apolice.url_pdf_apolice)}
                          style={{ background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}
                        >
                          👁️ Visualizar PDF
                        </button>
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

      {/* MODAL 1: Formulário de Edição */}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', textAlign: 'center' }}>📝 Editar Cadastro Completo do Segurado</h3>
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>👤 Informações Pessoais</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Nome: <input type="text" value={clienteEdicao.nome || ''} onChange={(e) => setClienteEdicao(prev => ({ ...prev, nome: e.target.value }))} required style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} /></label>
