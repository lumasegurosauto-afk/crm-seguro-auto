import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [financeiro, setFinanceiro] = useState([])

  useEffect(() => {
    carregarClientesEParcelas()
  }, [])

  async function carregarClientesEParcelas() {
    // Busca os clientes trazendo as apólices e propostas (onde estão veículo e placa) vinculadas
    const { data: dadosClientes } = await supabase
      .from('clientes')
      .select('*, apolices(*, propostas(*))')
    setClientes(dadosClientes || [])

    // Busca o controle de parcelas para a tabela do financeiro
    const { data: dadosParcelas } = await supabase
      .from('parcelas')
      .select('*, apolices(numero_apolice, clientes(nome))')
    setFinanceiro(dadosParcelas || [])
  }

  async function handleUploadApolice(file, clienteId, apoliceId) {
    if (!file) return
    
    const fileName = `public/${clienteId}_${Date.now()}.pdf`
    const { data, error } = await supabase.storage
      .from('apolices-arquivos')
      .upload(fileName, file)

    if (error) {
      alert('Erro no upload do arquivo: ' + error.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from('apolices-arquivos')
      .getPublicUrl(fileName)

    const urlPublica = urlData.publicUrl

    const { error: errorUpdate } = await supabase
      .from('apolices')
      .update({ pdf_url: urlPublica })
      .eq('id', apoliceId)

    if (errorUpdate) {
      alert('Erro ao vincular link do PDF: ' + errorUpdate.message)
    } else {
      alert('🎉 Arquivo PDF anexado e salvo com sucesso!')
      carregarClientesEParcelas()
    }
  }

  async function excluirCliente(clienteId, nomeCliente) {
    const confirmar = window.confirm(`⚠️ Deseja apagar permanentemente o cadastro de "${nomeCliente}"?`);
    if (!confirmar) return;
    await supabase.from('clientes').delete().eq('id', clienteId)
    carregarClientesEParcelas()
  }

  async function pagarParcela(parcelaId) {
    await supabase.from('parcelas').update({ status_pagamento: 'Pago' }).eq('id', parcelaId)
    carregarClientesEParcelas()
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b', marginBottom: '20px' }}>👥 Carteira de Clientes e Segurados</h1>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {clientes.length === 0 ? (
          <p style={{ color: '#64748b', background: '#f1f5f9', padding: '15px', borderRadius: '6px' }}>
            Nenhum segurado localizado no banco de dados. Vá em <strong>Novo Cadastro</strong> para inserir o primeiro.
          </p>
        ) : (
          clientes.map(cliente => (
            <div key={cliente.id} style={{ border: '1px solid #cbd5e1', padding: '20px', borderRadius: '12px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              {/* Botão de Excluir Registro */}
              <button onClick={() => excluirCliente(cliente.id, cliente.nome)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🗑️ Apagar Registro</button>
              
              {/* Bloco 1: Informações Pessoais */}
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#1e293b', paddingRight: '140px' }}>{cliente.nome}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}><strong>📋 CPF/CNPJ:</strong> {cliente.cpf_cnpj}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}><strong>📞 Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}><strong>✉️ E-mail:</strong> {cliente.email || 'Não informado'}</p>
              </div>
              
              {/* Bloco 2: Detalhes do Seguro e Apólices */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', background: '#fff' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>🚗 Dados do Veículo e Apólice</h4>
                
                {cliente.apolices && cliente.apolices.length > 0 ? (
                  cliente.apolices.map(apolice => (
                    <div key={apolice.id} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>🚘 Veículo:</strong> {apolice.propostas?.veiculo_modelo || 'Não informado'}</p>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>🔢 Placa:</strong> {apolice.propostas?.veiculo_placa || 'Não informado'}</p>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>🛡️ Seguradora:</strong> {apolice.seguradora}</p>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>📄 Nº Apólice:</strong> {apolice.numero_apolice}</p>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>📅 Vigência Início:</strong> {apolice.inicio_vigencia ? new Date(apolice.inicio_vigencia).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}><strong>⏰ Vigência Fim (Renovação):</strong> {apolice.fim_vigencia ? new Date(apolice.fim_vigencia).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p style={{ margin: 0, fontSize: '14px' }}><strong>🏷️ Tipo:</strong> <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{apolice.propostas?.status || 'Apólice'}</span></p>
                      </div>

                      {/* Upload e exibição de arquivo anexado */}
                      <div style={{ marginTop: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                        {apolice.pdf_url ? (
                          <a href={apolice.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                            📄 Abrir Apólice PDF Anexada
                          </a>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', color: '#475569' }}>Anexar Arquivo PDF:</span>
                            <input type="file" accept="application/pdf" onChange={(e) => handleUploadApolice(e.target.files[0], cliente.id, apolice.id)} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Nenhum contrato amarrado a este cliente.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabela de parcelas */}
      <h2 style={{ marginTop: '50px', color: '#1e293b' }}>💳 Fluxo de Parcelas do Seguro</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ padding: '12px' }}>Segurado</th>
            <th>Nº Documento</th>
            <th>Parcela</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {financeiro.map(parcela => (
            <tr key={parcela.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: '500' }}>{parcela.apolices?.clientes?.nome || 'N/A'}</td>
              <td>{parcela.apolices?.numero_apolice || 'N/A'}</td>
              <td>{parcela.numero_parcela}ª</td>
              <td>R$ {parcela.valor?.toFixed(2)}</td>
              <td>{parcela.data_vencimento ? new Date(parcela.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</td>
              <td style={{ color: parcela.status_pagamento === 'Pago' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{parcela.status_pagamento}</td>
              <td>
                {parcela.status_pagamento !== 'Pago' && (
                  <button onClick={() => pagarParcela(parcela.id)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Baixar Parcela</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
