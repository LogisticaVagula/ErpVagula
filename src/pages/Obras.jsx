import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Obras() {
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({
    codigo: '', nome: '', responsavel: '',
    orcamento_total: '', data_inicio: '', data_previsao: '', status: 'ativa'
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarObras()
  }, [])

  async function buscarObras() {
    setLoading(true)
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setObras(data || [])
    setLoading(false)
  }

  async function salvarObra(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('obras').insert([{
      codigo: form.codigo,
      nome: form.nome,
      responsavel: form.responsavel,
      orcamento_total: parseFloat(form.orcamento_total) || 0,
      data_inicio: form.data_inicio || null,
      data_previsao: form.data_previsao || null,
      status: form.status,
    }])
    if (error) {
      setErro(error.message)
    } else {
      setForm({ codigo: '', nome: '', responsavel: '', orcamento_total: '', data_inicio: '', data_previsao: '', status: 'ativa' })
      setMostrarForm(false)
      buscarObras()
    }
    setSalvando(false)
  }

  const statusCor = {
    ativa:     { bg: '#DBEAFE', c: '#1E3A8A' },
    concluida: { bg: '#D1FAE5', c: '#065F46' },
    pausada:   { bg: '#FEF3C7', c: '#92400E' },
    cancelada: { bg: '#FEE2E2', c: '#991B1B' },
  }

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Obras</h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{obras.length} obra(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: '#1B4FD8', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          + Nova obra
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 12, padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nova obra</h3>
          <form onSubmit={salvarObra}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Código *</label>
                <input style={inp} placeholder="OBR-2026-001" value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} required />
              </div>
              <div>
                <label style={lbl}>Nome da obra *</label>
                <input style={inp} placeholder="Ex: Galpão Industrial Umuarama" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
              </div>
              <div>
                <label style={lbl}>Responsável</label>
                <input style={inp} placeholder="Nome do engenheiro" value={form.responsavel}
                  onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Orçamento total (R$)</label>
                <input style={inp} type="number" placeholder="0,00" value={form.orcamento_total}
                  onChange={e => setForm(f => ({ ...f, orcamento_total: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Data de início</label>
                <input style={inp} type="date" value={form.data_inicio}
                  onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Previsão de entrega</label>
                <input style={inp} type="date" value={form.data_previsao}
                  onChange={e => setForm(f => ({ ...f, data_previsao: e.target.value }))} />
              </div>
            </div>
            {erro && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={salvando} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#1B4FD8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                {salvando ? 'Salvando...' : 'Salvar obra'}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #E2E8F0', background: 'transparent',
                cursor: 'pointer', fontSize: 13,
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p style={{ color: '#64748B', fontSize: 13 }}>Carregando...</p>
      ) : obras.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: 40, textAlign: 'center',
        }}>
          <p style={{ color: '#64748B', fontSize: 13 }}>Nenhuma obra cadastrada ainda.</p>
          <p style={{ color: '#94A3B8', fontSize: 12 }}>Clique em "+ Nova obra" para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {obras.map(o => {
            const st = statusCor[o.status] || statusCor.ativa
            return (
              <div key={o.id} style={{
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: 12, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{o.codigo}</span>
                    <span style={{
                      background: st.bg, color: st.c,
                      fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                    }}>{o.status}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: '0 0 2px' }}>{o.nome}</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    {o.responsavel && `Resp: ${o.responsavel}`}
                    {o.data_inicio && ` · Início: ${new Date(o.data_inicio).toLocaleDateString('pt-BR')}`}
                    {o.data_previsao && ` · Entrega: ${new Date(o.data_previsao).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                {o.orcamento_total > 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 2px' }}>Orçamento</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1B4FD8', margin: 0 }}>
                      {Number(o.orcamento_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }
const inp = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid #E2E8F0', fontSize: 13, color: '#1E293B',
  background: '#F8FAFF', outline: 'none',
}