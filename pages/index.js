'use client';
import { useEffect, useState } from 'react';
import { listarClientesCompleto } from '../lib/segurosService';

export default function Home() {
  const [dadosMapeados, setDadosMapeados] = useState(Array(12).fill(0));
  const [totalSegurados, setTotalSegurados] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    async function carregarEstatisticas() {
      try {
        const clientes = await listarClientesCompleto();
        setTotalSegurados(clientes?.length || 0);

        const contagemMeses = Array(12).fill(0);
        
        clientes.forEach(c => {
          // Captura a string bruta da data ("YYYY-MM-DD") direto do banco
          const dataBruta = c.apolices?.inicio_vigencia || c.inicio_vigencia;
          
          if (dataBruta && typeof dataBruta === 'string') {
            // Divide o texto pelos traços
            const partes = dataBruta.split('-');
            if (partes.length >= 2) {
              // Pega o segundo pedaço (o mês) e converte em número
              const mesNum = parseInt(partes[1], 10); 
              const indexMes = mesNum - 1; // Transforma o mês 01 em índice 0 (Janeiro)
              
              if (indexMes >= 0 && indexMes <= 11) {
                contagemMeses[indexMes] += 1;
              }
            }
          }
        });
        
        setDadosMapeados(contagemMeses);
      } catch (err) { 
        console.error("Erro no gráfico:", err); 
      } finally { 
        setCarregando(false); 
      }
    }
    carregarEstatisticas();
  }, []);

  const maiorVolume = Math.max(...dadosMapeados, 1);

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <h1 style={{ margin: 0, color: '#333' }}>🚀 Painel de Controle CRM Seguros</h1>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px', width: '250px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>📋 Carteira de Segurados</h4>
        <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>
          {carregando ? '...' : totalSegurados} {totalSegurados === 1 ? 'Segurado' : 'Segurados'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
        <a href="/cadastro" style={{ padding: '12px 20px', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>📝 Novo Cadastro</a>
        <a href="/clientes" style={{ padding: '12px 20px', background: '#10b981', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>👤 Ver Segurados</a>
      </div>

      <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>📊 Produção Mensal de Seguros (Volume de Emissões)</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 25px 0' }}>Gráfico gerado em tempo real com base na data de Início de Vigência.</p>
        {carregando ? <p style={{ color: '#0070f3', fontWeight: 'bold' }}>🔄 Calculando volumes...</p> : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '200px', padding: '10px 20px', borderBottom: '2px solid #cbd5e1', background: '#f8fafc', borderRadius: '6px' }}>
            {dadosMapeados.map((quantidade, index) => {
              const alturaBarra = (quantidade / maiorVolume) * 100;
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  {quantidade > 0 && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>{quantidade}</span>}
                  <div style={{ width: '60%', height: `${alturaBarra || 4}%`, background: quantidade > 0 ? '#0070f3' : '#e2e8f0', borderRadius: '4px 4px 0 0', minHeight: quantidade > 0 ? '15px' : '4px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '8px' }}>{mesesNomes[index]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
