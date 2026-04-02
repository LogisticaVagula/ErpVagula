import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Obras from './pages/Obras'
import Patrimonios from './pages/Patrimonios'
import Financeiro from './pages/Financeiro'
import Abrigos from './pages/Abrigos'

const BRAND = '#1B4FD8'

const MENU = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  },
  {
    id: 'obras', label: 'Obras',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  },
  {
    id: 'patrimonios', label: 'Patrimônios',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
  },
  {
    id: 'abrigos', label: 'Abrigos',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'fabricacao', label: 'Fabricação',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: 'almoxarifado', label: 'Almoxarifado',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    id: 'compras', label: 'Compras',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
  },
  {
    id: 'financeiro', label: 'Financeiro',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  {
    id: 'cheques', label: 'Cheques',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    id: 'crm', label: 'CRM Comercial',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    id: 'rh', label: 'RH & Equipes',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  },
  {
    id: 'fluxos', label: 'Fluxogramas',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>,
  },
]

// Módulos já construídos
const MODULOS_ATIVOS = ['obras', 'patrimonios', 'financeiro', 'abrigos']

export default function App() {
  const [user, setUser]           = useState(null)
  const [checking, setChecking]   = useState(true)
  const [modulo, setModulo]       = useState('abrigos')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #E2E8F0',
        borderTopColor: BRAND, borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return <Login onLogin={setUser} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 58 : 220,
        background: '#1E293B',
        display: 'flex', flexDirection: 'column',
        transition: 'width .2s', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '13px 12px' : '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', gap: 10, minHeight: 58,
        }}>
          <div style={{
            width: 34, height: 34, background: BRAND, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0, letterSpacing: '-.5px',
          }}>VG</div>
          {!collapsed && (
            <div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>Grupo Vágula</p>
              <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 10, margin: 0, whiteSpace: 'nowrap' }}>Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {MENU.map(m => {
            const ativo = modulo === m.id
            const construido = MODULOS_ATIVOS.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => setModulo(m.id)}
                title={collapsed ? m.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 9,
                  padding: collapsed ? '9px 0' : '8px 10px',
                  borderRadius: 8, border: 'none',
                  background: ativo ? BRAND : 'transparent',
                  color: ativo ? '#fff' : construido ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.3)',
                  cursor: 'pointer', fontSize: 12,
                  fontWeight: ativo ? 600 : 400,
                  textAlign: 'left', width: '100%',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                  transition: 'background .12s',
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: collapsed ? 'auto' : 20, justifyContent: 'center' }}>
                  {m.icon}
                </span>
                {!collapsed && (
                  <span style={{ flex: 1 }}>{m.label}</span>
                )}
                {!collapsed && !construido && (
                  <span style={{
                    fontSize: 9, background: 'rgba(255,255,255,.08)',
                    color: 'rgba(255,255,255,.3)', padding: '1px 5px',
                    borderRadius: 10, flexShrink: 0,
                  }}>breve</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div style={{ padding: '8px 6px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {!collapsed && (
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,.3)',
              padding: '0 4px 6px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{user.email}</div>
          )}
          <button onClick={handleLogout} title="Sair" style={{
            width: '100%', padding: collapsed ? '8px' : '7px 10px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,.1)',
            background: 'transparent', color: 'rgba(255,255,255,.4)',
            cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 7, marginBottom: 4,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {!collapsed && 'Sair'}
          </button>
          <button onClick={() => setCollapsed(c => !c)} style={{
            width: '100%', padding: '6px',
            borderRadius: 8, border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,.2)',
            cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start', gap: 7,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
            </svg>
            {!collapsed && 'Recolher'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E2E8F0',
          padding: '0 24px', height: 54,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              {MENU.find(m => m.id === modulo)?.label}
            </p>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
              Grupo Vágula · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{
            background: '#EFF6FF', borderRadius: 8, padding: '4px 10px',
            fontSize: 11, color: BRAND, fontWeight: 500,
          }}>{user.email}</div>
        </header>

        {/* Conteúdo */}
        <main style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#F8FAFC' }}>
          {modulo === 'dashboard'    && <EmBreve nome="Dashboard"       icon="⊞" desc="Visão geral de obras, financeiro, patrimônios e alertas em tempo real." />}
          {modulo === 'obras'        && <Obras />}
          {modulo === 'patrimonios'  && <Patrimonios />}
          {modulo === 'abrigos'      && <Abrigos />}
          {modulo === 'fabricacao'   && <EmBreve nome="Fabricação"      icon="🏭" desc="Ordens de serviço, rastreabilidade de peças pré-moldadas e estruturas metálicas." />}
          {modulo === 'almoxarifado' && <EmBreve nome="Almoxarifado"    icon="📦" desc="Estoque de materiais, ferramentas e EPIs. Entradas e saídas por obra." />}
          {modulo === 'compras'      && <EmBreve nome="Compras"         icon="🛒" desc="Requisições de obra, cotações, pedidos de compra e recebimento de materiais." />}
          {modulo === 'financeiro'   && <Financeiro />}
          {modulo === 'cheques'      && <EmBreve nome="Cheques"         icon="💳" desc="Controle de cheques de terceiros, endossos, parciais e pré-datados." />}
          {modulo === 'crm'          && <EmBreve nome="CRM Comercial"   icon="📊" desc="Pipeline de negócios, propostas, contatos e histórico de clientes." />}
          {modulo === 'rh'           && <EmBreve nome="RH & Equipes"    icon="👥" desc="Cadastro de colaboradores, alocação por obra, ponto e EPIs." />}
          {modulo === 'fluxos'       && <EmBreve nome="Fluxogramas"     icon="🔀" desc="Fluxos de processos da empresa — venda, execução, financeiro e logística." />}
        </main>

      </div>
    </div>
  )
}

function EmBreve({ nome, icon, desc }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, background: '#DBEAFE', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, marginBottom: 16,
      }}>{icon}</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>{nome}</h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', maxWidth: 360, lineHeight: 1.6 }}>{desc}</p>
      <span style={{
        fontSize: 11, background: '#FEF3C7', color: '#92400E',
        padding: '4px 12px', borderRadius: 20, fontWeight: 500,
      }}>Em construção</span>
    </div>
  )
}