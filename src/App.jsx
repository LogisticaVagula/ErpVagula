import Obras from './pages/Obras'
import { useState } from 'react'
import { supabase } from './lib/supabase'

const MENU = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'financeiro',  label: 'Financeiro' },
  { id: 'cheques',     label: 'Cheques' },
  { id: 'obras',       label: 'Obras' },
  { id: 'crm',         label: 'CRM Comercial' },
]

export default function App() {
  const [modulo, setModulo] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: '#1E293B',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '14px 12px' : '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 60,
        }}>
          <div style={{
            width: 34, height: 34,
            background: '#1B4FD8',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800,
            flexShrink: 0,
          }}>VG</div>
          {!collapsed && (
            <div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>Grupo Vagula</p>
              <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 10, margin: 0 }}>Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MENU.map(m => (
            <button
              key={m.id}
              onClick={() => setModulo(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px' : '9px 12px',
                borderRadius: 8,
                border: 'none',
                background: modulo === m.id ? '#1B4FD8' : 'transparent',
                color: modulo === m.id ? '#fff' : 'rgba(255,255,255,.5)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: modulo === m.id ? 600 : 400,
                textAlign: 'left',
                width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
              }}
            >
              {!collapsed && m.label}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,.35)', cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {collapsed ? '▸' : '◂ Recolher'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              {MENU.find(m => m.id === modulo)?.label}
            </p>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
              Grupo Vagula · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{
            width: 34, height: 34,
            background: '#1B4FD8',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700,
          }}>VG</div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {modulo === 'dashboard' && <Dashboard />}
          {modulo === 'financeiro' && <Financeiro />}
          {modulo === 'cheques' && <Cheques />}
          {modulo === 'obras' && <Obras />}
          {modulo === 'crm' && <CRM />}
        </main>

      </div>
    </div>
  )
}

// ── MÓDULOS TEMPORÁRIOS (vamos construir um por um) ──────────────
function Dashboard() {
  return <EmBreve nome="Dashboard" />
}
function Financeiro() {
  return <EmBreve nome="Financeiro" />
}
function Cheques() {
  return <EmBreve nome="Cheques" />
}
function CRM() {
  return <EmBreve nome="CRM Comercial" />
}

function EmBreve({ nome }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 60, height: 60,
        background: '#DBEAFE', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 16,
      }}>⚙</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>{nome}</h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Em construção</p>
    </div>
  )
}