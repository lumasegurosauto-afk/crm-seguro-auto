import { supabase } from './supabaseClient';

export async function listarClientesCompleto() {
  try {
    // 1. Busca direta na tabela de clientes
    const { data: listaClientes, error: errCli } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, email, origem_lead');

    if (errCli) throw errCli;
    if (!listaClientes || listaClientes.length === 0) return [];

    // 2. Busca na tabela de propostas
    const { data: listaPropostas } = await supabase
      .from('propostas')
      .select('cliente_id, veiculo_modelo, veiculo_placa');

    // 3. Busca na tabela de apólices
    const { data: listaApolices } = await supabase
      .from('apolices')
      .select('cliente_id, id, numero_apolice, seguradora, url_pdf_apolice, inicio_vigencia, fim_vigencia');

    // 4. Junta os dados estruturando exatamente como a tabela do frontend espera ler
    const dadosCombinados = listaClientes.map(cliente => {
      const propostaVinculada = listaPropostas?.find(p => p.cliente_id === cliente.id);
      const apoliceVinculada = listaApolices?.find(a => a.cliente_id === cliente.id);

      return {
        ...cliente,
        // Alinhando o objeto veículo para a tabela ler {carro?.marca_modelo}
        veiculos: propostaVinculada ? {
          marca_modelo: propostaVinculada.veiculo_modelo,
          placa: propostaVinculada.veiculo_placa
        } : null,
        // Repassando a apólice com todas as colunas de vigência e controle
        apolices: apoliceVinculada || null
      };
    });

    return dadosCombinados;

  } catch (error) {
    console.error("Erro operacional no motor do CRM:", error.message);
    return [];
  }
}
