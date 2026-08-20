export async function listarClientesCompleto() {
  // O segredo está em buscar os dados de tabelas associadas usando sub-consultas flexíveis
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id,
      nome,
      cpf_cnpj,
      telefone,
      email,
      origem_lead,
      veiculos (
        marca_modelo,
        placa
      ),
      apolices (
        id,
        url_pdf_apolice,
        numero_apolice,
        seguradora
      )
    `);

  if (error) {
    console.error("Erro interno na consulta ao Supabase:", error.message);
    return [];
  }

  return data;
}
