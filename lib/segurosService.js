import { supabase } from './supabaseClient';

export async function listarClientesCompleto() {
  // Busca os clientes e traz junto os dados vinculados de propostas e apólices
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cpf_cnpj,
      telefone,
      email,
      origem_lead,
      propostas (
        veiculo_modelo,
        veiculo_placa
      ),
      apolices (
        id,
        numero_apolice,
        seguradora,
        inicio_vigencia,
        fim_vigencia,
        url_pdf_apolice
      )
    `);

  if (error) {
    console.error("Erro na busca cruzada do CRM:", error.message);
    return [];
  }

  // Tratamento de dados: Garante que as sub-tabelas retornem como objetos simples e não arrays
  const dadosFormatados = data?.map(cliente => {
    return {
      ...cliente,
      // Se houver uma proposta vinculada, pega a primeira da lista
      veiculos: Array.isArray(cliente.propostas) && cliente.propostas.length > 0 
        ? { marca_modelo: cliente.propostas[0].veiculo_modelo, placa: cliente.propostas[0].veiculo_placa }
        : cliente.propostas || null,
      
      // Se houver uma apólice vinculada, pega a primeira da lista
      apolices: Array.isArray(cliente.apolices) && cliente.apolices.length > 0
        ? cliente.apolices[0]
        : cliente.apolices || null
    };
  });

  return dadosFormatados || [];
}
