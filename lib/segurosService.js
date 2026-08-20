// IMPORTAÇÃO QUE ESTAVA FALTANDO:
import { supabase } from './supabaseClient';

export async function listarClientesCompleto() {
  // Busca pura na tabela de clientes, sem fazer cruzamentos (JOIN) que possam quebrar
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj, telefone, email, origem_lead');

  if (error) {
    console.error("Erro na busca direta:", error.message);
    return [];
  }

  return data || [];
}
