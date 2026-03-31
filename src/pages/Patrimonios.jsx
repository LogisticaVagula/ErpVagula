import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── CONSTANTES ───────────────────────────────────────────────
const CATEGORIAS_PADRAO = [
  'Maquinário pesado', 'Veículo', 'Caminhão Munck',
  'Ferramenta elétrica', 'Ferramenta manual',
  'Equipamento de segurança', 'Andaime / Estrutura',
  'Gerador / Elétrico', 'Outro'
]

const STATUS_LIST = ['Disponível', 'Uso interno', 'Alugado', 'Manutenção', 'Revisão', 'Inativo']

const TIPO_MOV = [
  'Saída para obra', 'Retorno ao pátio', 'Envio para aluguel',
  'Retorno de aluguel', 'Envio para manutenção', 'Retorno de manutenção',
  'Recebimento de terceiro', 'Devolução a terceiro',
]

const STATUS_MOV_SUGERIDO = {
  'Saída para obra': 'Uso interno',
  'Retorno ao pátio': 'Disponível',
  'Envio para aluguel': 'Alugado',
  'Retorno de aluguel': 'Disponível',
  'Envio para manutenção': 'Manutenção',
  'Retorno de manutenção': 'Disponível',
  'Recebimento de terceiro': 'Uso interno',
  'Devolução a terceiro': 'Inativo',
}

const STATUS_STYLE = {
  'Disponível':   { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'Uso interno':  { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
  'Alugado':      { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
  'Manutenção':   { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
  'Revisão':      { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD' },
  'Inativo':      { bg: '#F8FAFC', color: '#64748B', border: '#CBD5E1' },
}

const PROP_STYLE = {
  'Próprio':             { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'Alugado de terceiro': { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmtData  = d => d ? d.split('-').reverse().join('/') : '—'
const fmtR     = v => v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'
const hoje     = () => new Date().toISOString().split('T')[0]
const diasPara = d => d ? Math.round((new Date(d) - new Date(hoje())) / 86400000) : null

// ─── UI ATOMS ─────────────────────────────────────────────────
function Badge({ label, style }) {
  const s = style || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function Cod({ value }) {
  return (
    <code style={{
      background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 4,
      padding: '2px 7px', fontSize: 11,
      fontFamily: "'Consolas','Courier New',monospace", color: '#1B4FD8',
    }}>{value}</code>
  )
}

function ManutSpan({ date }) {
  if (!date) return <span style={{ color: '#94A3B8' }}>—</span>
  const diff = diasPara(date)
  if (diff < 0)  return <span style={{ color: '#991B1B', fontWeight: 600 }}>{fmtData(date)} ⚠</span>
  if (diff <= 7) return <span style={{ color: '#92400E', fontWeight: 600 }}>{fmtData(date)} ({diff}d)</span>
  return <span style={{ color: '#64748B' }}>{fmtData(date)}</span>
}

function Spinner({ full }) {
  const el = <div style={{
    width: 28, height: 28, border: '3px solid #E2E8F0',
    borderTopColor: '#1B4FD8', borderRadius: '50%',
    animation: 'spin .7s linear infinite',
  }} />
  if (!full) return el
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>{el}</div>
}

function Btn({ children, onClick, variant = 'default', disabled, style, title }) {
  const variants = {
    default: { background: '#fff', color: '#1E293B', border: '1px solid #CBD5E1' },
    primary: { background: '#1B4FD8', color: '#fff', border: '1px solid #1B4FD8', fontWeight: 600 },
    success: { background: '#065F46', color: '#fff', border: '1px solid #065F46', fontWeight: 600 },
    danger:  { background: '#991B1B', color: '#fff', border: '1px solid #991B1B', fontWeight: 600 },
    ghost:   { background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0' },
    warn:    { background: '#92400E', color: '#fff', border: '1px solid #92400E', fontWeight: 600 },
  }
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 32, padding: '0 12px', borderRadius: 6, fontSize: 12,
      cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
      whiteSpace: 'nowrap', opacity: disabled ? .5 : 1, transition: 'all .12s',
      ...variants[variant], ...style,
    }}>{children}</button>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  return { toast, show }
}

function Toast({ toast }) {
  if (!toast) return null
  const colors = { success: '#065F46', error: '#991B1B', info: '#1E40AF' }
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      background: colors[toast.type] || colors.success, color: '#fff',
      padding: '10px 18px', borderRadius: 8, fontSize: 13,
      boxShadow: '0 4px 12px rgba(0,0,0,.2)', maxWidth: 320,
    }}>{toast.msg}</div>
  )
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          border: 'none', background: 'none', fontFamily: 'inherit',
          color: active === t.id ? '#1B4FD8' : '#64748B',
          borderBottom: active === t.id ? '2px solid #1B4FD8' : '2px solid transparent',
          marginBottom: -2,
        }}>{t.label}</button>
      ))}
    </div>
  )
}

// ─── MODAL ────────────────────────────────────────────────────
function Modal({ open, onClose, title, width = 600, children, footer }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '30px 20px', overflowY: 'auto',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: `min(${width}px, 100%)`,
        boxShadow: '0 8px 40px rgba(0,0,0,.18)', margin: 'auto',
      }}>
        <div style={{
          padding: '16px 20px 14px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#fff',
          borderRadius: '12px 12px 0 0', zIndex: 1,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94A3B8', fontSize: 22, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        <div style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid #E2E8F0',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            position: 'sticky', bottom: 0, background: '#fff',
            borderRadius: '0 0 12px 12px',
          }}>{footer}</div>
        )}
      </div>
    </div>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────
function Confirm({ open, msg, onOk, onCancel }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 'min(360px,100%)', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
        <p style={{ fontSize: 14, color: '#1E293B', marginBottom: 20 }}>{msg}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={onCancel}>Cancelar</Btn>
          <Btn variant="danger" onClick={onOk}>Confirmar</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── FORM HELPERS ─────────────────────────────────────────────
const FG = ({ label, children, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>{label}</label>
    {children}
  </div>
)

const inp = {
  height: 36, padding: '0 10px', border: '1px solid #CBD5E1',
  borderRadius: 6, fontSize: 13, color: '#1E293B',
  fontFamily: 'inherit', background: '#fff', outline: 'none',
}

const Input = ({ value, onChange, ...props }) => (
  <input value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ ...inp, ...props.style }} {...props} />
)
const Select = ({ value, onChange, children, ...props }) => (
  <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ ...inp, ...props.style }} {...props}>{children}</select>
)
const Textarea = ({ value, onChange, ...props }) => (
  <textarea value={value ?? ''} onChange={e => onChange(e.target.value)}
    style={{ padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, color: '#1E293B', fontFamily: 'inherit', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 70, ...props.style }}
    {...props} />
)

// ─── DROPZONE ─────────────────────────────────────────────────
function Dropzone({ onFiles, label }) {
  const [over, setOver] = useState(false)
  const ref = useRef()
  const handle = files => { const arr = Array.from(files).filter(f => f.size <= 20971520); if (arr.length) onFiles(arr) }
  return (
    <div onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
      style={{ border: `2px dashed ${over ? '#1B4FD8' : '#CBD5E1'}`, borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', background: over ? '#EFF6FF' : '#F8FAFC', transition: 'all .2s' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{label || 'Clique ou arraste arquivos'}</p>
      <small style={{ fontSize: 11, color: '#94A3B8' }}>PDF, JPG, PNG, XLS — máx. 20MB</small>
      <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" style={{ display: 'none' }}
        onChange={e => { handle(e.target.files); e.target.value = '' }} />
    </div>
  )
}

function FileList({ files, onRemove }) {
  if (!files.filter(Boolean).length) return null
  const icon = f => f.type?.includes('pdf') ? '📕' : f.type?.includes('image') ? '🖼️' : '📊'
  const size = b => b < 1048576 ? (b / 1024).toFixed(1) + 'KB' : (b / 1048576).toFixed(1) + 'MB'
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map((f, i) => f && (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6 }}>
          <span style={{ fontSize: 16 }}>{icon(f)}</span>
          <span style={{ flex: 1, fontSize: 12, color: '#1E293B', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{size(f.size)}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 16, padding: '0 2px' }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ─── FORM PATRIMÔNIO ──────────────────────────────────────────
const EMPTY_PAT = {
  cod: '', categoria: '', descricao: '', num_serie: '', placa: '',
  ano_fab: '', proprietario: 'Próprio', status: 'Disponível',
  local_atual: '', fornecedor: '', valor_locacao: '',
  diaria_aluguel: '', valor_aquisicao: '', data_aquisicao: '',
  data_prox_manut: '', hodometro_atual: '', observacoes: '',
}

const EMPTY_MOV = { patrimonio_id: '', tipo: 'Saída para obra', data_mov: hoje(), status_novo: 'Uso interno', destino: '', responsavel: '', hodometro: '', observacoes: '' }
const EMPTY_MAN = { patrimonio_id: '', tipo: 'Preventiva', status_manut: 'Em andamento', data_entrada: hoje(), data_saida: '', servico: '', prestador: '', contato: '', num_nf: '', hodometro: '', custo_mao_obra: '', custo_pecas: '', prox: '', observacoes: '' }

// ─── MÓDULO PRINCIPAL ─────────────────────────────────────────
export default function Patrimonios() {
  const [items, setItems]     = useState([])
  const [movs, setMovs]       = useState([])
  const [manuts, setManuts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('lista')
  const [busca, setBusca]     = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fCateg, setFCateg]   = useState('')
  const [categorias, setCategorias] = useState(CATEGORIAS_PADRAO)
  const { toast, show }       = useToast()

  // Modais
  const [modalPat, setModalPat] = useState(false)
  const [modalMov, setModalMov] = useState(false)
  const [modalMan, setModalMan] = useState(false)
  const [modalDet, setModalDet] = useState(null)
  const [modalAnx, setModalAnx] = useState(null)
  const [modalAnxList, setModalAnxList] = useState([])
  const [modalTab, setModalTab] = useState('dados')
  const [confirm, setConfirm]   = useState(null)

  // Forms
  const [form, setForm]     = useState(EMPTY_PAT)
  const [editId, setEditId] = useState(null)
  const [editMovId, setEditMovId] = useState(null)
  const [editManId, setEditManId] = useState(null)
  const [fotoFile, setFotoFile]   = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formMov, setFormMov] = useState(EMPTY_MOV)
  const [filesMov, setFilesMov] = useState([])
  const [formMan, setFormMan] = useState(EMPTY_MAN)
  const [filesMan, setFilesMan] = useState([])

  // nova categoria
  const [novaCateg, setNovaCateg]   = useState('')
  const [showNovaC, setShowNovaC]   = useState(false)

  useEffect(() => { carregar() }, [])

  // ── CARREGAR ─────────────────────────────────────────────────
  async function carregar() {
    setLoading(true)
    const [r1, r2, r3] = await Promise.all([
      supabase.from('patrimonios').select('*').eq('ativo', true).order('cod'),
      supabase.from('pat_movimentacoes').select('*').order('data_mov', { ascending: false }).limit(500),
      supabase.from('pat_manutencoes').select('*').order('data_entrada', { ascending: false }).limit(500),
    ])
    if (r1.data) {
      setItems(r1.data)
      const cats = [...new Set([...CATEGORIAS_PADRAO, ...r1.data.map(i => i.categoria).filter(Boolean)])]
      setCategorias(cats)
    }
    if (r2.data) setMovs(r2.data)
    if (r3.data) setManuts(r3.data)
    setLoading(false)
  }

  // ── FILTROS ──────────────────────────────────────────────────
  const filtrados = items.filter(i => {
    if (fStatus && i.status !== fStatus) return false
    if (fCateg  && i.categoria !== fCateg) return false
    if (busca) {
      const b = busca.toLowerCase()
      if (!((i.descricao||'').toLowerCase().includes(b) || (i.cod||'').toLowerCase().includes(b) || (i.local_atual||'').toLowerCase().includes(b))) return false
    }
    return true
  })

  // ── STATS ────────────────────────────────────────────────────
  const stats = {
    total:      items.length,
    disp:       items.filter(i => i.status === 'Disponível').length,
    uso:        items.filter(i => i.status === 'Uso interno').length,
    alugado:    items.filter(i => i.status === 'Alugado').length,
    manut:      items.filter(i => i.status === 'Manutenção' || i.status === 'Revisão').length,
    alertas:    items.filter(i => i.data_prox_manut && diasPara(i.data_prox_manut) <= 7).length,
    receitaDia: items.filter(i => i.status === 'Alugado').reduce((a, i) => a + (i.diaria_aluguel || 0), 0),
  }

  // ── PATRIMÔNIO: SALVAR ────────────────────────────────────────
  async function salvarPat() {
    if (!form.cod || !form.descricao || !form.categoria) { show('Preencha Código, Categoria e Descrição.', 'error'); return }
    setSaving(true)
    let foto_url = editId ? items.find(i => i.id === editId)?.foto_url : null
    if (fotoFile) {
      const path = `${form.cod.replace(/[^a-z0-9]/gi, '-')}/${Date.now()}_${fotoFile.name}`
      const { error: upErr } = await supabase.storage.from('patrimonios-fotos').upload(path, fotoFile, { upsert: true })
      if (!upErr) { const { data: u } = supabase.storage.from('patrimonios-fotos').getPublicUrl(path); foto_url = u.publicUrl }
    }
    const obj = {
      cod: form.cod, categoria: form.categoria, descricao: form.descricao,
      num_serie: form.num_serie || null, placa: form.placa || null,
      ano_fab: parseInt(form.ano_fab) || null, data_aquisicao: form.data_aquisicao || null,
      proprietario: form.proprietario, status: form.status, local_atual: form.local_atual || null,
      fornecedor: form.fornecedor || null, valor_locacao: parseFloat(form.valor_locacao) || null,
      diaria_aluguel: parseFloat(form.diaria_aluguel) || null,
      valor_aquisicao: parseFloat(form.valor_aquisicao) || null,
      data_prox_manut: form.data_prox_manut || null,
      hodometro_atual: parseInt(form.hodometro_atual) || null,
      observacoes: form.observacoes || null, foto_url, ativo: true,
    }
    const { error } = editId
      ? await supabase.from('patrimonios').update(obj).eq('id', editId)
      : await supabase.from('patrimonios').insert(obj)
    setSaving(false)
    if (error) { show('Erro ao salvar: ' + error.message, 'error'); return }
    show(editId ? 'Patrimônio atualizado.' : 'Patrimônio cadastrado.')
    setModalPat(false)
    await carregar()
  }

  async function apagarPat(id) {
    setConfirm({
      msg: 'Excluir este patrimônio? Todo o histórico será removido.',
      onOk: async () => {
        setConfirm(null)
        await supabase.from('patrimonios').update({ ativo: false }).eq('id', id)
        show('Patrimônio removido.')
        await carregar()
      }
    })
  }

  // ── PATRIMÔNIO: STATUS RÁPIDO ─────────────────────────────────
  async function mudarStatus(id, novoStatus) {
    await supabase.from('patrimonios').update({ status: novoStatus }).eq('id', id)
    setItems(p => p.map(i => i.id === id ? { ...i, status: novoStatus } : i))
    show('Status atualizado.')
  }

  // ── PATRIMÔNIO: ABRIR FORM ────────────────────────────────────
  function abrirNovoPat() {
    setEditId(null); setForm(EMPTY_PAT); setFotoFile(null); setFotoPreview(null)
    setModalTab('dados'); setShowNovaC(false); setNovaCateg('')
    setModalPat(true)
  }

  function abrirEditarPat(item) {
    setEditId(item.id)
    setForm({
      cod: item.cod||'', categoria: item.categoria||'', descricao: item.descricao||'',
      num_serie: item.num_serie||'', placa: item.placa||'', ano_fab: item.ano_fab||'',
      proprietario: item.proprietario||'Próprio', status: item.status||'Disponível',
      local_atual: item.local_atual||'', fornecedor: item.fornecedor||'',
      valor_locacao: item.valor_locacao||'', diaria_aluguel: item.diaria_aluguel||'',
      valor_aquisicao: item.valor_aquisicao||'', data_aquisicao: item.data_aquisicao||'',
      data_prox_manut: item.data_prox_manut||'', hodometro_atual: item.hodometro_atual||'',
      observacoes: item.observacoes||'',
    })
    setFotoFile(null); setFotoPreview(item.foto_url||null)
    setModalTab('dados'); setShowNovaC(false); setNovaCateg('')
    setModalPat(true)
  }

  // ── MOVIMENTAÇÃO ─────────────────────────────────────────────
  function abrirMov(item) {
    setEditMovId(null)
    setFormMov({ ...EMPTY_MOV, patrimonio_id: item?.id || '', data_mov: hoje() })
    setFilesMov([])
    setModalTab('dados')
    setModalMov(true)
  }

  function abrirEditarMov(v) {
    setEditMovId(v.id)
    setFormMov({
      patrimonio_id: v.patrimonio_id, tipo: v.tipo, data_mov: v.data_mov,
      status_novo: v.status_novo||'', destino: v.destino||'',
      responsavel: v.responsavel||'', hodometro: v.hodometro||'', observacoes: v.observacoes||'',
    })
    setFilesMov([])
    setModalTab('dados')
    setModalMov(true)
  }

  async function salvarMov() {
    if (!formMov.patrimonio_id) { show('Selecione um patrimônio.', 'error'); return }
    setSaving(true)
    const pat = items.find(i => i.id === formMov.patrimonio_id)
    const obj = {
      patrimonio_id: formMov.patrimonio_id,
      tipo: formMov.tipo,
      data_mov: formMov.data_mov || hoje(),
      origem: editMovId ? undefined : (pat?.local_atual || 'Pátio Vágula'),
      destino: formMov.destino || null,
      responsavel: formMov.responsavel || null,
      hodometro: parseInt(formMov.hodometro) || null,
      status_anterior: editMovId ? undefined : pat?.status,
      status_novo: formMov.status_novo || null,
      observacoes: formMov.observacoes || null,
    }
    // Remove campos undefined
    Object.keys(obj).forEach(k => obj[k] === undefined && delete obj[k])

    let movId = editMovId
    if (editMovId) {
      const { error } = await supabase.from('pat_movimentacoes').update(obj).eq('id', editMovId)
      if (error) { setSaving(false); show('Erro: ' + error.message, 'error'); return }
    } else {
      const { data: md, error } = await supabase.from('pat_movimentacoes').insert(obj).select().single()
      if (error) { setSaving(false); show('Erro: ' + error.message, 'error'); return }
      movId = md.id
      // Atualiza status e local no patrimônio imediatamente
      if (formMov.status_novo) {
        await supabase.from('patrimonios').update({
          status: formMov.status_novo,
          local_atual: formMov.destino || pat?.local_atual,
        }).eq('id', formMov.patrimonio_id)
      }
    }

    if (!editMovId && filesMov.filter(Boolean).length) {
      await uploadAnexos(filesMov, 'pat_movimentacoes', movId)
    }

    setSaving(false)
    show(editMovId ? 'Movimentação atualizada.' : 'Movimentação registrada.')
    setModalMov(false)
    await carregar()
  }

  async function apagarMov(id) {
    setConfirm({
      msg: 'Excluir esta movimentação? O status do patrimônio não será revertido automaticamente.',
      onOk: async () => {
        setConfirm(null)
        await supabase.from('pat_movimentacoes').delete().eq('id', id)
        setMovs(p => p.filter(v => v.id !== id))
        show('Movimentação excluída.')
      }
    })
  }

  // Quando tipo muda, sugere status automaticamente
  function onTipoMovChange(tipo) {
    const sugerido = STATUS_MOV_SUGERIDO[tipo] || formMov.status_novo
    setFormMov(p => ({ ...p, tipo, status_novo: sugerido }))
  }

  // ── MANUTENÇÃO ───────────────────────────────────────────────
  function abrirMan(item) {
    setEditManId(null)
    setFormMan({ ...EMPTY_MAN, patrimonio_id: item?.id || '', data_entrada: hoje() })
    setFilesMan([])
    setModalTab('dados')
    setModalMan(true)
  }

  function abrirEditarMan(v) {
    setEditManId(v.id)
    setFormMan({
      patrimonio_id: v.patrimonio_id, tipo: v.tipo, status_manut: v.status_manut,
      data_entrada: v.data_entrada||'', data_saida: v.data_saida||'',
      servico: v.servico||'', prestador: v.prestador||'', contato: v.contato_prestador||'',
      num_nf: v.num_nf||'', hodometro: v.hodometro||'',
      custo_mao_obra: v.custo_mao_obra||'', custo_pecas: v.custo_pecas||'',
      prox: v.data_prox_manut||'', observacoes: v.observacoes||'',
    })
    setFilesMan([])
    setModalTab('dados')
    setModalMan(true)
  }

  async function salvarMan() {
    if (!formMan.patrimonio_id || !formMan.servico) { show('Preencha patrimônio e serviço.', 'error'); return }
    setSaving(true)
    const obj = {
      patrimonio_id: formMan.patrimonio_id, tipo: formMan.tipo, status_manut: formMan.status_manut,
      data_entrada: formMan.data_entrada || hoje(), data_saida: formMan.data_saida || null,
      servico: formMan.servico, prestador: formMan.prestador || null,
      contato_prestador: formMan.contato || null, num_nf: formMan.num_nf || null,
      hodometro: parseInt(formMan.hodometro) || null,
      custo_mao_obra: parseFloat(formMan.custo_mao_obra) || 0,
      custo_pecas: parseFloat(formMan.custo_pecas) || 0,
      data_prox_manut: formMan.prox || null, observacoes: formMan.observacoes || null,
    }

    let manId = editManId
    if (editManId) {
      const { error } = await supabase.from('pat_manutencoes').update(obj).eq('id', editManId)
      if (error) { setSaving(false); show('Erro: ' + error.message, 'error'); return }
    } else {
      const { data: md, error } = await supabase.from('pat_manutencoes').insert(obj).select().single()
      if (error) { setSaving(false); show('Erro: ' + error.message, 'error'); return }
      manId = md.id
    }

    // Atualiza próxima manutenção no patrimônio se concluída
    if (formMan.prox && formMan.status_manut === 'Concluída') {
      await supabase.from('patrimonios').update({ data_prox_manut: formMan.prox }).eq('id', formMan.patrimonio_id)
    }

    if (!editManId && filesMan.filter(Boolean).length) {
      await uploadAnexos(filesMan, 'pat_manutencoes', manId)
    }

    setSaving(false)
    show(editManId ? 'Manutenção atualizada.' : 'Manutenção registrada.')
    setModalMan(false)
    await carregar()
  }

  async function apagarMan(id) {
    setConfirm({
      msg: 'Excluir este registro de manutenção?',
      onOk: async () => {
        setConfirm(null)
        await supabase.from('pat_manutencoes').delete().eq('id', id)
        setManuts(p => p.filter(v => v.id !== id))
        show('Manutenção excluída.')
      }
    })
  }

  const custoTotal = () => (parseFloat(formMan.custo_mao_obra)||0) + (parseFloat(formMan.custo_pecas)||0)

  // ── ANEXOS ───────────────────────────────────────────────────
  async function uploadAnexos(files, tabela, id) {
    for (const file of files) {
      if (!file) continue
      const path = `${tabela}/${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('patrimonios-anexos').upload(path, file)
      if (error) continue
      const { data: u } = supabase.storage.from('patrimonios-anexos').getPublicUrl(path)
      await supabase.from('pat_anexos').insert({
        tabela_ref: tabela, registro_id: id, nome_arquivo: file.name,
        mime_type: file.type, tamanho_bytes: file.size, storage_path: path, storage_url: u.publicUrl,
      })
    }
  }

  async function verAnexos(tabela, id) {
    const { data } = await supabase.from('pat_anexos').select('*')
      .eq('tabela_ref', tabela).eq('registro_id', id).order('created_at', { ascending: false })
    setModalAnxList(data || [])
    setModalAnx(id)
  }

  async function deletarAnexo(anx) {
    setConfirm({
      msg: 'Excluir este anexo?',
      onOk: async () => {
        setConfirm(null)
        await supabase.storage.from('patrimonios-anexos').remove([anx.storage_path])
        await supabase.from('pat_anexos').delete().eq('id', anx.id)
        setModalAnxList(p => p.filter(a => a.id !== anx.id))
        show('Anexo excluído.')
      }
    })
  }

  // ── ALERTAS ──────────────────────────────────────────────────
  const alertas = items
    .filter(i => i.data_prox_manut && diasPara(i.data_prox_manut) <= 30)
    .sort((a, b) => diasPara(a.data_prox_manut) - diasPara(b.data_prox_manut))

  // ── RENDER ───────────────────────────────────────────────────
  if (loading) return <><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><Spinner full /></>

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Toast toast={toast} />

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Patrimônios & Maquinários</h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Controle unificado — maquinários, veículos, ferramentas e equipamentos</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',      val: stats.total,   color: '#1E293B' },
          { label: 'Disponível', val: stats.disp,    color: '#065F46' },
          { label: 'Uso Interno',val: stats.uso,     color: '#1E40AF' },
          { label: 'Alugado',    val: stats.alugado, color: '#92400E', sub: fmtR(stats.receitaDia)+'/dia' },
          { label: 'Manutenção', val: stats.manut,   color: '#991B1B' },
          { label: 'Alertas',    val: stats.alertas, color: '#991B1B' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 4, lineHeight: 1 }}>{s.val}</div>
            {s.sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* TABS */}
      <Tabs tabs={[
        { id: 'lista', label: 'Lista' },
        { id: 'movimentacoes', label: 'Movimentações' },
        { id: 'manutencoes', label: 'Manutenções' },
        { id: 'alertas', label: `Alertas${stats.alertas > 0 ? ` (${stats.alertas})` : ''}` },
      ]} active={tab} onChange={setTab} />

      {/* ── LISTA ── */}
      {tab === 'lista' && <>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar…"
            style={{ height: 34, padding: '0 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, width: 220, outline: 'none' }} />
          <select value={fStatus} onChange={e => setFStatus(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={fCateg} onChange={e => setFCateg(e.target.value)}
            style={{ height: 34, padding: '0 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" onClick={abrirNovoPat}>+ Novo Patrimônio</Btn>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Código','Descrição','Categoria','Propriedade','Status','Local / Obra','Próx. Manut.','Ações'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length ? filtrados.map((item, i) => (
                  <tr key={item.id} style={{ background: i % 2 ? '#FAFBFC' : '#fff' }}>
                    <td style={{ padding: '10px 12px' }}><Cod value={item.cod} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#1E293B' }}>{item.descricao}</strong>
                      {item.num_serie && <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.num_serie}{item.placa ? ' · '+item.placa : ''}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{item.categoria}</td>
                    <td style={{ padding: '10px 12px' }}><Badge label={item.proprietario} style={PROP_STYLE[item.proprietario]} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      {/* Status com dropdown rápido */}
                      <select value={item.status} onChange={e => mudarStatus(item.id, e.target.value)}
                        style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                          border: `1px solid ${STATUS_STYLE[item.status]?.border||'#CBD5E1'}`,
                          background: STATUS_STYLE[item.status]?.bg||'#F1F5F9',
                          color: STATUS_STYLE[item.status]?.color||'#475569', cursor: 'pointer', outline: 'none' }}>
                        {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{item.local_atual||'—'}</td>
                    <td style={{ padding: '10px 12px' }}><ManutSpan date={item.data_prox_manut} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Btn variant="ghost" onClick={() => setModalDet(item)}>Ver</Btn>
                        <Btn variant="ghost" onClick={() => abrirEditarPat(item)}>Editar</Btn>
                        <Btn variant="primary" onClick={() => abrirMov(item)}>Mover</Btn>
                        <Btn variant="ghost" onClick={() => abrirMan(item)}>Manut.</Btn>
                        <Btn variant="danger" onClick={() => apagarPat(item.id)}>🗑</Btn>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Nenhum patrimônio encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ── MOVIMENTAÇÕES ── */}
      {tab === 'movimentacoes' && <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Btn variant="primary" onClick={() => abrirMov(null)}>+ Registrar Movimentação</Btn>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Data','Patrimônio','Tipo','Origem','Destino / Obra','Status Novo','Responsável','Ações'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movs.length ? movs.map((v, i) => {
                  const pat = items.find(x => x.id === v.patrimonio_id)
                  return (
                    <tr key={v.id} style={{ background: i%2 ? '#FAFBFC':'#fff' }}>
                      <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtData(v.data_mov)}</td>
                      <td style={{ padding: '10px 12px' }}><Cod value={pat?.cod||'?'} /></td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{v.tipo}</td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{v.origem||'—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{v.destino||'—'}</td>
                      <td style={{ padding: '10px 12px' }}>{v.status_novo ? <Badge label={v.status_novo} style={STATUS_STYLE[v.status_novo]} /> : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{v.responsavel||'—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn variant="ghost" onClick={() => verAnexos('pat_movimentacoes', v.id)}>📎</Btn>
                          <Btn variant="ghost" onClick={() => abrirEditarMov(v)}>Editar</Btn>
                          <Btn variant="danger" onClick={() => apagarMov(v.id)}>🗑</Btn>
                        </div>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Nenhuma movimentação.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ── MANUTENÇÕES ── */}
      {tab === 'manutencoes' && <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Btn variant="primary" onClick={() => abrirMan(null)}>+ Registrar Manutenção</Btn>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Data','Patrimônio','Tipo','Serviço','Prestador','Custo Total','Status','Próx. Prev.','Ações'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {manuts.length ? manuts.map((v, i) => {
                  const pat = items.find(x => x.id === v.patrimonio_id)
                  const stBadge = { Concluída: STATUS_STYLE['Disponível'], 'Em andamento': STATUS_STYLE['Uso interno'], 'Aguardando peça': STATUS_STYLE['Alugado'], Cancelada: STATUS_STYLE['Inativo'] }
                  return (
                    <tr key={v.id} style={{ background: i%2 ? '#FAFBFC':'#fff' }}>
                      <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtData(v.data_entrada)}</td>
                      <td style={{ padding: '10px 12px' }}><Cod value={pat?.cod||'?'} /></td>
                      <td style={{ padding: '10px 12px' }}><Badge label={v.tipo} style={v.tipo==='Preventiva'?STATUS_STYLE['Uso interno']:v.tipo==='Corretiva'?STATUS_STYLE['Manutenção']:STATUS_STYLE['Revisão']} /></td>
                      <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.servico}>{v.servico}</td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{v.prestador||'—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{fmtR(v.custo_total)}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={v.status_manut} style={stBadge[v.status_manut]||STATUS_STYLE['Inativo']} /></td>
                      <td style={{ padding: '10px 12px' }}><ManutSpan date={v.data_prox_manut} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn variant="ghost" onClick={() => verAnexos('pat_manutencoes', v.id)}>📎</Btn>
                          <Btn variant="ghost" onClick={() => abrirEditarMan(v)}>Editar</Btn>
                          <Btn variant="danger" onClick={() => apagarMan(v.id)}>🗑</Btn>
                        </div>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Nenhuma manutenção.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ── ALERTAS ── */}
      {tab === 'alertas' && (
        alertas.length ? alertas.map(item => {
          const diff = diasPara(item.data_prox_manut)
          const c = diff < 0 ? { bg:'#FEF2F2', border:'#FCA5A5', txt:'#991B1B' } : { bg:'#FFFBEB', border:'#FCD34D', txt:'#92400E' }
          return (
            <div key={item.id} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:8, border:`1px solid ${c.border}`, background:c.bg, marginBottom:10, alignItems:'center' }}>
              <span style={{ fontSize:16 }}>{diff<0?'⚠':'⚡'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1E293B' }}>{item.cod} — {diff<0?`Manutenção VENCIDA há ${Math.abs(diff)} dia(s)`:`Manutenção em ${diff} dia(s)`}</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{item.descricao} · {fmtData(item.data_prox_manut)}</div>
              </div>
              <Btn variant="ghost" onClick={() => setModalDet(item)}>Ver</Btn>
              <Btn variant="primary" onClick={() => abrirMan(item)}>Registrar Manut.</Btn>
            </div>
          )
        }) : (
          <div style={{ padding:'16px', borderRadius:8, border:'1px solid #6EE7B7', background:'#ECFDF5', display:'flex', gap:12 }}>
            <span>✓</span>
            <div><div style={{ fontSize:13, fontWeight:600, color:'#065F46' }}>Nenhum alerta no momento</div><div style={{ fontSize:12, color:'#64748B' }}>Todas as manutenções estão em dia.</div></div>
          </div>
        )
      )}

      {/* ═══ MODAL PATRIMÔNIO ═══ */}
      <Modal open={!!modalPat} onClose={() => setModalPat(false)}
        title={editId ? 'Editar Patrimônio' : 'Novo Patrimônio'} width={700}
        footer={<><Btn onClick={() => setModalPat(false)}>Cancelar</Btn><Btn variant="primary" onClick={salvarPat} disabled={saving}>{saving?'Salvando…':'Salvar'}</Btn></>}>
        <Tabs tabs={[{id:'dados',label:'Dados'},{id:'foto',label:'Foto'}]} active={modalTab} onChange={setModalTab} />
        {modalTab === 'dados' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FG label="Código *"><Input value={form.cod} onChange={v=>setForm(p=>({...p,cod:v}))} placeholder="Ex: VEI-001 / MAQ-001" /></FG>
            <FG label="Categoria *">
              <div style={{ display:'flex', gap:6 }}>
                <Select value={form.categoria} onChange={v=>setForm(p=>({...p,categoria:v}))} style={{ flex:1 }}>
                  <option value="">Selecione…</option>
                  {categorias.map(c=><option key={c}>{c}</option>)}
                </Select>
                <Btn onClick={()=>setShowNovaC(v=>!v)} variant="ghost" style={{ padding:'0 10px', flexShrink:0 }}>+</Btn>
              </div>
              {showNovaC && (
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <Input value={novaCateg} onChange={setNovaCateg} placeholder="Nova categoria…" style={{ flex:1 }} />
                  <Btn variant="primary" onClick={()=>{ if(novaCateg.trim()){ setCategorias(p=>[...new Set([...p,novaCateg.trim()])]); setForm(p=>({...p,categoria:novaCateg.trim()})); setNovaCateg(''); setShowNovaC(false) }}} style={{ padding:'0 10px', flexShrink:0 }}>OK</Btn>
                </div>
              )}
            </FG>
            <FG label="Descrição *" full><Input value={form.descricao} onChange={v=>setForm(p=>({...p,descricao:v}))} placeholder="Ex: Caminhão Munck Volvo FH 460 – ABC-1234" /></FG>
            <FG label="N° de Série"><Input value={form.num_serie} onChange={v=>setForm(p=>({...p,num_serie:v}))} /></FG>
            <FG label="Placa"><Input value={form.placa} onChange={v=>setForm(p=>({...p,placa:v}))} placeholder="ABC-1234" /></FG>
            <FG label="Ano"><Input value={form.ano_fab} onChange={v=>setForm(p=>({...p,ano_fab:v}))} type="number" /></FG>
            <FG label="Data Aquisição"><Input value={form.data_aquisicao} onChange={v=>setForm(p=>({...p,data_aquisicao:v}))} type="date" /></FG>
            <div style={{ gridColumn:'1/-1', fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em', paddingBottom:6, borderBottom:'1px solid #E2E8F0', marginTop:4 }}>Propriedade e Situação</div>
            <FG label="Propriedade"><Select value={form.proprietario} onChange={v=>setForm(p=>({...p,proprietario:v}))}><option>Próprio</option><option>Alugado de terceiro</option></Select></FG>
            <FG label="Status"><Select value={form.status} onChange={v=>setForm(p=>({...p,status:v}))}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</Select></FG>
            <FG label="Local / Obra atual" full><Input value={form.local_atual} onChange={v=>setForm(p=>({...p,local_atual:v}))} placeholder="Ex: Obra Galpão Maringá / Pátio Vágula" /></FG>
            {form.proprietario==='Alugado de terceiro' && <>
              <FG label="Fornecedor"><Input value={form.fornecedor} onChange={v=>setForm(p=>({...p,fornecedor:v}))} /></FG>
              <FG label="Valor Locação Mensal (R$)"><Input value={form.valor_locacao} onChange={v=>setForm(p=>({...p,valor_locacao:v}))} type="number" /></FG>
            </>}
            <div style={{ gridColumn:'1/-1', fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em', paddingBottom:6, borderBottom:'1px solid #E2E8F0', marginTop:4 }}>Valores</div>
            <FG label="Diária Aluguel (R$)"><Input value={form.diaria_aluguel} onChange={v=>setForm(p=>({...p,diaria_aluguel:v}))} type="number" /></FG>
            <FG label="Valor Aquisição (R$)"><Input value={form.valor_aquisicao} onChange={v=>setForm(p=>({...p,valor_aquisicao:v}))} type="number" /></FG>
            <div style={{ gridColumn:'1/-1', fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em', paddingBottom:6, borderBottom:'1px solid #E2E8F0', marginTop:4 }}>Manutenção</div>
            <FG label="Próxima Manutenção"><Input value={form.data_prox_manut} onChange={v=>setForm(p=>({...p,data_prox_manut:v}))} type="date" /></FG>
            <FG label="Horímetro / Km"><Input value={form.hodometro_atual} onChange={v=>setForm(p=>({...p,hodometro_atual:v}))} type="number" /></FG>
            <FG label="Observações" full><Textarea value={form.observacoes} onChange={v=>setForm(p=>({...p,observacoes:v}))} /></FG>
          </div>
        ) : (
          <div>
            {fotoPreview && <img src={fotoPreview} alt="Preview" style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, marginBottom:12 }} />}
            <div onClick={()=>document.getElementById('foto-input').click()}
              style={{ border:'2px dashed #CBD5E1', borderRadius:10, padding:24, textAlign:'center', cursor:'pointer', background:'#F8FAFC' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>📷</div>
              <p style={{ fontSize:13, color:'#64748B', margin:0 }}>Clique para selecionar a foto do equipamento</p>
              <small style={{ fontSize:11, color:'#94A3B8' }}>JPG, PNG — máx. 10MB</small>
              <input id="foto-input" type="file" accept="image/*" style={{ display:'none' }}
                onChange={e=>{ if(e.target.files[0]){ setFotoFile(e.target.files[0]); setFotoPreview(URL.createObjectURL(e.target.files[0])) }}} />
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ MODAL MOVIMENTAÇÃO ═══ */}
      <Modal open={!!modalMov} onClose={() => setModalMov(false)}
        title={editMovId ? 'Editar Movimentação' : 'Registrar Movimentação'} width={640}
        footer={<><Btn onClick={() => setModalMov(false)}>Cancelar</Btn><Btn variant="primary" onClick={salvarMov} disabled={saving}>{saving?'Salvando…':'Registrar'}</Btn></>}>
        <Tabs tabs={[{id:'dados',label:'Dados'},{id:'anx',label:'Anexos'}]} active={modalTab} onChange={setModalTab} />
        {modalTab === 'dados' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FG label="Patrimônio *" full>
              <Select value={formMov.patrimonio_id} onChange={v=>setFormMov(p=>({...p,patrimonio_id:v}))}>
                <option value="">Selecione…</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.cod} – {i.descricao.substring(0,40)}</option>)}
              </Select>
            </FG>
            <FG label="Tipo *">
              <Select value={formMov.tipo} onChange={onTipoMovChange}>
                {TIPO_MOV.map(t=><option key={t}>{t}</option>)}
              </Select>
            </FG>
            <FG label="Data *"><Input value={formMov.data_mov} onChange={v=>setFormMov(p=>({...p,data_mov:v}))} type="date" /></FG>
            <FG label="Novo Status do Patrimônio">
              <Select value={formMov.status_novo} onChange={v=>setFormMov(p=>({...p,status_novo:v}))}>
                {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
              </Select>
            </FG>
            <FG label="Destino / Obra / Cliente" full>
              <Input value={formMov.destino} onChange={v=>setFormMov(p=>({...p,destino:v}))} placeholder="Ex: Obra Galpão Maringá / Cliente XYZ" />
            </FG>
            <FG label="Responsável"><Input value={formMov.responsavel} onChange={v=>setFormMov(p=>({...p,responsavel:v}))} /></FG>
            <FG label="Horímetro / Km"><Input value={formMov.hodometro} onChange={v=>setFormMov(p=>({...p,hodometro:v}))} type="number" /></FG>
            <FG label="Observações" full><Textarea value={formMov.observacoes} onChange={v=>setFormMov(p=>({...p,observacoes:v}))} /></FG>
            {!editMovId && formMov.patrimonio_id && formMov.status_novo && (
              <div style={{ gridColumn:'1/-1', background:'#EFF6FF', border:'1px solid #93C5FD', borderRadius:6, padding:'10px 12px', fontSize:12, color:'#1E40AF' }}>
                ℹ️ Ao registrar, o patrimônio <strong>{items.find(i=>i.id===formMov.patrimonio_id)?.cod}</strong> terá status atualizado para <strong>{formMov.status_novo}</strong>
              </div>
            )}
          </div>
        ) : (
          <>
            <Dropzone onFiles={f=>setFilesMov(p=>[...p,...f])} label="Termos de saída, recibos, fotos…" />
            <FileList files={filesMov} onRemove={i=>setFilesMov(p=>p.map((f,j)=>j===i?null:f))} />
          </>
        )}
      </Modal>

      {/* ═══ MODAL MANUTENÇÃO ═══ */}
      <Modal open={!!modalMan} onClose={() => setModalMan(false)}
        title={editManId ? 'Editar Manutenção' : 'Registrar Manutenção'} width={700}
        footer={<><Btn onClick={() => setModalMan(false)}>Cancelar</Btn><Btn variant="primary" onClick={salvarMan} disabled={saving}>{saving?'Salvando…':'Registrar'}</Btn></>}>
        <Tabs tabs={[{id:'dados',label:'Dados'},{id:'anx',label:'NFs e Anexos'}]} active={modalTab} onChange={setModalTab} />
        {modalTab === 'dados' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FG label="Patrimônio *" full>
              <Select value={formMan.patrimonio_id} onChange={v=>setFormMan(p=>({...p,patrimonio_id:v}))}>
                <option value="">Selecione…</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.cod} – {i.descricao.substring(0,40)}</option>)}
              </Select>
            </FG>
            <FG label="Tipo *"><Select value={formMan.tipo} onChange={v=>setFormMan(p=>({...p,tipo:v}))}><option>Preventiva</option><option>Corretiva</option><option>Revisão geral</option></Select></FG>
            <FG label="Status"><Select value={formMan.status_manut} onChange={v=>setFormMan(p=>({...p,status_manut:v}))}><option>Em andamento</option><option>Concluída</option><option>Aguardando peça</option><option>Cancelada</option></Select></FG>
            <FG label="Data Entrada *"><Input value={formMan.data_entrada} onChange={v=>setFormMan(p=>({...p,data_entrada:v}))} type="date" /></FG>
            <FG label="Data Saída"><Input value={formMan.data_saida} onChange={v=>setFormMan(p=>({...p,data_saida:v}))} type="date" /></FG>
            <FG label="Serviço Realizado *" full><Textarea value={formMan.servico} onChange={v=>setFormMan(p=>({...p,servico:v}))} placeholder="Descreva o serviço, peças trocadas, diagnóstico…" /></FG>
            <FG label="Prestador / Mecânico"><Input value={formMan.prestador} onChange={v=>setFormMan(p=>({...p,prestador:v}))} /></FG>
            <FG label="Contato"><Input value={formMan.contato} onChange={v=>setFormMan(p=>({...p,contato:v}))} /></FG>
            <FG label="N° Nota Fiscal"><Input value={formMan.num_nf} onChange={v=>setFormMan(p=>({...p,num_nf:v}))} /></FG>
            <FG label="Horímetro / Km"><Input value={formMan.hodometro} onChange={v=>setFormMan(p=>({...p,hodometro:v}))} type="number" /></FG>
            <div style={{ gridColumn:'1/-1', fontSize:11, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em', paddingBottom:6, borderBottom:'1px solid #E2E8F0', marginTop:4 }}>Custos</div>
            <FG label="Custo Mão de Obra (R$)"><Input value={formMan.custo_mao_obra} onChange={v=>setFormMan(p=>({...p,custo_mao_obra:v}))} type="number" /></FG>
            <FG label="Custo Peças (R$)"><Input value={formMan.custo_pecas} onChange={v=>setFormMan(p=>({...p,custo_pecas:v}))} type="number" /></FG>
            <FG label="Custo Total (R$)">
              <input readOnly value={custoTotal().toLocaleString('pt-BR',{minimumFractionDigits:2})} style={{ ...inp, background:'#F8FAFC', fontWeight:600 }} />
            </FG>
            <FG label="Próxima Manutenção Prevista">
              <Input value={formMan.prox} onChange={v=>setFormMan(p=>({...p,prox:v}))} type="date" />
            </FG>
            <FG label="Observações" full><Textarea value={formMan.observacoes} onChange={v=>setFormMan(p=>({...p,observacoes:v}))} /></FG>
          </div>
        ) : (
          <>
            <Dropzone onFiles={f=>setFilesMan(p=>[...p,...f])} label="NFs, laudos, orçamentos, fotos de peças…" />
            <FileList files={filesMan} onRemove={i=>setFilesMan(p=>p.map((f,j)=>j===i?null:f))} />
          </>
        )}
      </Modal>

      {/* ═══ MODAL DETALHE ═══ */}
      <Modal open={!!modalDet} onClose={() => setModalDet(null)}
        title={modalDet ? `${modalDet.cod} — ${modalDet.descricao}` : ''} width={700}
        footer={<><Btn onClick={() => setModalDet(null)}>Fechar</Btn><Btn variant="primary" onClick={() => { setModalDet(null); abrirEditarPat(modalDet) }}>Editar</Btn></>}>
        {modalDet && (() => {
          const item = modalDet
          const movHist = movs.filter(v => v.patrimonio_id === item.id)
          const manHist = manuts.filter(v => v.patrimonio_id === item.id)
          return (
            <div>
              {item.foto_url && <img src={item.foto_url} alt="Foto" style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, marginBottom:14 }} />}
              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                <Badge label={item.status} style={STATUS_STYLE[item.status]} />
                <Badge label={item.proprietario} style={PROP_STYLE[item.proprietario]} />
                <Badge label={item.categoria} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                {[
                  ['Local / Obra', item.local_atual||'—'],
                  ['N° Série', item.num_serie||'—'],
                  ['Placa', item.placa||'—'],
                  ['Ano', item.ano_fab||'—'],
                  ['Horímetro', item.hodometro_atual||'—'],
                  ['Diária Aluguel', fmtR(item.diaria_aluguel)],
                  ['Próx. Manutenção', item.data_prox_manut ? fmtData(item.data_prox_manut) : '—'],
                  ['Valor Aquisição', fmtR(item.valor_aquisicao)],
                  ...(item.fornecedor ? [['Fornecedor', item.fornecedor], ['Valor Locação', fmtR(item.valor_locacao)+'/mês']] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ padding:'9px 0', borderBottom:'1px solid #F0F4F8' }}>
                    <div style={{ fontSize:11, fontWeight:500, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.04em' }}>{lbl}</div>
                    <div style={{ fontSize:13, color:'#1E293B', fontWeight:500, marginTop:2 }}>{val}</div>
                  </div>
                ))}
              </div>
              {item.observacoes && <div style={{ marginTop:10, padding:'10px 12px', background:'#F8FAFC', borderRadius:6, fontSize:13, color:'#64748B' }}>{item.observacoes}</div>}
              {movHist.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, paddingBottom:6, borderBottom:'1px solid #E2E8F0' }}>Movimentações ({movHist.length})</div>
                  {movHist.map(v => (
                    <div key={v.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #F0F4F8', fontSize:13, alignItems:'center' }}>
                      <span style={{ color:'#94A3B8', fontSize:12, minWidth:80 }}>{fmtData(v.data_mov)}</span>
                      <span style={{ flex:1 }}>{v.tipo} → {v.destino||'—'} {v.status_novo ? <Badge label={v.status_novo} style={STATUS_STYLE[v.status_novo]} /> : ''} <small style={{ color:'#94A3B8' }}>{v.responsavel||''}</small></span>
                    </div>
                  ))}
                </div>
              )}
              {manHist.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, paddingBottom:6, borderBottom:'1px solid #E2E8F0' }}>Manutenções ({manHist.length}) — Total: {fmtR(manHist.reduce((a,v)=>a+(v.custo_total||0),0))}</div>
                  {manHist.map(v => (
                    <div key={v.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #F0F4F8', fontSize:13 }}>
                      <span style={{ color:'#94A3B8', fontSize:12, minWidth:80 }}>{fmtData(v.data_entrada)}</span>
                      <span style={{ flex:1 }}>{v.tipo}: {v.servico} <small style={{ color:'#94A3B8' }}>{v.prestador||''}{v.custo_total?' · '+fmtR(v.custo_total):''}</small></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* ═══ MODAL ANEXOS ═══ */}
      <Modal open={!!modalAnx} onClose={() => setModalAnx(null)} title="Anexos" width={560}
        footer={<Btn onClick={() => setModalAnx(null)}>Fechar</Btn>}>
        {modalAnxList.length ? modalAnxList.map(a => (
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:6, marginBottom:6 }}>
            <span style={{ fontSize:18 }}>{a.mime_type?.includes('pdf')?'📕':a.mime_type?.includes('image')?'🖼️':'📊'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_arquivo}</div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
            <a href={a.storage_url} target="_blank" rel="noreferrer"><Btn variant="ghost">Abrir</Btn></a>
            <Btn variant="danger" onClick={() => deletarAnexo(a)}>🗑</Btn>
          </div>
        )) : <p style={{ color:'#94A3B8', fontSize:13, padding:'20px 0' }}>Nenhum anexo vinculado.</p>}
      </Modal>

      {/* ═══ CONFIRM ═══ */}
      <Confirm open={!!confirm} msg={confirm?.msg} onOk={confirm?.onOk} onCancel={() => setConfirm(null)} />
    </div>
  )
}