import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [financeiro, setFinanceiro] = useState([])

  useEffect(() => {
    carregarClientesEParcelas()
  }, [])

  async function carregarClientesEParcelas() {
    // CORREÇÃO: Busca os clientes trazendo os dados internos da apólice vinculada
    const { data: dadosClientes } = await supabase
      .from('clientes')
      .select('*, apolices(*)')
    setClientes(dadosClientes || [])

    // Busca o controle financeiro de parcelas
    const { data: dadosParcelas } = await supabase
      .from('parcelas')
      .select('*, apolices(numero_apolice, clientes(nome))')
    setFinanceiro(dadosParcelas || [])
  }

  async function handleUploadApolice(file, clienteId, apoliceId) {
    if (!file) return
    
    // 1. Envia o PDF para o Bucket do Storage
    const fileName = `public/${clienteId}_${Date.now()}.pdf`
    const { data, error } = await supabase.storage
      .from('apolices-arquivos')
      .upload(fileName, file)

    if (error) {
      alert('Erro no upload: ' + error.message)
      return
    }

    // CORREÇÃO: Captura a URL pública no formato correto exigido pelo Supabase v2
    const { data: urlData } = supabase.storage
      .from('apolices-arquivos')
      .getPublicUrl(fileName)

    const urlPublica = urlData.publicUrl

    // 2. Atualiza e SALVA a URL do PDF direto na apólice do banco de dados
    const { error: errorUpdate } = await supabase
      .from('apolices')
      .update({ pdf_url: urlPublica })
      .eq('id', apoliceId)

    if (errorUpdate) {
      alert('Erro ao vincular PDF na apólice: ' + errorUpdate.message)
    } else {
      alert('🎉 Apólice anexada e salva com sucesso!')
      carregarClientesEParcelas()
    }
  }

  async function pagarParcela(parcelaId) {
    await supabase.from('parcelas').update({ status_pagamento: 'Pago' }).eq('id', parcelaId)
    carregarClientesEParcelas()
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👥 Carteira de Clientes e Apólices</h1>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {clientes.map(cliente => (
          <div key={cliente.id} style={{ border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px', background: '#fff' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{cliente.nome} <span style={{ fontSize: '13px', color: '#64748b' }}>({cliente.cpf_cnpj})</span></h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>📞 Tel: {cliente.telefone} | ✉️ E-mail: {cliente.email}</p>
            
            {cliente.apolices && cliente.apolices.length > 0 ? (
              cliente.apolices.map(apolice => (
                <div key={apolice.id} style={{ background: '#f8fafc', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>📋 Seguradora: {apolice.seguradora} | Apólice Nº: {apolice.numero_apolice}</p>
                  
                  {apolice.pdf_url ? (
                    <a href={apolice.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                      📄 Abrir Apólice PDF
                    </a>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>Anexar PDF da Apólice:</label>
                      <input type="file" accept="application/pdf" onChange={(e) => handleUploadApolice(e.target.files[0], cliente.id, apolice.id)} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Nenhuma apólice cadastrada para este cliente.</p>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '40px' }}>💳 Controle de Parcelas a Receber</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Segurado</th>
            <th>Nº Apólice</th>
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
              <td style={{ padding: '10px' }}>{parcela.apolices?.clientes?.nome || 'N/A'}</td>
              <td>{parcela.apolices?.numero_apolice || 'N/A'}</td>
              <td>{parcela.numero_parcela}ª</td>
              <td>R$ {parcela.valor?.toFixed(2)}</td>
              <td>{parcela.data_vencimento ? new Date(parcela.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</td>
              <td style={{ color: parcela.status_pagamento === 'Pago' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{parcela.status_pagamento}</td>
              <td>
                {parcela.status_pagamento !== 'Pago' && (
                  <button onClick={() => pagarParcela(parcela.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Baixar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
