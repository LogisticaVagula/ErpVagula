import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIAS = ['material', 'mao_de_obra', 'servico', 'imposto', 'equipamento', 'outros']
const FORMAS_PAG = ['dinheiro', 'pix', 'boleto', 'cheque', 'transferencia', 'cartao']

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([])
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroObra, setFiltroObra] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    obra_id: '', tipo: 'despesa', categoria: 'material',
    descricao: '', valor: '', data_lancamento: new Date().toISOString().slice(0, 10),
    data_vencimento: '', forma_pagamento: 'pix', nf_numero: '', observacao: '',
  })

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    setLoading(true)
    const [{ data: lanc }, { data: obr }] = await Promise.all([
      supabase.from('lancamentos').select('*, obras(nome, codigo)').order('data_vencimento', { ascending: true }),
      supabase.from('obras').select('id, nome, codigo').eq('status', 'ativa'),
    ])
    setLancamentos(lanc || [])
    setObras(obr || [])
    setLoading(false)
  }

  async function salvarLancamento(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('lancamentos').insert([{
      obra_id: form.obra_id,
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data_lancamento: form.data_lancamento,
      data_vencimento: form.data_vencimento,
      forma_pagamento: form.forma_pagamento,
      nf_numero: form.nf_numero || null,
      observacao: form.observacao || null,
      status: 'pendente',
    }])
    if (error) {
      setErro(error.message)
    } else {
      setForm({
        obra_id: '', tipo: 'despesa', categoria: 'material',
        descricao: '', valor: '', data_lancamento: new Date().toISOString().slice(0, 10),
        data_vencimento: '', forma_pagamento: 'pix', nf_numero: '', observacao: '',
      })
      setMostrarForm(false)
      buscarDados()
    }
    setSalvando(false)
  }

  async function marcarPago(id) {
    await supabase.from('lancamentos').update({
      status: 'pago',
      data_pagamento: new Date().toISOString().slice(0, 10),
    }).eq('id', id)
    buscarDados()
  }

  // Filtros
  const lancFiltrados = lancamentos.filter(l => {
    if (filtroObra && l.obra_id !== filtroObra) return false
    if (filtroTipo && l.tipo !== filtroTipo) return false
    if (filtroStatus && l.status !== filtroStatus) return false
    return true
  })

  // Totais
  const totalReceitas = lancFiltrados.filter(l => l.tipo === 'receita' && l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0)
  const totalDespesas = lancFiltrados.filter(l => l.tipo === 'despesa' && l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0)
  const totalPendente = lancFiltrados.filter(l => l.status === 'pendente').reduce((a, l) => a + Number(l.valor), 0)
  const totalAtrasado = lancFiltrados.filter(l => l.status === 'em_atraso').reduce((a, l) => a + Number(l.valor), 0)

  const stMap = {
    pendente:   { bg: '#FEF3C7', c: '#92400E', l: 'Pendente' },
    pago:       { bg: '#D1FAE5', c: '#065F46', l: 'Pago' },
    em_atraso:  { bg: '#FEE2E2', c: '#991B1B', l: 'Em atraso' },
    cancelado:  { bg: '#F1F5F9', c: '#64748B', l: 'Cancelado' },
  }

  const fmt = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Financeiro</h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{lancamentos.length} lançamento(s)</p>
        </div>
        <button onClick={() => setMostrarForm(true)} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none',
          background: '#1B4FD8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>+ Novo lançamento</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Receitas pagas', valor: totalReceitas, cor: '#059669' },
          { label: 'Despesas pagas', valor: totalDespesas, cor: '#DC2626' },
          { label: 'Pendentes', valor: totalPendente, cor: '#D97706' },
          { label: 'Em atraso', valor: totalAtrasado, cor: '#991B1B' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px' }}>{k.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: k.cor, margin: 0 }}>{fmt(k.valor)}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={sel} value={filtroObra} onChange={e => setFiltroObra(e.target.value)}>
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
        </select>
        <select style={sel} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Receitas e despesas</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select style={sel} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="em_atraso">Em atraso</option>
        </select>
        {(filtroObra || filtroTipo || filtroStatus) && (
          <button onClick={() => { setFiltroObra(''); setFiltroTipo(''); setFiltroStatus('') }} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#64748B',
          }}>Limpar filtros</button>
        )}
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Novo lançamento</h3>
          <form onSubmit={salvarLancamento}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Obra (centro de custo) *</label>
                <select style={inp} value={form.obra_id} onChange={e => setForm(f => ({ ...f, obra_id: e.target.value }))} required>
                  <option value="">Selecione a obra</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Tipo *</label>
                <select style={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Categoria *</label>
                <select style={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Descrição *</label>
                <input style={inp} placeholder="Ex: Compra de cimento CP-II — 200 sacos" value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required />
              </div>

              <div>
                <label style={lbl}>Valor (R$) *</label>
                <input style={inp} type="number" step="0.01" placeholder="0,00" value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required />
              </div>

              <div>
                <label style={lbl}>Forma de pagamento</label>
                <select style={inp} value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                  {FORMAS_PAG.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Data do lançamento *</label>
                <input style={inp} type="date" value={form.data_lancamento}
                  onChange={e => setForm(f => ({ ...f, data_lancamento: e.target.value }))} required />
              </div>

              <div>
                <label style={lbl}>Data de vencimento *</label>
                <input style={inp} type="date" value={form.data_vencimento}
                  onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} required />
              </div>

              <div>
                <label style={lbl}>Número da NF</label>
                <input style={inp} placeholder="Ex: 4521" value={form.nf_numero}
                  onChange={e => setForm(f => ({ ...f, nf_numero: e.target.value }))} />
              </div>

              <div>
                <label style={lbl}>Observação</label>
                <input style={inp} placeholder="Observação opcional" value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>

            </div>
            {erro && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={salvando} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#1B4FD8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                {salvando ? 'Salvando...' : 'Salvar lançamento'}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: 'transparent', cursor: 'pointer', fontSize: 13,
              }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p style={{ color: '#64748B', fontSize: 13 }}>Carregando...</p>
      ) : lancFiltrados.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: 13 }}>Nenhum lançamento encontrado.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFF' }}>
                {['Obra', 'Descrição', 'Categoria', 'Vencimento', 'Valor', 'Forma', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancFiltrados.map((l, i) => {
                const st = stMap[l.status] || stMap.pendente
                const atrasado = l.status === 'pendente' && l.data_vencimento < new Date().toISOString().slice(0, 10)
                return (
                  <tr key={l.id} style={{ borderBottom: '0.5px solid #E2E8F0', background: i % 2 === 0 ? '#fff' : '#F8FAFF' }}>
                    <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.obras?.codigo}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1E293B', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.descricao}</div>
                      {l.nf_numero && <div style={{ fontSize: 10, color: '#94A3B8' }}>NF {l.nf_numero}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{l.categoria?.replace('_', ' ')}</td>
                    <td style={{ padding: '10px 12px', color: atrasado ? '#DC2626' : '#334155', fontWeight: atrasado ? 600 : 400, whiteSpace: 'nowrap' }}>
                      {new Date(l.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {atrasado && <div style={{ fontSize: 10, color: '#DC2626' }}>Em atraso</div>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: l.tipo === 'receita' ? '#059669' : '#DC2626', whiteSpace: 'nowrap' }}>
                      {l.tipo === 'despesa' ? '- ' : '+ '}{fmt(l.valor)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{l.forma_pagamento}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: st.bg, color: st.c, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                        {st.l}
      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {l.status === 'pendente' && (
                        <button onClick={() => marcarPago(l.id)} style={{
                          padding: '3px 10px', borderRadius: 6, border: '1px solid #059669',
                          background: 'transparent', color: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                        }}>Marcar pago</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
const sel = {
  padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0',
  fontSize: 12, color: '#1E293B', background: '#fff', cursor: 'pointer',
}