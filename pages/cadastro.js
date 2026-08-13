'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { anexarApolice } from '../lib/segurosService';

export default function CadastroSeguro() {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');

  const [marcaModelo, setMarcaModelo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [chassi, setChassi] = useState('');

  const [statusFunil, setStatusFunil] = useState('Cotação Solicitada');
  const [premioTotal, setPremioTotal] = useState('');
  const [porcentagemComissao, setPorcentagemComissao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [arquivo, setArquivo] = useState(null);

  const [statusEnvio, setStatusEnvio] = useState('');

  const comissaoEstimada = (Number(premioTotal) * (Number(porcentagemComissao) / 100)) || 0;

  async function handleSalvar(e) {
    e.preventDefault();
    setStatusEnvio('Salvando dados...');

    try {
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .insert([{ nome, cpf_cnpj: cpfCnpj, telefone, email, origem_lead: origemLead }])
        .select().single();

      if (errCliente) throw new Error(`Erro Cliente: ${errCliente.message}`);

      const { data: veiculo, error: errVeiculo } = await supabase
        .from('veiculos')
        .insert([{ cliente_id: cliente.id, marca_modelo: marcaModelo, ano_modelo: Number(anoModelo), placa, chassi }])
        .select().single();

      if (errVeiculo) throw new Error(`Erro Veículo: ${errVeiculo.message}`);

      const { data: apolice, error: errApolice } = await supabase
        .from('apolices')
        .insert([{
          cliente_id: cliente.id,
          veiculo_id: veiculo.id,
          status_funil: statusFunil,
          premio_total: Number(premioTotal),
          porcentagem_comissao: Number(porcentagemComissao),
          data_inicio_vigencia: dataInicio || null,
          data_fim_vigencia: dataFim || null
        }]).select().single();

      if (errApolice) throw new Error(`Erro Apólice: ${errApolice.message}`);

      if (arquivo && apolice.id) {
        setStatusEnvio('Fazendo upload da apólice em PDF...');
        const uploadResult = await anexarApolice(arquivo[0], apolice.id);
        if (!uploadResult.success) alert(`PDF falhou: ${uploadResult.message}`);
      }

      setStatusEnvio('✅ Tudo cadastrado com sucesso!');
      setNome(''); setCpfCnpj(''); setMarcaModelo(''); setPlaca(''); setPremioTotal(''); setPorcentagemComissao('');
    } catch (error) {
      setStatusEnvio(`❌ Erro: ${error.message}`);
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '20px' }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← Voltar ao Painel</a>
      </div>
      <h2 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', color: '#333' }}>Novo Cadastro de Seguro Auto</h2>
      
      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input type="text" placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="CPF ou CNPJ" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Marca / Modelo" value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} required style={inputStyle} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" placeholder="Prêmio Total (R$)" value={premioTotal} onChange={e => setPremioTotal(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          <input type="number" placeholder="Comissão (%)" value={porcentagemComissao} onChange={e => setPorcentagemComissao(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ background: '#f0f7ff', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', color: '#0056b3' }}>
          💵 Comissão Estimada: R$ {comissaoEstimada.toFixed(2)}
        </div>
        <label style={{ fontSize: '12px', color: '#666' }}>Fim Vigência (Renovação)
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
        </label>
        <input type="file" accept="application/pdf" onChange={e => setArquivo(e.target.files)} style={inputStyle} />
        <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Salvar Cadastro Completo</button>
        {statusEnvio && <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>{statusEnvio}</div>}
      </form>
    </div>
  );
}
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
