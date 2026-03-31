import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setErro('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) { setErro('E-mail ou senha inválidos.'); return }
    onLogin(data.user)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F1F5F9', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0',
        padding: '40px 36px', width: 'min(380px, 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 42, height: 42, background: '#1B4FD8', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0,
          }}>VG</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Grupo Vágula</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Sistema de Gestão</div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', margin: '0 0 20px' }}>
          Entrar no sistema
        </h2>

        {erro && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6,
            padding: '10px 12px', fontSize: 13, color: '#991B1B', marginBottom: 14,
          }}>{erro}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>E-mail</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" autoComplete="email"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              height: 38, padding: '0 12px', border: '1px solid #CBD5E1',
              borderRadius: 6, fontSize: 13, color: '#1E293B',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Senha</label>
          <input
            type="password" value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              height: 38, padding: '0 12px', border: '1px solid #CBD5E1',
              borderRadius: 6, fontSize: 13, color: '#1E293B',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleLogin} disabled={loading}
          style={{
            width: '100%', height: 40, background: loading ? '#93B4F8' : '#1B4FD8',
            color: '#fff', border: 'none', borderRadius: 6,
            fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
          }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 16 }}>
          Acesso restrito — Grupo Vágula
        </p>
      </div>
    </div>
  )
}