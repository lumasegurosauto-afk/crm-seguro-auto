'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { anexarApolice } from '../../lib/segurosService';

export default function CadastroSeguro() {
  // Estados do formulário
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

  // Calcula comissão na tela antes de salvar
  const comissaoEstimada = (Number(premioTotal) * (Number(porcentagemComissao) / 100)) || 0;

  async function handleSalvar(e) {
    e.preventDefault();
    setStatusEnvio('Salvando dados...');

    try {
      // 1. Cadastra o Cliente
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .insert([{ nome, cpf_cnpj: cpfCnpj, telefone, email, origem_lead: origemLead }])
        .select()
        .single();

      if (errCliente) throw new Error(`Erro Cliente: ${errCliente.message}`);

      // 2. Cadastra o Veículo vinculado ao Cliente
      const { data: veiculo, error: errVeiculo } = await supabase
        .from('veiculos')
        .insert([{ cliente_id: cliente.id, marca_modelo: marcaModelo, ano_modelo: Number(anoModelo), placa, chassi }])
        .select()
        .single();

      if (errVeiculo) throw new Error(`Erro Veículo: ${errVeiculo.message}`);

      // 3. Cadastra a Apólice/Proposta vinculada ao Cliente e Veículo
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
        }])
        .select()
        .single();

      if (errApolice) throw new Error(`Erro Apólice: ${errApolice.message}`);

      // 4. Se o usuário selecionou um arquivo PDF, faz o upload usando o serviço criado
      if (arquivo && apolice.id) {
        setStatusEnvio('Fazendo upload da apólice em PDF...');
        const uploadResult = await anexarApolice(arquivo, apolice.id);
        if (!uploadResult.success) {
          alert(`Dados salvos, mas o PDF falhou: ${uploadResult.message}`);
        }
      }

      setStatusEnvio('✅ Tudo cadastrado e salvo com sucesso!');
      // Limpa os campos
      setNome(''); setCpfCnpj(''); setMarcaModelo(''); setPlaca(''); setPremioTotal(''); setPorcentagemComissao(''); setArquivo(null);
    } catch (error) {
      console.error(error);
      setStatusEnvio(`❌ Erro: ${error.message}`);
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', color: '#333' }}>Novo Cadastro de Seguro Auto</h2>
      
      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        
        {/* BLOCO CLIENTE */}
        <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px', color: '#0070f3' }}>👤 Dados do Cliente</h3>
        <input type="text" placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="CPF ou CNPJ" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} required style={inputStyle} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <select value={origemLead} onChange={e => setOrigemLead(e.target.value)} style={inputStyle}>
          <option value="Instagram">Instagram</option>
          <option value="Indicação">Indicação</option>
          <option value="Google">Google</option>
        </select>

        {/* BLOCO VEÍCULO */}
        <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px', color: '#0070f3' }}>🚗 Dados do Veículo</h3>
        <input type="text" placeholder="Marca / Modelo (Ex: Toyota Corolla)" value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} required style={inputStyle} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" placeholder="Ano Modelo" value={anoModelo} onChange={e => setAnoModelo(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Placa" value={placa} onChange={e => setPlaca(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <input type="text" placeholder="Chassi" value={chassi} onChange={e => setChassi(e.target.value)} style={inputStyle} />

        {/* BLOCO CONTRATO E VALORES */}
        <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px', color: '#0070f3' }}>💰 Valores e Contrato</h3>
        <select value={statusFunil} onChange={e => setStatusFunil(e.target.value)} style={inputStyle}>
          <option value="Cotação Solicitada">Cotação Solicitada</option>
          <option value="Proposta Emitida">Proposta Emitida</option>
          <option value="Apólice Ativa">Apólice Ativa</option>
        </select>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" step="0.01" placeholder="Prêmio Total (R$)" value={premioTotal} onChange={e => setPremioTotal(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          <input type="number" step="0.01" placeholder="Comissão (%)" value={porcentagemComissao} onChange={e => setPorcentagemComissao(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ background: '#f0f7ff', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', color: '#0056b3' }}>
          💵 Valor Estimado da Comissão: R$ {comissaoEstimada.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ flex: 1, fontSize: '12px', color: '#666' }}>Início Vigência
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ flex: 1, fontSize: '12px', color: '#666' }}>Fim Vigência (Renovação)
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
          </label>
        </div>

        {/* CLIP DE ANEXO */}
        <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px', color: '#0070f3' }}>📎 Anexar Proposta / Apólice (PDF)</h3>
        <input type="file" accept="application/pdf" onChange={e => setArquivo(e.target.files[0])} style={inputStyle} />

        {/* STATUS E SUBMIT */}
        <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
          Salvar Cadastro Completo
        </button>

        {statusEnvio && <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', color: '#333' }}>{statusEnvio}</div>}
      </form>
    </div>
  );
}

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
};
