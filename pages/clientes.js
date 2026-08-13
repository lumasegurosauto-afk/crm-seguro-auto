import { supabase } from './supabaseClient';

// 1. CONTADORES DO DASHBOARD (Clientes e Propostas)
async function buscarContadoresDashboard() {
  try {
    const { count: totalClientes } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    const { count: totalPropostas } = await supabase
      .from('apolices')
      .select('*', { count: 'exact', head: true })
      .eq('status_funil', 'Cotação Solicitada');

    return { totalClientes: totalClientes || 0, totalPropostas: totalPropostas || 0 };
  } catch (error) {
    console.error("Erro nos contadores:", error);
    return { totalClientes: 0, totalPropostas: 0 };
  }
}

// 2. LISTAR RENOVAÇÕES (Próximos 30 dias)
async function buscarRenovacoesProximas() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const trintaDiasDepois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: renovacoes, error } = await supabase
      .from('apolices')
      .select('id, data_fim_vigencia, premio_total, clientes(nome), veiculos(marca_modelo, placa)')
      .gte('data_fim_vigencia', hoje)
      .lte('data_fim_vigencia', trintaDiasDepois)
      .order('data_fim_vigencia', { ascending: true });

    if (error) throw error;
    return renovacoes || [];
  } catch (error) {
    console.error("Erro nas renovações:", error);
    return [];
  }
}

// 3. FINANCEIRO (Listar parcelas em aberto)
async function buscarParcelasFinanceiro() {
  try {
    const { data: parcelas, error } = await supabase
      .from('parcelas')
      .select('id, numero_parcela, valor_parcela, data_vencimento, status_pagamento, apolices(clientes(nome))')
      .in('status_pagamento', ['Pendente', 'Atrasado'])
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return parcelas || [];
  } catch (error) {
    console.error("Erro no financeiro:", error);
    return [];
  }
}

// 4. ANEXAR APÓLICE (Upload do PDF para o Storage)
async function anexarApolice(arquivoPdf, apoliceId) {
  try {
    const arquivoReal = arquivoPdf.target?.files ? arquivoPdf.target.files[0] : (arquivoPdf[0] || arquivoPdf);
    
    if (!arquivoReal) return { success: false, message: "Nenhum arquivo PDF selecionado" };

    const nomeArquivo = `${apoliceId}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apolices-arquivos')
      .upload(`public/${nomeArquivo}`, arquivoReal);

    if (uploadError) return { success: false, message: uploadError.message };

    const { data: urlData } = supabase.storage
      .from('apolices-arquivos')
      .getPublicUrl(`public/${nomeArquivo}`);

    const { error: updateError } = await supabase
      .from('apolices')
      .update({ url_pdf_apolice: urlData.publicUrl })
      .eq('id', apoliceId);

    return { success: !updateError, url: urlData?.publicUrl || '' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 5. NOVA FUNÇÃO: BUSCAR LISTA DE CLIENTES DETALHADA
async function listarClientesCompleto() {
  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, email, origem_lead, veiculos(marca_modelo, placa)')
      .order('nome', { ascending: true });

    if (error) throw error;
    return clientes || [];
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    return [];
  }
}

// Exportação explícita unificada contendo a nova função de listagem
export {
  buscarContadoresDashboard,
  buscarRenovacoesProximas,
  buscarParcelasFinanceiro,
  anexarApolice,
  listarClientesCompleto
};
