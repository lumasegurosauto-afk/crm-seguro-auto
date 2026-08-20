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
      inicio_vigencia: c.apolices?.inicio_vigencia || '', fim_vigencia: c.apolices?.fim_vigencia || ''
    });
  }

  async function handleExcluirCliente(id, nome) {
    const confirmar = window.confirm(`⚠️ Deseja excluir permanentemente o segurado "${nome}"?`);
    if (!confirmar) return;
    try {
      const { data: apolices } = await supabase.from('apolices').select('id').eq('cliente_id', id);
      if (apolices && apolices.length > 0) {
        await supabase.from('parcelas').delete().in('apolice_id', apolices.map(a => a.id));
      }
      await supabase.from('apolices').delete().eq('cliente_id', id);
      await supabase.from('propostas').delete().eq('cliente_id', id);
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      alert('🗑️ Segurado removido com sucesso!');
      await atualizarLista();
    } catch (err) { alert(`Erro: ${err.message}`); }
  }

  async function salvarDadosEditados(e) {
    e.preventDefault(); setSalvandoEdicao(true);
    try {
      await supabase.from('clientes').update({ nome: clienteEdicao.nome, cpf_cnpj: clienteEdicao.cpf_cnpj, telefone: clienteEdicao.telefone, email: clienteEdicao.email }).eq('id', clienteEdicao.id);
      await supabase.from('propostas').update({ veiculo_modelo: clienteEdicao.veiculo_modelo, veiculo_placa: clienteEdicao.veiculo_placa }).eq('cliente_id', clienteEdicao.id);
      await supabase.from('apolices').update({ numero_apolice: clienteEdicao.numero_apolice, seguradora: clienteEdicao.seguradora, inicio_vigencia: clienteEdicao.inicio_vigencia, fim_vigencia: clienteEdicao.fim_vigencia }).eq('cliente_id', clienteEdicao.id);
      alert('🎉 Cadastro atualizado!'); setClienteEdicao(null); await atualizarLista();
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
      if (res.success) { alert('Sucesso!'); await atualizarLista(); } else { alert(res.message); }
    } catch (err) { alert(err.message); } finally { setStatusUpload(prev => ({ ...prev, [cId]: '' })); }
  }
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>👤 Clientes Cadastrados</h1>
        <a href="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>← Voltar</a>
      </div>
      {carregando || clientes === null ? <p>🔄 Carregando...</p> : clientes.length === 0 ? <p>Nenhum cliente localizado.</p> : (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>Nome / CPF</th><th style={{ padding: '12px' }}>Veículo / Placa</th><th style={{ padding: '12px' }}>Seguradora</th><th style={{ padding: '12px' }}>Ações</th><th style={{ padding: '12px' }}>Apólice</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}><b>{c.nome}</b><br/><span style={{ fontSize: '12px', color: '#666' }}>{c.cpf_cnpj}</span></td>
                  <td style={{ padding: '12px' }}>🚗 {c.veiculos?.marca_modelo || '-'}<br/><span style={{ fontSize: '12px', color: '#666' }}>Placa: {c.veiculos?.placa || '-'}</span></td>
                  <td style={{ padding: '12px', color: '#059669', fontWeight: 'bold' }}>🛡️ {c.apolices?.seguradora || 'Não emitida'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => abrirEdicao(c)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>✏️ Editar</button>
                    <button onClick={() => handleExcluirCliente(c.id, c.nome)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>❌ Excluir</button>
                  </td>
                  <td style={{ padding: '12px' }}>{c.apolices?.url_pdf_apolice ? <button onClick={() => setPdfVisualizacao(c.apolices.url_pdf_apolice)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>👁️ Ver PDF</button> : <input type="file" accept="application/pdf" onChange={e => handleUploadTardio(e, c.apolices?.id, c.id)} style={{ fontSize: '12px' }} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>📝 Editar Segurado</h3>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Nome: <input type="text" value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} required style={{ width: '100%', padding: '6px', marginTop: '4px', boxSizing: 'border-box' }} /></label>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>CPF/CNPJ: <input type="text" value={clienteEdicao.cpf_cnpj} onChange={e => setClienteEdicao({...clienteEdicao, cpf_cnpj: e.target.value})} required style={{ width: '100%', padding: '6px', marginTop: '4px', boxSizing: 'border-box' }} /></label>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Modelo Carro: <input type="text" value={clienteEdicao.veiculo_modelo} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_modelo: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px', boxSizing: 'border-box' }} /></label>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Placa: <input type="text" value={clienteEdicao.veiculo_placa} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_placa: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px', boxSizing: 'border-box' }} /></label>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '15px' }}>Seguradora: <input type="text" value={clienteEdicao.seguradora} onChange={e => setClienteEdicao({...clienteEdicao, seguradora: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px', boxSizing: 'border-box' }} /></label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setClienteEdicao(null)} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={salvandoEdicao} style={{ padding: '6px 12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{salvandoEdicao ? 'Salvar...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
      {pdfVisualizacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '800px', height: '80vh', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#fff', fontWeight: 'bold' }}>📄 Visualizador PDF</span><button onClick={() => setPdfVisualizacao(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button></div>
            <iframe src={pdfVisualizacao} style={{ width: '100%', height: '100%', border: 'none' }} title="Leitor PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
