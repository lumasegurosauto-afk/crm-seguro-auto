import { supabase } from './supabaseClient';

export async function listarClientesCompleto() {
  try {
    const { data: listaClientes, error: errCli } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, email, origem_lead');

    if (errCli) throw errCli;
    if (!listaClientes || listaClientes.length === 0) return [];

    const { data: listaPropostas } = await supabase
      .from('propostas')
      .select('cliente_id, veiculo_modelo, veiculo_placa, valor_calculado, comissao_valor, status');

    const { data: listaApolices } = await supabase
      .from('apolices')
      .select('cliente_id, id, numero_apolice, seguradora, url_pdf_apolice, inicio_vigencia, fim_vigencia');

    const dadosCombinados = listaClientes.map(cliente => {
      const propostaVinculada = listaPropostas?.find(p => p.cliente_id === cliente.id);
      const apoliceVinculada = listaApolices?.find(a => a.cliente_id === cliente.id);

      return {
        ...cliente,
        veiculos: propostaVinculada ? {
          marca_modelo: propostaVinculada.veiculo_modelo,
          placa: propostaVinculada.veiculo_placa
        } : null,
        apolices: apoliceVinculada || null,
        valor_calculado: propostaVinculada?.valor_calculado || 0,
        comissao_valor: propostaVinculada?.comissao_valor || 0,
        status: propostaVinculada?.status || 'Cálculo'
      };
    });

    return dadosCombinados;
  } catch (error) {
    console.error("Erro operacional no motor do CRM:", error.message);
    return [];
  }
}
