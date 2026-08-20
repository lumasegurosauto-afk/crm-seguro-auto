'use client';
import { useEffect, useState } from 'react';
import { listarClientesCompleto } from '../lib/segurosService';

export default function Home() {
  const [dadosMapeados, setDadosMapeados] = useState(Array(12).fill(0));
  const [carregando, setCarregando] = useState(true);
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    async function carregarEstatisticas() {
      try {
        const clientes = await listarClientesCompleto();
        const contagemMeses = Array(12).fill(0);

        clientes.forEach(c => {
          // Verifica se o cliente tem apólice com data de início preenchida
          if (c.apolices?.inicio_vigencia) {
            const data = new Date(c.apolices.inicio_vigencia);
            const mes = data.getUTCMonth(); // Pega o mês correto (0 para Janeiro, 1 para Fevereiro...)
            if (mes >= 0 && mes <= 11) {
              contagemMeses[mes] += 1; // Soma +1 seguro emitido naquele mês específico
            }
          }
        });

        setDadosMapeados(contagemMeses);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }
    carregarEstatisticas();
  }, []);

  const maiorVolume = Math.max(...dadosMapeados, 1);
