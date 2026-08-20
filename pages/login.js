'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);

    // Valida o e-mail e senha direto no motor do Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      alert(`Falha no acesso: ${error.message}`);
      setCarregando(false);
    } else {
      alert('🔓 Acesso autorizado!');
      window.location.href = '/'; // Redireciona para a Home
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>🔐 Restrito: CRM Administrativo</h2>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '10px', color: '#666' }}>E-mail Institucional:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '20px', color: '#666' }}>Senha de Acesso:
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </label>
        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          {carregando ? 'Verificando...' : 'Entrar no Sistema'}
        </button>
      </form>
    </div>
  );
}
