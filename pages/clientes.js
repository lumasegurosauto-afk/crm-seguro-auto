'use client';

import { useEffect, useState } from 'react';
import { listarClientesCompleto, anexarApolice } from '../lib/segurosService';

export default function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [statusUpload, setStatusUpload] = useState({});

  // Função para carregar ou recarregar os dados da tela
  async function atualizarLista() {
    const res = await listarClientesCompleto();
    setClientes(res);
    setCarregando(false);
  }

  useEffect(() => {
    atualizarLista();
  }, []);

  // Função que gerencia o upload tardio da apólice
  async function handleUploadTardio(e, apoliceId, clienteId) {
    const arquivoSelecionado = e.target.files?.[0];
    if (!arquivoSelecionado || !apoliceId) return;

    // Define o status de carregando para esta linha específica
    setStatusUpload(prev => ({ ...prev, [clienteId]: 'Enviando...' }));

    try {
      const resultado = await anexarApolice(arquivoSelecionado, apoliceId);
      
      if (resultado.success) {
        setStatusUpload(prev => ({ ...prev, [clienteId]: '✅ Sucesso!' }));
        // Recarrega a tabela para o botão azul aparecer na hora
        await atualizarLista();
      } else {
        alert(`Falha no upload: ${resultado.message}`);
        setStatusUpload(prev => ({ ...prev, [clienteId]: '' }));
      }
    } catch (error) {
      alert(`Erro no sistema: ${error.message}`);
      setStatusUpload(prev => ({ ...prev, [clienteId]: '' }));
    }
  }

  if (carregando) return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando listagem de clientes...</div>;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>👤 Clientes Cadastrados</h1>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← Voltar ao Painel</a>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {clientes.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>Nenhum cliente localizado no banco de dados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', color: '#666' }}>
                <th style={{ padding: '12px' }}>Nome</th>
                <th style={{ padding: '12px' }}>CPF / CNPJ</th>
                <th style={{ padding: '12px' }}>Contato</th>
                <th style={{ padding: '12px' }}>Veículo</th>
                <th style={{ padding: '12px' }}>Origem</th>
                <th style={{ padding: '12px' }}>Apólice / Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const carro = c.veiculos;
                // Busca a primeira apólice vinculada ao cliente
                const apolice = Array.isArray(c.apolices) ? c.apolices[0] : c.apolices;

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{c.nome}</td>
                    <td style={{ padding: '12px', color: '#555' }}>{c.cpf_cnpj}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>
                      📞 {c.telefone || 'Não informado'}<br />
                      ✉️ {c.email || 'Não informado'}
                    </td>
                    <td style={{ padding: '12px', color: '#0070f3', fontWeight: '500' }}>
                      🚗 {carro?.marca_modelo || 'Nenhum carro vinculado'}<br />
                      <span style={{ fontSize: '12px', color: '#666' }}>Placa: {carro?.placa || '-'}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                        {c.origem_lead || 'Direto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {/* Se já tiver o PDF, mostra o botão azul tradicional */}
                      {apolice?.url_pdf_apolice ? (
                        <a 
                          href={apolice.url_pdf_apolice} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ background: '#0070f3', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}
                        >
                          📄 Ver PDF
                        </a>
                      ) : apolice?.id ? (
                        // Se não tiver o PDF mas tiver uma apólice/proposta criada, mostra o seletor de arquivo
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>📎 Anexar Apólice:</label>
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            onChange={(e) => handleUploadTardio(e, apolice.id, c.id)}
                            style={{ fontSize: '12px', maxWidth: '180px' }}
                          />
                          {statusUpload[c.id] && (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff9800' }}>
                              {statusUpload[c.id]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>Sem apólice no funil</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
