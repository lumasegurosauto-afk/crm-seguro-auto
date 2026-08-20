'use client';
import { useEffect, useState } from 'react';
import { listarClientesCompleto, anexarApolice } from '../lib/segurosService';
import { supabase } from '../lib/supabaseClient';

export default function ListaClientes() {
  const [clientes, setClientes] = useState(null);
  const [carregando, setCarregando] = useState(true);
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
    if (!window.confirm('⚠️ Deseja excluir?')) return;
    try {
      await supabase.from('apolices').delete().eq('cliente_id', id);
      await supabase.from('propostas').delete().eq('cliente_id', id);
      await supabase.from('clientes').delete().eq('id', id);
      alert('🗑️ Removido!'); await atualizarLista(); setClienteSelecionado(null);
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>👤 Gestão de Segurados</h2>
      {carregando || clientes === null ? <p>🔄 Carregando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: clienteSelecionado ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th style={{ padding: '8px' }}>Nome</th><th style={{ padding: '8px' }}>Fase</th><th style={{ padding: '8px' }}>Ação</th></tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}><button onClick={() => setClienteSelecionado(c)} style={{ background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer' }}>{c.nome}</button></td>
                    <td style={{ padding: '8px' }}>{c.status}</td>
                    <td style={{ padding: '8px' }}><button onClick={() => abrirEdicao(c)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>✏️ Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clienteSelecionado && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3>📋 Ficha: {clienteSelecionado.nome}</h3>
              <p><b>CPF:</b> {clienteSelecionado.cpf_cnpj} | <b>Contato:</b> {clienteSelecionado.telefone || '-'}</p>
              <p><b>Veículo:</b> {clienteSelecionado.veiculos?.marca_modelo || '-'} (Placa: {clienteSelecionado.veiculos?.placa || '-'})</p>
              <p><b>Seguradora:</b> {clienteSelecionado.apolices?.seguradora || '-'} | <b>Apólice Nº:</b> {clienteSelecionado.apolices?.numero_apolice || '-'}</p>
              <p><b>Vigência:</b> {clienteSelecionado.apolices?.inicio_vigencia || '-'} ate {clienteSelecionado.apolices?.fim_vigencia || '-'}</p>
              <p><b>Valores:</b> Prêmio: R$ {clienteSelecionado.valor_calculado} | Comissão: R$ {clienteSelecionado.comissao_valor}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                {clienteSelecionado.apolices?.url_pdf_apolice && <button onClick={() => setPdfVisualizacao(clienteSelecionado.apolices.url_pdf_apolice)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>👁️ Abrir PDF</button>}
                <button onClick={() => handleExcluirCliente(clienteSelecionado.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Deletar</button>
              </div>
            </div>
          )}
        </div>
      )}
      {clienteEdicao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={salvarDadosEditados} style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>📝 Modificar Cadastro</h3>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Status:<select value={clienteEdicao.status} onChange={e => setClienteEdicao({...clienteEdicao, status: e.target.value})} style={{ width: '100%', padding: '6px' }}><option value="Cálculo">🧮 Cálculo</option><option value="Proposta">📋 Proposta</option><option value="Apólice">📜 Apólice</option><option value="Renovado">🔄 Renovado</option><option value="Não Renovado">❌ Não Renovado</option></select></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Nome: <input type="text" value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} required style={{ width: '100%', padding: '4px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Modelo Carro: <input type="text" value={clienteEdicao.veiculo_modelo} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_modelo: e.target.value})} style={{ width: '100%', padding: '4px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Placa: <input type="text" value={clienteEdicao.veiculo_placa} onChange={e => setClienteEdicao({...clienteEdicao, veiculo_placa: e.target.value})} style={{ width: '100%', padding: '4px' }} /></label>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Seguradora: <input type="text" value={clienteEdicao.seguradora} onChange={e => setClienteEdicao({...clienteEdicao, seguradora: e.target.value})} style={{ width: '100%', padding: '4px' }} /></label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}><button type="button" onClick={() => setClienteEdicao(null)}>Cancelar</button><button type="submit" disabled={salvandoEdicao}>Salvar</button></div>
          </form>
        </div>
      )}
      {pdfVisualizacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}><div style={{ background: '#fff', width: '90%', maxWidth: '800px', height: '80vh', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ background: '#1e293b', padding: '10px', display: 'flex', justifyContent: 'space-between', color: '#fff' }}><span>📄 Leitor PDF</span><button onClick={() => setPdfVisualizacao(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', cursor: 'pointer' }}>Fechar ✕</button></div><iframe src={pdfVisualizacao} style={{ width: '100%', height: '100%', border: 'none' }} title="Leitor" /></div></div>
      )}
    </div>
  );
}
