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
      alert('🎉 CRM Atualizado!'); setClienteEdicao(null); setClienteSelecionado(null); await atualizarLista();
    } catch (err) { alert(err.message); } finally { setSalvandoEdicao(false); }
  }

  async function handleUploadTardio(e, aId, cId) {
    const arquivos = e.target.files; if (!arquivos || arquivos.length === 0) return;
    setStatusUpload(prev => ({ ...prev, [cId]: 'Enviando...' }));
    try {
      let id = aId; if (!id) { const { data } = await supabase.from('apolices').insert([{ cliente_id: cId, status_funil: 'Apólice Ativa' }]).select().single(); id = data.id; }
      const res = await anexarApolice(arquivos, id);
      if (res.success) { alert('Sucesso!'); await atualizarLista(); } else { alert(res.message); }
    } catch (err) { alert(err.message); } finally { setStatusUpload(prev => ({ ...prev, [cId]: '' })); }
  }
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h1 style={{ margin: 0 }}>👤 Gestão de Segurados</h1><a href="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>← Voltar</a></div>
      {carregando || clientes === null ? <p>🔄 Carregando base de dados...</p> : clientes.length === 0 ? <p>Nenhum segurado localizado.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: clienteSelecionado ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th style={{ padding: '12px' }}>Nome do Segurado</th><th style={{ padding: '12px' }}>Fase Funil</th><th style={{ padding: '12px' }}>Ação</th></tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee', background: clienteSelecionado?.id === c.id ? '#f0fdf4' : 'transparent' }}><td style={{ padding: '12px' }}><button onClick={() => setClienteSelecionado(c)} style={{ background: 'none', border: 'none', padding: 0, color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>{c.nome}</button></td><td style={{ padding: '12px' }}>{c.status}</td><td style={{ padding: '12px' }}><button onClick={() => abrirEdicao(c)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️ Editar</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {clienteSelecionado && (
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '4px solid #0070f3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3>📋 Ficha do Segurado</h3><button onClick={() => setClienteSelecionado(null)} style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Fechar ✕</button></div>
              <p><b>Nome:</b> {clienteSelecionado.nome}</p><p><b>Documento:</b> {clienteSelecionado.cpf_cnpj}</p><p><b>Contato:</b> {clienteSelecionado.telefone || '-'} | {clienteSelecionado.email || '-'}</p><p><b>Veículo:</b> 🚗 {clienteSelecionado.veiculos?.marca_modelo || '-'} (Placa: {clienteSelecionado.veiculos?.placa || '-'})</p><p><b>Seguradora:</b> {clienteSelecionado.apolices?.seguradora || '-'}</p><p><b>Apólice Nº:</b> {clienteSelecionado.apolices?.numero_apolice || '-'}</p><p><b>Vigência:</b> {clienteSelecionado.apolices?.inicio_vigencia || '-'} ate {clienteSelecionado.apolices?.fim_vigencia || '-'}</p><p><b>Financeiro:</b> Prêmio R$ {clienteSelecionado.valor_calculado} | Comissão R$ {clienteSelecionado.comissao_valor}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <button onClick={() => abrirEdicao(clienteSelecionado)} style={{ flex: 1, padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Editar</button>
                {clienteSelecionado.apolices?.url_pdf_apolice ? <button onClick={() => setPdfVisualizacao(clienteSelecionado.apolices.url_pdf_apolice)} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>👁️ Abrir PDF</button> : <div style={{ flex: 1 }}><input type="file" accept="application/pdf" onChange={e => handleUploadTardio(e, clienteSelecionado.apolices?.id, clienteSelecionado.id)} style={{ fontSize: '12px' }} /></div>}
                <button onClick={() => handleExcluirCliente(clienteSelecionado.id)} style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Deletar</button>
              </div>
            </div>
          )}
        </div>
      )}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>📝 Modificar Cadastro</h3>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Status:<select value={clienteEdicao.status} onChange={e => setClienteEdicao({...clienteEdicao, status: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', fontWeight: 'bold' }}><option value="Cálculo">🧮 Cálculo</option><option value="Proposta">📋 Proposta</option><option value="Apólice">📜 Apólice Emitida</option><option value="Renovado">🔄 Renovado</option><option value="Não Renovado">❌ Não Renovado</option></select></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Nome: <input type="text" value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} required style={{ width: '100%', padding: '6px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>CPF / CNPJ: <input type="text" value={clienteEdicao.cpf_cnpj} onChange={e => setClienteEdicao({...clienteEdicao, cpf_cnpj: e.target.value})} required style={{ width: '100%', padding: '6px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Modelo Carro: <input type="text" value={clienteEdicao.veiculo_modelo} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_modelo: e.target.value})} style={{ width: '100%', padding: '6px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Placa: <input type="text" value={clienteEdicao.veiculo_placa} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_placa: e.target.value})} style={{ width: '100%', padding: '6px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Seguradora: <input type="text" value={clienteEdicao.seguradora} onChange={e => setClienteEdicao({...clienteEdicao, seguradora: e.target.value})} style={{ width: '100%', padding: '6px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Nº Apólice: <input type="text" value={clienteEdicao.numero_apolice} onChange={e => setClienteEdicao({...clienteEdicao, numero_apolice: e.target.value})} style={{ width: '100%', padding: '6px' }} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}><label style={{ fontSize: '12px' }}>Prêmio: <input type="number" step="0.01" value={clienteEdicao.valor_calculado} onChange={e => setClienteEdicao({...clienteEdicao, valor_calculado: e.target.value})} style={{ width: '100%' }} /></label><label style={{ fontSize: '12px' }}>Comissão: <input type="number" step="0.01" value={clienteEdicao.comissao_valor} onChange={e => setClienteEdicao({...clienteEdicao, comissao_valor: e.target.value})} style={{ width: '100%' }} /></label></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}><button type="button" onClick={() => setClienteEdicao(null)} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px' }}>Cancelar</button><button type="submit" disabled={salvandoEdicao} style={{ padding: '6px 12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Salvar</button></div>
          </form>
        </div>
      )}
      {pdfVisualizacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}><div style={{ background: '#fff', width: '100%', maxWidth: '850px', height: '80vh', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}><div style={{ background: '#1e293b', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#fff', fontWeight: 'bold' }}>📄 Visualizador de Documento</span><button onClick={() => setPdfVisualizacao(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Fechar ✕</button></div><iframe src={pdfVisualizacao} style={{ width: '100%', height: '100%', border: 'none' }} title="Leitor CRM" /></div></div>
      )}
    </div>
  );
}
