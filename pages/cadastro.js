import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Cadastro() {
  // Dados do Cliente
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  // Dados do Veículo e Seguro (Proposta/Cálculo)
  const [veiculo, setVeiculo] = useState('')
  const [placa, setPlaca] = useState('')
  const [seguradora, setSeguradora] = useState('')
  const [numeroApolice, setNumeroApolice] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [comissaoValor, setComissaoValor] = useState('') // Estado para a comissão
  const [qtdParcelas, setQtdParcelas] = useState('1')
  const [vigenciaInicio, setVigenciaInicio] = useState('')
  const [vigenciaFim, setVigenciaFim] = useState('')

  const [carregando, setCarregando] = useState(false)

  async function handleSalvarSeguro(e) {
    e.preventDefault()
    setCarregando(true)

    try {
      // 1. Cadastra o Cliente no Supabase
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .insert([{ nome, cpf_cnpj: cpfCnpj, telefone, email }])
        .select()
        .single()

      if (errCliente) throw new Error('Erro ao cadastrar cliente: ' + errCliente.message)

      // 2. Cadastra a Proposta / Cálculo vinculada ao cliente inserindo a comissão
      const { data: proposta, error: errProposta } = await supabase
        .from('propostas')
        .insert([{ 
          cliente_id: cliente.id, 
          veiculo_modelo: veiculo, 
          veiculo_placa: placa, 
          valor_calculado: parseFloat(valorTotal),
          comissao_valor: parseFloat(comissaoValor || 0), // Salva o valor da comissão no banco
          status: 'Aprovada'
        }])
        .select()
        .single()

      if (errProposta) throw new Error('Erro ao salvar proposta: ' + errProposta.message)

      // 3. Cadastra a Apólice (Vigência)
      const { data: apolice, error: errApolice } = await supabase
        .from('apolices')
        .insert([{
          cliente_id: cliente.id,
          proposta_id: proposta.id,
          numero_apolice: numeroApolice,
          seguradora: seguradora,
          inicio_vigencia: vigenciaInicio,
          fim_vigencia: vigenciaFim
        }])
        .select()
        .single()

      if (errApolice) throw new Error('Erro ao emitir apólice: ' + errApolice.message)

      // 4. Calcula e Gera as Parcelas Automaticamente no Financeiro
      const numeroDeParcelas = parseInt(qtdParcelas)
      const valorDaParcela = parseFloat(valorTotal) / numeroDeParcelas
      const listaParcelas = []

      for (let i = 1; i <= numeroDeParcelas; i++) {
        const dataVencimento = new Date()
        dataVencimento.setDate(dataVencimento.getDate() + (i * 30))

        listaParcelas.push({
          apolice_id: apolice.id,
          numero_parcela: i,
          valor: valorDaParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status_pagamento: 'Pendente'
        })
      }

      const { error: errParcelas } = await supabase.from('parcelas').insert(listaParcelas)
      if (errParcelas) throw new Error('Erro ao gerar parcelas: ' + errParcelas.message)

      alert('🎉 Segurado, proposta, apólice e parcelas cadastrados com sucesso!')
      
      // Limpa todo o formulário
      setNome(''); setCpfCnpj(''); setTelefone(''); setEmail('');
      setVeiculo(''); setPlaca(''); setSeguradora(''); setNumeroApolice('');
      setValorTotal(''); setComissaoValor(''); setQtdParcelas('1'); setVigenciaInicio(''); setVigenciaFim('')

    } catch (error) {
      alert(error.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>📝 Novo Cadastro de Seguro Auto</h1>
      
      <form onSubmit={handleSalvarSeguro} style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        
        {/* SEÇÃO DO CLIENTE */}
        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px' }}>
          <legend style={{ fontWeight: 'bold', color: '#3b82f6', padding: '0 5px' }}>Dados do Cliente</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Nome Completo: <input type="text" required value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>CPF ou CNPJ: <input type="text" required value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Telefone/WhatsApp: <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>E-mail: <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
          </div>
        </fieldset>

        {/* SEÇÃO DO VEÍCULO E CÁLCULO */}
        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px' }}>
          <legend style={{ fontWeight: 'bold', color: '#3b82f6', padding: '0 5px' }}>Dados do Veículo e Valores</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Modelo do Carro: <input type="text" required value={veiculo} onChange={e => setVeiculo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Placa: <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Prêmio Total (R$): <input type="number" step="0.01" required value={valorTotal} onChange={e => setValorTotal(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Valor da Comissão (R$): <input type="number" step="0.01" required value={comissaoValor} onChange={e => setComissaoValor(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label style={{ gridColumn: 'span 2' }}>Quantidade de Parcelas: 
              <select value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        {/* SEÇÃO DA APÓLICE */}
        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px' }}>
          <legend style={{ fontWeight: 'bold', color: '#3b82f6', padding: '0 5px' }}>Emissão de Apólice (Vigência)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Companhia Seguradora: <input type="text" required value={seguradora} onChange={e => setSeguradora(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Número da Apólice: <input type="text" required value={numeroApolice} onChange={e => setNumeroApolice(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Início da Vigência: <input type="date" required value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
            <label>Fim da Vigência (Renovação): <input type="date" required value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></label>
          </div>
        </fieldset>

        <button type="submit" disabled={carregando} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          {carregando ? 'Salvando dados...' : '💾 Salvar e Gerar Contrato'}
        </button>
      </form>
    </div>
  )
}
