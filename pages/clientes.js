import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [financeiro, setFinanceiro] = useState([])

  useEffect(() => {
    carregarClientesEParcelas()
  }, [])

  async function carregarClientesEParcelas() {
    // Busca clientes e suas apólices vinculadas
    const { data: dadosClientes } = await supabase.from('clientes').select('*, apolices(*)')
    setClientes(dadosClientes || [])

    // Busca todas as parcelas do financeiro
    const { data: dadosParcelas } = await supabase.from('parcelas').select('*, apolices(numero_apolice, clientes(nome))')
    setFinanceiro(dadosParcelas || [])
  }

  // Função para fazer Upload do PDF da Apólice
  async function handleUploadApolice(file, clienteId, apoliceId) {
    if (!file) return
    
    // 1. Sobe o arquivo para a pasta 'apolices-arquivos' do Supabase Storage
    const { data, error } = await supabase.storage
      .from('apolices-arquivos')
      .upload(`public/${clienteId}_${Date.now()}.pdf`, file)

    if (error) {
      alert('Erro no upload: ' + error.message)
      return
    }

    // 2. Captura a URL pública gerada para o arquivo
    const { data: urlData } = supabase.storage.from('apolices-arquivos').getPublicUrl(data.path)

    // 3. Atualiza a tabela de apólices inserindo o link do PDF
    await supabase.from('apolices').update({ pdf_url: urlData.publicUrl }).eq('id', apoliceId)
    
    alert('Apólice anexada com sucesso!')
    carregarClientesEParcelas()
  }

  // Função para dar baixa na parcela do seguro
  async function pagarParcela(parcelaId) {
    await supabase.from('parcelas').update({ status_pagamento: 'Pago' }).eq('id', parcelaId)
    carregarClientesEParcelas()
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👥 Carteira de Clientes e Apólices</h1>
      
      {/* Lista de Clientes e Upload */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {clientes.map(cliente => (
          <div key={cliente.id} style={{ border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px' }}>
            <h3>{cliente.nome} <span style={{ fontSize: '12px', color: '#64748b' }}>({cliente.cpf_cnpj})</span></h3>
            
            {cliente.apolices?.map(apolice => (
              <div key={apolice.id} style={{ background: '#f8fafc', padding: '10px', marginTop: '5px', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 10px 0' }}>📋 Seguradora: {apolice.seguradora} | Nº {apolice.numero_apolice}</p>
                
                {/* Se já tiver PDF anexado, mostra o botão de abrir */}
                {apolice.pdf_url ? (
                  <a href={apolice.pdf_url} target="_blank" rel="noreferrer" style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', inlineBlock: 'true' }}>
                    📄 Ver Apólice Anexada
                  </a>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>Anexar PDF da Apólice:</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleUploadApolice(e.target.files[0], cliente.id, apolice.id)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Seção Financeira de Parcelas */}
      <h2 style={{ marginTop: '40px' }}>💳 Controle de Parcelas a Receber</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
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
              <td style={{ padding: '10px' }}>{parcela.apolices?.clientes?.nome}</td>
              <td>{parcela.apolices?.numero_apolice}</td>
              <td>{parcela.numero_parcela}ª</td>
              <td>R$ {parcela.valor?.toFixed(2)}</td>
              <td>{new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</td>
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
