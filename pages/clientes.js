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
  const [pdfVisualizacao, setPdfVisualizacao] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  async function atualizarLista() {
    try { const res = await listarClientesCompleto(); setClientes(res || []); }
    catch (error) { setClientes([]); } finally { setCarregando(false); }
  }
  useEffect(() => { atualizarLista(); }, []);

  function abrirEdicao(c) {
    setClienteEdicao({
      id: c.id, nome: c.nome || '', cpf_cnpj: c.cpf_cnpj || '', telefone: c.telefone || '', email: c.email || '',
      veiculo_modelo: c.veiculos?.marca_modelo || '', veiculo_placa: c.veiculos?.placa || '',
      seguradora: c.apolices?.seguradora || '', numero_apolice: c.apolices?.numero_apolice || '',
      inicio_vigencia: c.apolices?.inicio_vigencia || '', fim_vigencia: c.apolices?.fim_vigencia || '',
      status: c.status || 'Cálculo', valor_calculado: c.valor_calculado || 0, comissao_valor: c.comissao_valor || 0
    });
  }

  async function handleExcluirCliente(id) {
    if (!window.confirm('⚠️ Deseja excluir permanentemente este segurado?')) return;
    try {
      await supabase.from('apolices').delete().eq('cliente_id', id);
      await supabase.from('propostas').delete().eq('cliente_id', id);
      await supabase.from('clientes').delete().eq('id', id);
      alert('🗑️ Registro removido!'); await atualizarLista(); setClienteSelecionado(null);
    } catch (err) { alert(err.message); }
  }

  async function salvarDadosEditados(e) {
    e.preventDefault(); setSalvandoEdicao(true);
    try {
      await supabase.from('clientes').update({ nome: clienteEdicao.nome, cpf_cnpj: clienteEdicao.cpf_cnpj, telefone: clienteEdicao.telefone, email: clienteEdicao.email }).eq('id', clienteEdicao.id);
      await supabase.from('propostas').update({ veiculo_modelo: clienteEdicao.veiculo_modelo, veiculo_placa: clienteEdicao.veiculo_placa, valor_calculado: parseFloat(clienteEdicao.valor_calculado), comissao_valor: parseFloat(clienteEdicao.comissao_valor), status: clienteEdicao.status }).eq('cliente_id', clienteEdicao.id);
      await supabase.from('apolices').update({ numero_apolice: clienteEdicao.numero_apolice, seguradora: clienteEdicao.seguradora, inicio_vigencia: clienteEdicao.inicio_vigencia, fim_vigencia: clienteEdicao.fim_vigencia }).eq('cliente_id', clienteEdicao.id);
      alert('🎉 CRM Atualizado com sucesso!'); setClienteEdicao(null); setClienteSelecionado(null); await atualizarLista();
    } catch (err) { alert(err.message); } finally { setSalvandoEdicao(false); }
  }

  async function handleUploadTardio(e, aId, cId) {
    const arquivos = e.target.files; if (!arquivos || arquivos.length === 0) return;
    setStatusUpload(prev => ({ ...prev, [cId]: 'Enviando...' }));
    try {
      let id = aId;
      if (!id) {
        const { data } = await supabase.from('apolices').insert([{ cliente_id: cId, status_funil: 'Apólice Ativa' }]).select().single();
        id = data.id;
      }
      const res = await anexarApolice(arquivos, id);
      if (res.success) { alert('🚀 PDF anexado com sucesso!'); await atualizarLista(); } else { alert(res.message); }
    } catch (err) { alert(err.message); } finally { setStatusUpload(prev => ({ ...prev, [cId]: '' })); }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>👤 Gestão de Segurados</h1>
        <a href="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>← Voltar</a>
      </div>
      {carregando || clientes === null ? <p>🔄 Carregando base de dados...</p> : clientes.length === 0 ? <p>Nenhum segurado localizado.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: clienteSelecionado ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th style={{ padding: '12px' }}>Nome</th><th style={{ padding: '12px' }}>Fase</th><th style={{ padding: '12px' }}>Ação</th></tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}><button onClick={() => setClienteSelecionado(c)} style={{ background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>{c.nome}</button></td>
                    <td style={{ padding: '12px' }}>{c.status}</td>
                    <td style={{ padding: '12px' }}><button onClick={() => abrirEdicao(c)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️ Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clienteSelecionado && (
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '4px solid #0070f3' }}>
              <h3>📋 Ficha do Segurado</h3>
              <p><b>Nome:</b> {clienteSelecionado.nome}</p>
              <p><b>CPF:</b> {clienteSelecionado.cpf_cnpj} | <b>Contato:</b> {clienteSelecionado.telefone || '-'}</p>
              <p><b>Veículo:</b> 🚗 {clienteSelecionado.veiculos?.marca_modelo || '-'} (Placa: {clienteSelecionado.veiculos?.placa || '-'})</p>
              <p><b>Seguradora:</b> {clienteSelecionado.apolices?.seguradora || '-'} | <b>Apólice Nº:</b> {clienteSelecionado.apolices?.numero_apolice || '-'}</p>
              <p><b>Vigência:</b> 📅 {clienteSelecionado.apolices?.inicio_vigencia || '-'} até {clienteSelecionado.apolices?.fim_vigencia || '-'}</p>
              <p><b>Valores:</b> Prêmio: R$ {clienteSelecionado.valor_calculado} | Comissão: R$ {clienteSelecionado.comissao_valor}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => abrirEdicao(clienteSelecionado)} style={{ flex: 1, padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Editar Campos</button>
                  <button onClick={() => handleExcluirCliente(clienteSelecionado.id)} style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Deletar</button>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '5px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>📎 Documento Digitalizado (PDF):</label>
                  {clienteSelecionado.apolices?.url_pdf_apolice ? (
                    <button type="button" onClick={() => setPdfVisualizacao(clienteSelecionado.apolices.url_pdf_apolice)} style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>👁️ Visualizar Apólice na Tela</button>
                  ) : (
                    <div>
                      <input type="file" accept="application/pdf" onChange={e => handleUploadTardio(e, clienteSelecionado.apolices?.id, clienteSelecionado.id)} style={{ fontSize: '12px', width: '100%' }} />
                      {statusUpload[clienteSelecionado.id] && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>{statusUpload[clienteSelecionado.id]}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>📝 Modificar Cadastro</h3>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Fase Atual (Status):
              <select value={clienteEdicao.status} onChange={e => setClienteEdicao({...clienteEdicao, status: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', fontWeight: 'bold' }}>
                <option value="Cálculo">🧮 Cálculo / Cotação Inicial</option>
                <option value="Proposta">📋 Proposta Comercial</option>
                <option value="Apólice">📜 Apólice Fechada / Emitida</option>
                <option value="Renovado">🔄 Seguro Renovado</option>
                <option value="Não Renovado">❌ Não Renovado</option>
              </select>
            </label>
