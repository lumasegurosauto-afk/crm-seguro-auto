import { supabase } from './supabaseClient';

// ITEM A: CONTADORES DO DASHBOARD (Clientes e Propostas)
export async function buscarContadoresDashboard() {
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true });

  const { count: totalPropostas } = await supabase
    .from('apolices')
    .select('*', { count: 'exact', head: true })
    .eq('status_funil', 'Cotação Solicitada');

  return { totalClientes: totalClientes || 0, totalPropostas: totalPropostas || 0 };
}

// ITEM B: LISTAR RENOVAÇÕES (Próximos 30 dias)
export async function buscarRenovacoesProximas() {
  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasDepois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: renovacoes, error } = await supabase
    .from('apolices')
    .select('id, data_fim_vigencia, premio_total, clientes(nome), veiculos(marca_modelo, placa)')
    .gte('data_fim_vigencia', hoje)
    .lte('data_fim_vigencia', trintaDiasDepois)
    .order('data_fim_vigencia', { ascending: true });

  return error ? [] : renovacoes;
}

// ITEM C: FINANCEIRO (Listar parcelas que precisam de cobrança)
export async function buscarParcelasFinanceiro() {
  const { data: parcelas, error } = await supabase
    .from('parcelas')
    .select('id, numero_parcela, valor_parcela, data_vencimento, status_pagamento, apolices(clientes(nome))')
    .in('status_pagamento', ['Pendente', 'Atrasado'])
    .order('data_vencimento', { ascending: true });

  return error ? [] : parcelas;
}

// ITEM D: ANEXAR APÓLICE (Upload do PDF para o Storage)
export async function anexarApolice(arquivoPdf, apoliceId) {
  const nomeArquivo = `${apoliceId}-${Date.now()}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('apolices-arquivos')
    .upload(`public/${nomeArquivo}`, arquivoPdf);

  if (uploadError) return { success: false, message: uploadError.message };

  const { data: urlData } = supabase.storage
    .from('apolices-arquivos')
    .getPublicUrl(`public/${nomeArquivo}`);

  const { error: updateError } = await supabase
    .from('apolices')
    .update({ url_pdf_apolice: urlData.publicUrl })
    .eq('id', apoliceId);

  return { success: !updateError, url: urlData.publicUrl };
}
