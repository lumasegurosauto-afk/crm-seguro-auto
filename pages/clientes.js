import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [financeiro, setFinanceiro] = useState([])

  useEffect(() => {
    carregarClientesEParcelas()
  }, [])

  async function carregarClientesEParcelas() {
    // Busca os clientes e tenta trazer as apólices amarradas
    const { data: dadosClientes } = await supabase
      .from('clientes')
      .select('*, apolices(*)')
    setClientes(dadosClientes || [])

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

    // Salva o link do PDF direto na apólice do cliente
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

  // Função auxiliar para criar uma apólice em branco caso o cliente antigo não tenha uma linha de upload
  async function criarApoliceFaltante(clienteId) {
    const numeroFake = 'GERADA-' + Math.floor(100000 + Math.random() * 900000);
    const { error } = await supabase.from('apolices').insert([{
      cliente_id: clienteId,
      numero_apolice: numeroFake,
      seguradora: 'Pendente de Upload',
      inicio_vigencia: new Date().toISOString().split('T')[0],
      fim_vigencia: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
    }])
    if (error) alert(error.message)
    else carregarClientesEParcelas()
  }

  async function excluirCliente(clienteId, nomeCliente) {
    const confirmar = window.confirm(`⚠️ Deseja apagar permanentemente "${nomeCliente}"?`);
    if (!confirmar) return;
    await supabase.from('clientes').delete().eq('id', clienteId)
    carregarClientesEParcelas()
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>👥 Carteira de Clientes e Arquivos</h1>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {clientes.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhum segurado localizado no banco de dados. Vá em Novo Cadastro.</p>
        ) : (
          clientes.map(cliente => (
            <div key={cliente.id} style={{ border: '1px solid #cbd5e1', padding: '20px', borderRadius: '8px', background: '#fff', position: 'relative' }}>
              <button onClick={() => excluirCliente(cliente.id, cliente.nome)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Apagar</button>
              
              <h3 style={{ margin: '0 0 5px 0' }}>{cliente.nome} <span style={{ fontSize: '13px', color: '#64748b' }}>({cliente.cpf_cnpj})</span></h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569' }}>📞 {cliente.telefone} | ✉️ {cliente.email}</p>
              
              {/* LISTAGEM DE APÓLICES / ARQUIVOS */}
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>📄 Documentações Vinculadas:</h4>
                
                {cliente.apolices && cliente.apolices.length > 0 ? (
                  cliente.apolices.map(apolice => (
                    <div key={apolice.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>{apolice.seguradora}</strong> (Documento: {apolice.numero_apolice})</p>
                      {apolice.pdf_url ? (
                        <a href={apolice.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
                          📄 Visualizar PDF Salvo
                        </a>
                      ) : (
                        <div style={{ marginTop: '5px' }}>
                          <input type="file" accept="application/pdf" onChange={(e) => handleUploadApolice(e.target.files[0], cliente.id, apolice.id)} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 10px 0' }}>Este cliente foi criado sem registros de apólice.</p>
                    <button onClick={() => criarApoliceFaltante(cliente.id)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>➕ Ativar Campo de Upload para este Cliente</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
