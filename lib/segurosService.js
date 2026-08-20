import { supabase } from './supabaseClient';

export async function listarClientesCompleto() {
  try {
    // 1. Busca pura e direta na tabela de clientes
    const { data: listaClientes, error: errCli } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, telefone, email, origem_lead');

    if (errCli) throw errCli;
    if (!listaClientes || listaClientes.length === 0) return [];

    // 2. Busca todas as propostas ativas de uma vez só
    const { data: listaPropostas } = await supabase
      .from('propostas')
      .select('cliente_id, veiculo_modelo, veiculo_placa');

    // 3. Busca todas as apólices ativas de uma vez só
    const { data: listaApolices } = await supabase
      .from('apolices')
      .select('cliente_id, id, numero_apolice, seguradora, url_pdf_apolice');

    // 4. Junta os dados na memória de forma segura (Tolerante a erros de relacionamento)
    const dadosCombinados = listaClientes.map(cliente => {
      // Procura se esse cliente tem uma proposta salva
      const propostaVinculada = listaPropostas?.find(p => p.cliente_id === cliente.id);
      // Procura se esse cliente tem uma apólice salva
      const apoliceVinculada = listaApolices?.find(a => a.cliente_id === cliente.id);

      return {
        ...cliente,
        veiculos: propostaVinculada ? {
          marca_modelo: propostaVinculada.veiculo_modelo,
          placa: propostaVinculada.veiculo_placa
        } : null,
        apolices: apoliceVinculada || null
      };
    });

    return dadosCombinados;

  } catch (error) {
    console.error("Erro operacional no motor do CRM:", error.message);
    // Dispara o alerta para sabermos se o banco caiu ou foi desconectado
    alert("Erro na requisição ao banco de dados: " + error.message);
    return [];
  }
}
