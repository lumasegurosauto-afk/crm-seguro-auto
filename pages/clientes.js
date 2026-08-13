'use client';

import { useEffect, useState } from 'react';
import { listarClientesCompleto } from '../lib/segurosService'; // Rota corrigida!

export default function ListaClientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarClientesCompleto().then(res => {
      setClientes(res);
      setCarregando(false);
    });
  }, []);

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
                <th style={{ padding: '12px' }}>Veículo Cadastrado</th>
                <th style={{ padding: '12px' }}>Origem</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{c.nome}</td>
                  <td style={{ padding: '12px', color: '#555' }}>{c.cpf_cnpj}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>
                    📞 {c.telefone || 'Não informado'}<br />
                    ✉️ {c.email || 'Não informado'}
                  </td>
                  <td style={{ padding: '12px', color: '#0070f3', fontWeight: '500' }}>
                    🚗 {c.veiculos?.[0]?.marca_modelo || c.veiculos?.marca_modelo || 'Nenhum carro vinculado'}<br />
                    <span style={{ fontSize: '12px', color: '#666' }}>Placa: {c.veiculos?.[0]?.placa || c.veiculos?.placa || '-'}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                      {c.origem_lead || 'Direto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
