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

// 4. ANEXAR APÓLICE (CORRIGIDO EXTRAÇÃO DE BINÁRIO [0])
async function anexarApolice(arquivoPdf, apoliceId) {
  try {
    // Garante que estamos pegando o arquivo bruto da posição 0
    let arquivoReal = arquivoPdf;
    if (arquivoPdf?.target?.files?.[0]) {
      arquivoReal = arquivoPdf.target.files[0];
    } else if (arquivoPdf instanceof FileList || (typeof arquivoPdf === 'object' && '0' in arquivoPdf)) {
      arquivoReal = arquivoPdf[0];
    }

    if (!arquivoReal) return { success: false, message: "Nenhum arquivo válido localizado." };

    const nomeArquivo = `${apoliceId}-${Date.now()}.pdf`;

    // 1. Faz upload para o Storage Bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apolices-arquivos')
      .upload(`public/${nomeArquivo}`, arquivoReal);

    if (uploadError) return { success: false, message: uploadError.message };

    // 2. Resgata a URL de acesso público na internet
    const { data: urlData } = supabase.storage
      .from('apolices-arquivos')
      .getPublicUrl(`public/${nomeArquivo}`);

    // 3. Atualiza a tabela vinculando o link gerado à apólice certa
    const { error: updateError } = await supabase
      .from('apolices')
      .update({ url_pdf_apolice: urlData.publicUrl })
      .eq('id', apoliceId);

    return { success: !updateError, url: urlData?.publicUrl || '' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 5. BUSCAR LISTA DE CLIENTES DETALHADA
async function listarClientesCompleto() {
  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, email, origem_lead, veiculos(marca_modelo, placa), apolices(id, url_pdf_apolice)')
      .order('nome', { ascending: true });

    if (error) throw error;
    return clientes || [];
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    return [];
  }
}

export {
  buscarContadoresDashboard,
  buscarRenovacoesProximas,
  buscarParcelasFinanceiro,
  anexarApolice,
  listarClientesCompleto
};
