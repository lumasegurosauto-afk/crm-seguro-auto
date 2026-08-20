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
  function abrirEdicao(c) { setClienteEdicao({ id: c.id, nome: c.nome, cpf_cnpj: c.cpf_cnpj, telefone: c.telefone, email: c.email, veiculo_modelo: c.veiculos?.marca_modelo || '', veiculo_placa: c.veiculos?.placa || '', seguradora: c.apolices?.seguradora || '', numero_apolice: c.apolices?.numero_apolice || '', inicio_vigencia: c.apolices?.inicio_vigencia || '', fim_vigencia: c.apolices?.fim_vigencia || '' }); }
  async function salvarDadosEditados(e) {
    e.preventDefault(); setSalvandoEdicao(true);
    try {
      await supabase.from('clientes').update({ nome: clienteEdicao.nome, cpf_cnpj: clienteEdicao.cpf_cnpj, telefone: clienteEdicao.telefone, email: clienteEdicao.email }).eq('id', clienteEdicao.id);
      await supabase.from('propostas').update({ veiculo_modelo: clienteEdicao.veiculo_modelo, veiculo_placa: clienteEdicao.veiculo_placa }).eq('cliente_id', clienteEdicao.id);
      await supabase.from('apolices').update({ numero_apolice: clienteEdicao.numero_apolice, seguradora: clienteEdicao.seguradora, inicio_vigencia: clienteEdicao.inicio_vigencia, fim_vigencia: clienteEdicao.fim_vigencia }).eq('cliente_id', clienteEdicao.id);
    } catch (err) { alert(err.message); } finally { setSalvandoEdicao(false); }
  }
  async function handleUploadTardio(e, aId, cId) {
    setStatusUpload(prev => ({ ...prev, [cId]: 'Enviando...' }));
    try {
      const res = await anexarApolice(arquivos, id);
    } catch (err) { alert(err.message); } finally { setStatusUpload(prev => ({ ...prev, [cId]: '' })); }
  }
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><h1 style={{ color: '#333' }}>👤 Clientes Cadastrados</h1><a href='/'>← Voltar</a></div>
      {carregando || clientes === null ? <p>🔄 Carregando...</p> : clientes.length === 0 ? <p>Nenhum localizado.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead><tr style={{ background: '#eee' }}><th style={{ padding: '10px' }}>Nome</th><th style={{ padding: '10px' }}>CPF/CNPJ</th><th style={{ padding: '10px' }}>Ações</th><th style={{ padding: '10px' }}>Apólice</th></tr></thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{c.nome}</td><td style={{ padding: '10px' }}>{c.cpf_cnpj}</td>
                <td style={{ padding: '10px' }}><button onClick={() => abrirEdicao(c)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>✏️ Editar</button></td>
                <td style={{ padding: '10px' }}>{c.apolices?.url_pdf_apolice ? <button onClick={() => setPdfVisualizacao(c.apolices.url_pdf_apolice)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>👁️ Ver PDF</button> : <input type='file' accept='application/pdf' onChange={e => handleUploadTardio(e, c.apolices?.id, c.id)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>📝 Editar Segurado</h3>
            <label>Nome: <input type='text' value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} style={{ width: '100%', padding: '5px', marginBottom: '10px' }} /></label>
            <label>CPF/CNPJ: <input type='text' value={clienteEdicao.cpf_cnpj} onChange={e => setClienteEdicao({...clienteEdicao, cpf_cnpj: e.target.value})} style={{ width: '100%', padding: '5px', marginBottom: '10px' }} /></label>
            <label>Modelo Carro: <input type='text' value={clienteEdicao.veiculo_modelo} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_modelo: e.target.value})} style={{ width: '100%', padding: '5px', marginBottom: '10px' }} /></label>
            <label>Placa: <input type='text' value={clienteEdicao.veiculo_placa} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_placa: e.target.value})} style={{ width: '100%', padding: '5px', marginBottom: '10px' }} /></label>
            <label>Seguradora: <input type='text' value={clienteEdicao.seguradora} onChange={e => setClienteEdicao({...clienteEdicao, seguradora: e.target.value})} style={{ width: '100%', padding: '5px', marginBottom: '10px' }} /></label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}><button type='button' onClick={() => setClienteEdicao(null)}>Cancelar</button><button type='submit' disabled={salvandoEdicao}>Salvar</button></div>
          </form>
        </div>
      )}
      {pdfVisualizacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '800px', height: '80vh', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#fff' }}>📄 Visualizador PDF</span><button onClick={() => setPdfVisualizacao(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button></div>
            <iframe src={pdfVisualizacao} style={{ width: '100%', height: '100%', border: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
