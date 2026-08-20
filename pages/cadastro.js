'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [placa, setPlaca] = useState('');
  const [seguradora, setSeguradora] = useState('');
  const [numeroApolice, setNumeroApolice] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [comissaoValor, setComissaoValor] = useState('');
  const [qtdParcelas, setQtdParcelas] = useState('1');
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaFim, setVigenciaFim] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('Apólice');
  const [carregando, setCarregando] = useState(false);

  async function handleSalvarSeguro(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .insert([{ nome, cpf_cnpj: cpfCnpj, telefone, email }])
        .select().single();

      if (errCliente) throw new Error('Erro Cliente: ' + errCliente.message);

      const { data: proposta, error: errProposta } = await supabase
        .from('propostas')
        .insert([{ 
          cliente_id: cliente.id, 
          veiculo_modelo: veiculo, 
          veiculo_placa: placa, 
          valor_calculado: parseFloat(valorTotal),
          comissao_valor: parseFloat(comissaoValor || 0),
          status: tipoDocumento
        }])
        .select().single();

      if (errProposta) throw new Error('Erro Proposta: ' + errProposta.message);

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
        .select().single();

      if (errApolice) throw new Error('Erro Apólice: ' + errApolice.message);

      const numeroDeParcelas = parseInt(qtdParcelas);
      const valorDaParcela = parseFloat(valorTotal) / numeroDeParcelas;
      const listaParcelas = [];

      for (let i = 1; i <= numeroDeParcelas; i++) {
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + (i * 30));
        listaParcelas.push({
          apolice_id: apolice.id,
          numero_parcela: i,
          valor: valorDaParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0], // CORREÇÃO REALIZADA AQUI
          status_pagamento: 'Pendente'
        });
      }

      await supabase.from('parcelas').insert(listaParcelas);
      alert('🎉 Registro cadastrado com sucesso!');
      
      setNome(''); setCpfCnpj(''); setTelefone(''); setEmail('');
      setVeiculo(''); setPlaca(''); setSeguradora(''); setNumeroApolice('');
      setValorTotal(''); setComissaoValor(''); setVigenciaInicio(''); setVigenciaFim('');
    } catch (error) {
      alert('Falha operacional: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📝 Novo Registro de Seguro</h1>
      <form onSubmit={handleSalvarSeguro} style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <fieldset style={{ border: '2px solid #2563eb', borderRadius: '8px', padding: '15px', background: '#eff6ff' }}>
          <legend style={{ fontWeight: 'bold', color: '#2563eb' }}>Tipo de Registro</legend>
          <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px' }}>
            <option value="Apólice">📜 Apólice Fechada / Emitida</option>
            <option value="Proposta">📋 Proposta Comercial</option>
            <option value="Cálculo">🧮 Cálculo / Cotação Inicial</option>
          </select>
        </fieldset>

        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', background: '#fff' }}>
          <legend style={{ fontWeight: 'bold' }}>Dados do Cliente</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Nome Completo: <input type="text" required value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>CPF ou CNPJ: <input type="text" required value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Telefone: <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>E-mail: <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', background: '#fff' }}>
          <legend style={{ fontWeight: 'bold' }}>Especificações e Valores</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Modelo do Carro: <input type="text" required value={veiculo} onChange={e => setVeiculo(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Placa do Veículo: <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Prêmio Total (R$): <input type="number" step="0.01" required value={valorTotal} onChange={e => setValorTotal(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Valor da Comissão (R$): <input type="number" step="0.01" required value={comissaoValor} onChange={e => setComissaoValor(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Parcelas: 
              <select value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', background: '#fff' }}>
          <legend style={{ fontWeight: 'bold' }}>Vigência / Controle</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>Seguradora: <input type="text" required value={seguradora} onChange={e => setSeguradora(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Nº Controle/Apólice: <input type="text" required value={numeroApolice} onChange={e => setNumeroApolice(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Início: <input type="date" required value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
            <label>Fim: <input type="date" required value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} style={{ width: '100%', padding: '8px' }} /></label>
          </div>
        </fieldset>

        <button type="submit" disabled={carregando} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          {carregando ? 'Salvando dados...' : '💾 Salvar Registro'}
        </button>
      </form>
    </div>
  );
}
