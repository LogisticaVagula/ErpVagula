import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const D = {
  bg: '#0a0a0a', card: '#111111', border: '#222222',
  text: '#e0e0e0', muted: '#666666', input: '#1a1a1a',
}

const STATUS = {
  disponivel: { label: 'Disponível',  color: '#00ff88', border: '#00ff8833', card: '#001a0e' },
  alugado:    { label: 'Alugado',     color: '#4da6ff', border: '#4da6ff33', card: '#001428' },
  em_atraso:  { label: 'Em Atraso',   color: '#ff4444', border: '#ff444433', card: '#1a0000' },
  manutencao: { label: 'Manutenção',  color: '#bb44ff', border: '#bb44ff33', card: '#0f0018' },
  retirada:   { label: 'Retirada',    color: '#ffdd00', border: '#ffdd0033', card: '#1a1500' },
  ag_entrega: { label: 'Ag. Entrega', color: '#ff8800', border: '#ff880033', card: '#1a0a00' },
}

const FORMAS_PAG = ['PIX', 'Dinheiro', 'Transferência', 'Boleto', 'Cheque']

const fmt    = v => !v && v !== 0 ? '-' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtD   = d => { if (!d) return '-'; const [y,m,dia] = String(d).split('-'); return `${dia}/${m}/${y}` }
const hoje   = () => new Date().toISOString().split('T')[0]
const addM   = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x.toISOString().split('T')[0] }

function getStatusKey(abrigo, parcelas) {
  if (abrigo.em_manutencao || abrigo.status === 'manutencao') return 'manutencao'
  if (abrigo.status === 'disponivel') return 'disponivel'
  if (abrigo.status === 'ag_entrega') return 'ag_entrega'
  if (abrigo.status === 'retirada')   return 'retirada'
  if (abrigo.status === 'alugado') {
    const temAtraso = parcelas.some(p =>
      p.abrigo_id === abrigo.id &&
      (p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje()))
    )
    return temAtraso ? 'em_atraso' : 'alugado'
  }
  return abrigo.status || 'disponivel'
}

// ── Ficha HTML ────────────────────────────────────────────────
function gerarFichaHTML(tipo, abrigo, parcelasAbrigo) {
  const agora    = new Date()
  const hojeStr  = agora.toLocaleDateString('pt-BR')
  const horaStr  = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const titulo   = tipo === 'locacao' ? 'Ficha de Locação de Abrigo Móvel' : 'Ficha de Devolução de Abrigo Móvel'
  const checklist = ['Chave entregue ao locatário', 'Fechadura funcionando', 'Porta em bom estado', 'Estrutura sem avarias']
  const funcLabel = tipo === 'locacao' ? (abrigo?.func_entregou || '') : (abrigo?.func_recolheu || '')

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>${titulo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:13px;color:#222;background:#fff;padding:24px;max-width:780px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1a1a1a}
.logo-area{display:flex;align-items:center;gap:12px}
.logo-box{width:48px;height:48px;background:#1a1a1a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px}
.logo-name{font-size:16px;font-weight:700;color:#1a1a1a}
.logo-sub{font-size:11px;color:#666;margin-top:2px}
.ficha-right{text-align:right}
.ficha-tipo{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.06em}
.num{font-size:22px;font-weight:700;color:#1a1a1a}
.section{margin-bottom:16px}
.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#666;border-bottom:1px solid #e0e0e0;padding-bottom:4px;margin-bottom:10px}
.field{margin-bottom:8px}
.field label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:2px}
.val{font-size:13px;color:#1a1a1a;font-weight:500;border-bottom:1px solid #e8e8e8;padding-bottom:3px;min-height:20px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.checklist{list-style:none}
.checklist li{display:flex;align-items:center;gap:10px;padding:7px 10px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:6px;font-size:12px}
.check-box{width:16px;height:16px;border:1.5px solid #999;border-radius:3px;flex-shrink:0}
.assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.assin-box{border:1px solid #ccc;border-radius:6px;padding:14px 16px}
.assin-title{font-size:11px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:10px}
.assin-linha{border-bottom:1px solid #555;margin:30px 0 6px}
.assin-label{font-size:10px;color:#888;text-align:center}
.assin-sub{font-size:10px;color:#888;margin-top:8px}
.obs-box{border:1px solid #e0e0e0;border-radius:6px;padding:10px;min-height:50px;font-size:12px;color:#555}
.decl{font-size:11px;color:#444;line-height:1.6;background:#f9f9f9;border:1px solid #eee;border-radius:6px;padding:10px 12px}
.rodape{text-align:center;font-size:10px;color:#aaa;margin-top:20px;border-top:1px solid #eee;padding-top:10px}
@media print{.no-print{display:none!important}@page{margin:1cm}}
.btn-print{background:#1a1a1a;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer;margin-right:8px}
.btn-close{background:#eee;color:#333;border:none;padding:10px 20px;border-radius:6px;font-size:13px;cursor:pointer}
</style></head><body>

<div class="header">
  <div class="logo-area">
    <div class="logo-box">🏗</div>
    <div><div class="logo-name">GRUPO VÁGULA</div><div class="logo-sub">Locação de Abrigos Móveis</div></div>
  </div>
  <div class="ficha-right">
    <div class="ficha-tipo">${titulo}</div>
    <div class="num">Abrigo #${abrigo?.num || '__'}</div>
    <div style="font-size:11px;color:#666">${tipo === 'locacao' ? 'Data de Locação' : 'Data de Devolução'}: ${tipo === 'locacao' ? fmtD(abrigo?.data_locacao) : hojeStr}</div>
  </div>
</div>

<div class="section">
  <div class="sec-title">Dados do Locatário</div>
  <div class="field"><label>Nome / Razão Social</label><div class="val">${abrigo?.locatario || '&nbsp;'}</div></div>
  <div class="grid3" style="margin-top:8px">
    <div class="field"><label>CPF / CNPJ</label><div class="val">${abrigo?.doc || '&nbsp;'}</div></div>
    <div class="field"><label>Telefone</label><div class="val">${abrigo?.tel || '&nbsp;'}</div></div>
    <div class="field"><label>Forma de Pagamento</label><div class="val">${abrigo?.forma_pagamento || '&nbsp;'}</div></div>
  </div>
  <div class="field" style="margin-top:8px"><label>Endereço da Obra / Instalação</label><div class="val">${abrigo?.endereco || '&nbsp;'}</div></div>
</div>

<div class="section">
  <div class="sec-title">Condições da Locação</div>
  <div class="grid3">
    <div class="field"><label>Data de Locação</label><div class="val">${fmtD(abrigo?.data_locacao)}</div></div>
    <div class="field"><label>Valor Mensal</label><div class="val">${fmt(abrigo?.valor_mensal)}</div></div>
    <div class="field"><label>Total de Parcelas</label><div class="val">${parcelasAbrigo.length}</div></div>
  </div>
</div>

<div class="section">
  <div class="sec-title">Checklist de Vistoria</div>
  <ul class="checklist">${checklist.map(i => `<li><div class="check-box"></div>${i}</li>`).join('')}</ul>
  <div style="margin-top:10px" class="field"><label>Observações / Avarias</label><div class="obs-box">${abrigo?.obs || ''}</div></div>
</div>

<div class="section">
  <div class="sec-title">Declaração</div>
  <div class="decl">${tipo === 'locacao'
    ? 'Declaro que recebi o abrigo móvel acima identificado em boas condições de uso, conforme checklist de vistoria. Comprometo-me a zelar pelo bem locado e a devolvê-lo nas mesmas condições recebidas. Estou ciente das condições de pagamento e que a não devolução no prazo implicará cobrança de multa conforme acordado.'
    : 'Declaro que devolvi o abrigo móvel acima identificado ao Grupo Vágula. Eventuais danos estruturais, danos na fechadura ou perda de chaves estão sujeitos a multa. A situação financeira foi conferida e está em conformidade com o acordado.'
  }</div>
</div>

<div class="section">
  <div class="sec-title">${tipo === 'locacao' ? 'Entrega / Recebimento' : 'Devolução / Conferência'}</div>
  <div class="assin-grid">
    <div class="assin-box">
      <div class="assin-title">${tipo === 'locacao' ? 'Quem Recebeu o Abrigo' : 'Quem Devolveu o Abrigo'}</div>
      <div class="field"><label>Data</label><div class="val">&nbsp;</div></div>
      <div class="assin-linha"></div>
      <div class="assin-label">Assinatura</div>
      <div style="margin-top:10px">
        <div class="field"><label>Nome Legível</label><div class="val">&nbsp;</div></div>
        <div class="field"><label>CPF / RG</label><div class="val">&nbsp;</div></div>
      </div>
    </div>
    <div class="assin-box">
      <div class="assin-title">Responsável — Grupo Vágula</div>
      <div class="field"><label>Funcionário</label><div class="val">${funcLabel || '&nbsp;'}</div></div>
      <div class="assin-linha"></div>
      <div class="assin-label">Assinatura</div>
      <div class="assin-sub">${tipo === 'locacao' ? 'Declaro ter entregado o abrigo nas condições descritas.' : 'Declaro ter recebido o abrigo nas condições descritas.'}</div>
    </div>
  </div>
</div>

<div class="rodape">Grupo Vágula · Locação de Abrigos Móveis · Ficha gerada em ${hojeStr} às ${horaStr}</div>

<div class="no-print" style="text-align:center;margin-top:20px">
  <button class="btn-print" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <button class="btn-close" onclick="window.close()">Fechar</button>
</div>
</body></html>`
}

function abrirFicha(tipo, abrigo, parcelas) {
  if (!abrigo) return alert('Selecione um abrigo primeiro.')
  const html = gerarFichaHTML(tipo, abrigo, parcelas)
  const w = window.open('', '_blank', 'width=860,height=720')
  w.document.write(html)
  w.document.close()
}

// ── Modal genérico ────────────────────────────────────────────
function Modal({ title, onClose, width = 580, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{ background: '#111', border: `1px solid ${D.border}`, borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,.8)' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: D.text }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: D.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

const inputSt = { width: '100%', padding: '8px 10px', border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.text, background: D.input, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }
const btnSt   = { border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: '8px 16px' }

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</label>
      {children}
    </div>
  )
}

// ── Modal Seletor de Abrigo para ficha ───────────────────────
function ModalSeletorFicha({ tipo, abrigos, parcelas, onClose }) {
  const [num, setNum] = useState('')
  const alugados = abrigos.filter(a => a.status === 'alugado')
  const abrigoSel = alugados.find(a => a.num === num) || alugados[0]

  return (
    <Modal title={tipo === 'locacao' ? '📋 Ficha de Locação' : '📋 Ficha de Devolução'} onClose={onClose} width={420}>
      <Campo label="Selecionar Abrigo">
        <select style={inputSt} value={num} onChange={e => setNum(e.target.value)}>
          {alugados.map(a => (
            <option key={a.id} value={a.num}>#{a.num} — {a.locatario}</option>
          ))}
        </select>
      </Campo>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={{ ...btnSt, background: D.input, color: D.muted, border: `1px solid ${D.border}`, flex: 1 }}>Cancelar</button>
        <button onClick={() => { abrirFicha(tipo, abrigoSel, parcelas.filter(p => p.abrigo_id === abrigoSel?.id)); onClose() }}
          style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833', flex: 1 }}>
          Abrir Ficha
        </button>
      </div>
      <div style={{ marginTop: 16, borderTop: `1px solid ${D.border}`, paddingTop: 12 }}>
        <p style={{ fontSize: 11, color: D.muted, marginBottom: 8 }}>Ficha em branco (sem dados):</p>
        <button onClick={() => { abrirFicha(tipo, null, []); onClose() }}
          style={{ ...btnSt, background: D.input, color: D.muted, border: `1px solid ${D.border}`, width: '100%', fontSize: 11 }}>
          Imprimir sem dados
        </button>
      </div>
    </Modal>
  )
}

// ── Modal Detalhes ───────────────────────────────────────────
function ModalDetalhes({ abrigo, statusKey, parcelas, historico, onClose, onPagar, onEstornar, onAcao }) {
  const [aba, setAba] = useState('info')
  const s = STATUS[statusKey] || STATUS.alugado
  const parcsOrd = [...parcelas].sort((a, b) => a.parcela_num - b.parcela_num)
  const histOrd  = [...historico].sort((a, b) => (b.data || '').localeCompare(a.data || ''))

  return (
    <Modal title={`Abrigo #${abrigo.num}`} onClose={onClose} width={700}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ background: s.card, border: `1px solid ${s.border}`, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
        {abrigo.locatario && <span style={{ fontSize: 13, color: D.text, fontWeight: 600 }}>{abrigo.locatario}</span>}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${D.border}` }}>
        {[['info','Informações'], ['parcelas',`Parcelas (${parcelas.length})`], ['historico',`Histórico (${historico.length})`]].map(([id, lbl]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 12,
            fontWeight: aba === id ? 700 : 400, color: aba === id ? s.color : D.muted,
            padding: '8px 16px', borderBottom: aba === id ? `2px solid ${s.color}` : '2px solid transparent',
            fontFamily: 'inherit', marginBottom: -1,
          }}>{lbl}</button>
        ))}
      </div>

      {aba === 'info' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              ['Data locação', fmtD(abrigo.data_locacao)],
              ['Valor mensal', fmt(abrigo.valor_mensal)],
              ['Forma pagamento', abrigo.forma_pagamento || '-'],
              ['Dev. prevista', fmtD(abrigo.data_devolucao_prevista)],
              ['CPF/CNPJ', abrigo.doc || '-'],
              ['Telefone', abrigo.tel || '-'],
              ['Entregou', abrigo.func_entregou || '-'],
              ['Recolheu', abrigo.func_recolheu || '-'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 12px', border: `1px solid ${D.border}` }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: D.muted, textTransform: 'uppercase', fontWeight: 600 }}>{k}</p>
                <p style={{ margin: 0, fontSize: 13, color: D.text, fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
          {abrigo.endereco && (
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: `1px solid ${D.border}` }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, color: D.muted, textTransform: 'uppercase', fontWeight: 600 }}>Endereço</p>
              <p style={{ margin: 0, fontSize: 13, color: D.text }}>{abrigo.endereco}</p>
            </div>
          )}
          {abrigo.obs && (
            <div style={{ background: '#1a0800', borderRadius: 8, padding: '10px 12px', border: '1px solid #ff880033' }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, color: '#ff8800', textTransform: 'uppercase', fontWeight: 600 }}>Observação</p>
              <p style={{ margin: 0, fontSize: 13, color: '#ffbb66' }}>{abrigo.obs}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {abrigo.status === 'alugado' && <>
              <button onClick={() => onAcao('devolucao')} style={{ ...btnSt, flex: 1, background: '#1a0000', color: '#ff4444', border: '1px solid #ff444433' }}>Registrar Devolução</button>
              <button onClick={() => onAcao('manutencao')} style={{ ...btnSt, flex: 1, background: '#0f0018', color: '#bb44ff', border: '1px solid #bb44ff33' }}>Enviar p/ Manutenção</button>
            </>}
            {abrigo.status === 'disponivel' && (
              <button onClick={() => onAcao('locar')} style={{ ...btnSt, width: '100%', background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833' }}>+ Registrar Locação</button>
            )}
          </div>
        </div>
      )}

      {aba === 'parcelas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {parcsOrd.length === 0
            ? <p style={{ color: D.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Nenhuma parcela.</p>
            : parcsOrd.map(p => {
              const atrasado = p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje())
              const cor = p.status === 'pago' ? '#00ff88' : atrasado ? '#ff4444' : '#4da6ff'
              const lbl = p.status === 'pago' ? 'PAGO' : atrasado ? 'ATRASADO' : 'PENDENTE'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: p.status === 'pago' ? '#001a0e' : atrasado ? '#1a0000' : '#001428', border: `1px solid ${cor}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: D.muted, minWidth: 24 }}>#{p.parcela_num}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: D.text }}>Venc: {fmtD(p.vencimento)}</p>
                      {p.data_pagamento && <p style={{ margin: 0, fontSize: 11, color: D.muted }}>Pago {fmtD(p.data_pagamento)} · {p.forma_pagamento}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cor }}>{fmt(p.valor_pago || abrigo.valor_mensal)}</span>
                    <span style={{ color: cor, fontSize: 10, fontWeight: 700 }}>{lbl}</span>
                    {p.status !== 'pago' && (
                      <button onClick={() => onPagar(p)} style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833', padding: '4px 10px', fontSize: 11 }}>Pagar</button>
                    )}
                    {p.status === 'pago' && (
                      <button onClick={() => onEstornar(p)} style={{ ...btnSt, background: '#1a0000', color: '#ff4444', border: '1px solid #ff444433', padding: '4px 10px', fontSize: 11 }}>Estornar</button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {aba === 'historico' && (
        <div>
          {histOrd.length === 0
            ? <p style={{ color: D.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Nenhum registro.</p>
            : histOrd.map(h => {
              const corMap = { locacao: '#4da6ff', devolucao: '#00ff88', pagamento: '#00ff88', manutencao: '#bb44ff', retirada: '#ffdd00', renovacao: '#888', estorno: '#ff4444' }
              const cor = corMap[h.tipo] || '#888'
              return (
                <div key={h.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${D.border}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cor, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 12, color: D.text }}>{h.descricao}</p>
                    <p style={{ margin: 0, fontSize: 11, color: D.muted }}>{fmtD(h.data)}</p>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </Modal>
  )
}

// ── Modal Locação ─────────────────────────────────────────────
function ModalLocacao({ abrigo, onClose, onSalvar }) {
  const [form, setForm] = useState({ locatario: '', doc: '', tel: '', endereco: '', data_locacao: hoje(), valor_mensal: '230', forma_pagamento: 'PIX', meses: '12', func_entregou: '', obs: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  async function salvar() {
    if (!form.locatario || !form.valor_mensal) return alert('Preencha locatário e valor.')
    setSaving(true)
    try { await onSalvar(abrigo, form); onClose() } finally { setSaving(false) }
  }
  return (
    <Modal title={`Registrar Locação — Abrigo #${abrigo.num}`} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <Campo label="Locatário *"><input style={inputSt} value={form.locatario} onChange={e => set('locatario', e.target.value)} /></Campo>
        <Campo label="CPF / CNPJ"><input style={inputSt} value={form.doc} onChange={e => set('doc', e.target.value)} /></Campo>
        <Campo label="Telefone"><input style={inputSt} value={form.tel} onChange={e => set('tel', e.target.value)} /></Campo>
        <Campo label="Forma de Pagamento">
          <select style={inputSt} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
            {FORMAS_PAG.map(f => <option key={f}>{f}</option>)}
          </select>
        </Campo>
      </div>
      <Campo label="Endereço"><input style={inputSt} value={form.endereco} onChange={e => set('endereco', e.target.value)} /></Campo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
        <Campo label="Data Locação"><input type="date" style={inputSt} value={form.data_locacao} onChange={e => set('data_locacao', e.target.value)} /></Campo>
        <Campo label="Valor Mensal R$"><input type="number" style={inputSt} value={form.valor_mensal} onChange={e => set('valor_mensal', e.target.value)} /></Campo>
        <Campo label="Parcelas (meses)"><input type="number" style={inputSt} value={form.meses} onChange={e => set('meses', e.target.value)} min="1" max="60" /></Campo>
      </div>
      <Campo label="Entregue por"><input style={inputSt} value={form.func_entregou} onChange={e => set('func_entregou', e.target.value)} /></Campo>
      <Campo label="Observações"><textarea style={{ ...inputSt, resize: 'vertical', minHeight: 60 }} value={form.obs} onChange={e => set('obs', e.target.value)} /></Campo>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={{ ...btnSt, background: D.input, color: D.muted, border: `1px solid ${D.border}` }}>Cancelar</button>
        <button onClick={salvar} disabled={saving} style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833' }}>
          {saving ? 'Salvando...' : 'Confirmar Locação'}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal Pagamento ───────────────────────────────────────────
function ModalPagamento({ parcela, abrigo, onClose, onSalvar }) {
  const [form, setForm] = useState({ data_pagamento: hoje(), forma_pagamento: abrigo.forma_pagamento || 'PIX', valor_pago: String(abrigo.valor_mensal || ''), obs: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  async function salvar() {
    setSaving(true)
    try { await onSalvar(parcela, form); onClose() } finally { setSaving(false) }
  }
  return (
    <Modal title={`Pagamento — Parcela #${parcela.parcela_num}`} onClose={onClose} width={420}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: D.muted }}>Abrigo #{abrigo.num} · {abrigo.locatario} · Venc: {fmtD(parcela.vencimento)}</p>
      <Campo label="Data do Pagamento"><input type="date" style={inputSt} value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} /></Campo>
      <Campo label="Forma de Pagamento">
        <select style={inputSt} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
          {FORMAS_PAG.map(f => <option key={f}>{f}</option>)}
        </select>
      </Campo>
      <Campo label="Valor Pago R$"><input type="number" style={inputSt} value={form.valor_pago} onChange={e => set('valor_pago', e.target.value)} /></Campo>
      <Campo label="Observação"><input style={inputSt} value={form.obs} onChange={e => set('obs', e.target.value)} /></Campo>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={{ ...btnSt, background: D.input, color: D.muted, border: `1px solid ${D.border}` }}>Cancelar</button>
        <button onClick={salvar} disabled={saving} style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833' }}>
          {saving ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal Histórico Geral ─────────────────────────────────────
function ModalHistoricoGeral({ historico, abrigos, onClose }) {
  const corMap = { locacao: '#4da6ff', devolucao: '#00ff88', pagamento: '#00ff88', manutencao: '#bb44ff', retirada: '#ffdd00', renovacao: '#888', estorno: '#ff4444' }
  const histOrd = [...historico].sort((a, b) => (b.data || '').localeCompare(a.data || ''))
  return (
    <Modal title="Histórico Geral do Sistema" onClose={onClose} width={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {histOrd.length === 0
          ? <p style={{ color: D.muted, textAlign: 'center', padding: '24px 0' }}>Nenhum registro.</p>
          : histOrd.map(h => {
            const abr = abrigos.find(a => a.id === h.abrigo_id)
            const cor = corMap[h.tipo] || '#888'
            return (
              <div key={h.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${D.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cor, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cor, fontFamily: 'monospace' }}>#{abr?.num}</span>
                    <span style={{ fontSize: 11, color: D.muted }}>{abr?.locatario}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: D.text }}>{h.descricao}</p>
                  <p style={{ margin: 0, fontSize: 11, color: D.muted }}>{fmtD(h.data)}</p>
                </div>
              </div>
            )
          })}
      </div>
    </Modal>
  )
}

// ── Principal ─────────────────────────────────────────────────
export default function Abrigos() {
  const [abrigos, setAbrigos]     = useState([])
  const [parcelas, setParcelas]   = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading]     = useState(true)
  const [aba, setAba]             = useState('painel')
  const [filtro, setFiltro]       = useState('todos')
  const [busca, setBusca]         = useState('')
  const [sel, setSel]             = useState(null)
  const [modalLocacao, setModalLocacao]       = useState(null)
  const [modalPagamento, setModalPagamento]   = useState(null)
  const [modalFicha, setModalFicha]           = useState(null) // 'locacao' | 'devolucao'
  const [modalHistGeral, setModalHistGeral]   = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [ra, rp, rh] = await Promise.all([
      supabase.from('abrigos').select('*').order('num'),
      supabase.from('abrigos_parcelas').select('*').order('parcela_num'),
      supabase.from('abrigos_historico').select('*').order('data', { ascending: false }),
    ])
    setAbrigos(ra.data || [])
    setParcelas(rp.data || [])
    setHistorico(rh.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Stats
  const statsStatus = abrigos.reduce((acc, a) => {
    const sk = getStatusKey(a, parcelas)
    acc[sk] = (acc[sk] || 0) + 1
    return acc
  }, {})
  const totalAtrasadas  = parcelas.filter(p => p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje())).length
  const receitaMes      = abrigos.filter(a => a.status === 'alugado').reduce((s, a) => s + Number(a.valor_mensal || 0), 0)
  const receitaRecebida = parcelas.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor_pago || 0), 0)
  // A receber = apenas parcelas que vencem no mês atual e ainda não foram pagas
  const mesAtual = hoje().slice(0, 7) // 'yyyy-mm'
  const receitaPendente = parcelas.filter(p =>
    p.status !== 'pago' && (p.vencimento || '').slice(0, 7) === mesAtual
  ).reduce((s, p) => {
    const abr = abrigos.find(a => a.id === p.abrigo_id)
    return s + Number(abr?.valor_mensal || 0)
  }, 0)

  // Grid filtrado
  const abrigosFiltrados = abrigos.filter(a => {
    const sk = getStatusKey(a, parcelas)
    const mF = filtro === 'todos' || sk === filtro
    const mB = !busca || a.num.includes(busca) || (a.locatario || '').toLowerCase().includes(busca.toLowerCase())
    return mF && mB
  })

  function exportarCSV() {
    const rows = [['Abrigo','Locatário','Parcela','Vencimento','Status','Valor Pago','Data Pagamento','Forma']]
    parcelas.forEach(p => {
      const abr = abrigos.find(a => a.id === p.abrigo_id)
      rows.push([abr?.num, abr?.locatario, p.parcela_num, p.vencimento, p.status, p.valor_pago || abr?.valor_mensal, p.data_pagamento, p.forma_pagamento])
    })
    const csv = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const el = document.createElement('a')
    el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    el.download = 'abrigos-financeiro.csv'
    el.click()
  }

  // ── Operações ─────────────────────────────────────────────
  async function handleLocacao(abrigo, form) {
    const meses = parseInt(form.meses) || 12
    const valor = parseFloat(form.valor_mensal) || 0
    await supabase.from('abrigos').update({ status: 'alugado', locatario: form.locatario, doc: form.doc, tel: form.tel, endereco: form.endereco, data_locacao: form.data_locacao, valor_mensal: valor, forma_pagamento: form.forma_pagamento, func_entregou: form.func_entregou, obs: form.obs, em_manutencao: false, updated_at: new Date().toISOString() }).eq('id', abrigo.id)
    await supabase.from('abrigos_parcelas').delete().eq('abrigo_id', abrigo.id)
    await supabase.from('abrigos_parcelas').insert(Array.from({ length: meses }, (_, i) => ({ abrigo_id: abrigo.id, parcela_num: i + 1, vencimento: addM(form.data_locacao, i + 1), status: 'pendente' })))
    await supabase.from('abrigos_historico').insert({ abrigo_id: abrigo.id, tipo: 'locacao', data: hoje(), descricao: `Locação para ${form.locatario}. ${meses} parcelas de ${fmt(valor)}/mês.`, obs: form.obs })
    await carregar()
  }

  async function handlePagamento(parcela, form) {
    const valor = parseFloat(form.valor_pago) || 0
    const abr   = abrigos.find(a => a.id === parcela.abrigo_id)
    await supabase.from('abrigos_parcelas').update({ status: 'pago', data_pagamento: form.data_pagamento, forma_pagamento: form.forma_pagamento, valor_pago: valor, obs: form.obs }).eq('id', parcela.id)
    await supabase.from('abrigos_historico').insert({ abrigo_id: parcela.abrigo_id, tipo: 'pagamento', data: form.data_pagamento, descricao: `Parcela #${parcela.parcela_num} paga via ${form.forma_pagamento} · ${fmt(valor)}`, obs: form.obs })
    await supabase.from('lancamentos').insert({ tipo: 'receita', categoria: 'locacao_abrigo', descricao: `Abrigo #${abr?.num} — ${abr?.locatario} · Parcela #${parcela.parcela_num}`, valor, data_lancamento: form.data_pagamento, data_vencimento: parcela.vencimento, data_pagamento: form.data_pagamento, forma_pagamento: form.forma_pagamento, status: 'pago', origem: 'abrigo', origem_id: parcela.id, observacao: form.obs || null })
    await carregar()
    const { data } = await supabase.from('abrigos').select('*').eq('id', parcela.abrigo_id).single()
    if (data) setSel(data)
  }

  async function handleEstorno(parcela) {
    if (!confirm(`Estornar parcela #${parcela.parcela_num}? O lançamento no financeiro também será removido.`)) return
    await supabase.from('abrigos_parcelas').update({ status: 'pendente', data_pagamento: null, forma_pagamento: null, valor_pago: null, obs: null }).eq('id', parcela.id)
    await supabase.from('lancamentos').delete().eq('origem', 'abrigo').eq('origem_id', parcela.id)
    await supabase.from('abrigos_historico').insert({ abrigo_id: parcela.abrigo_id, tipo: 'estorno', data: hoje(), descricao: `Pagamento da parcela #${parcela.parcela_num} estornado.` })
    await carregar()
    const { data } = await supabase.from('abrigos').select('*').eq('id', parcela.abrigo_id).single()
    if (data) setSel(data)
  }

  async function handleAcao(tipo) {
    if (tipo === 'locar')      { setModalLocacao(sel); setSel(null) }
    if (tipo === 'devolucao')  {
      if (!confirm(`Confirmar devolução do Abrigo #${sel.num}?`)) return
      await supabase.from('abrigos').update({ status: 'disponivel', locatario: '', doc: '', tel: '', endereco: '', data_locacao: null, valor_mensal: null, data_devolucao_prevista: null, func_entregou: '', func_recolheu: '', obs: '', forma_pagamento: '', em_manutencao: false, updated_at: new Date().toISOString() }).eq('id', sel.id)
      await supabase.from('abrigos_historico').insert({ abrigo_id: sel.id, tipo: 'devolucao', data: hoje(), descricao: `Abrigo devolvido por ${sel.locatario}.` })
      setSel(null); await carregar()
    }
    if (tipo === 'manutencao') {
      await supabase.from('abrigos').update({ status: 'manutencao', em_manutencao: true, updated_at: new Date().toISOString() }).eq('id', sel.id)
      await supabase.from('abrigos_historico').insert({ abrigo_id: sel.id, tipo: 'manutencao', data: hoje(), descricao: 'Abrigo enviado para manutenção.' })
      setSel(null); await carregar()
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #222', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ background: D.bg, minHeight: '100%', color: D.text }}>

      {/* ── Header com abas e botões ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            ['painel',     'Painel'],
            ['financeiro', 'Financeiro'],
            ['vencimentos', `⚠ Vencimentos (${totalAtrasadas})`],
          ].map(([id, lbl]) => (
            <button key={id} onClick={() => setAba(id)} style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              background: aba === id ? '#1a1a1a' : 'transparent',
              color: id === 'vencimentos' && totalAtrasadas > 0 ? '#ffdd00' : aba === id ? D.text : D.muted,
              border: aba === id ? `1px solid ${D.border}` : '1px solid transparent',
              fontSize: 12, fontWeight: aba === id ? 700 : 400,
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setModalFicha('locacao')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${D.border}`, background: D.card, color: D.muted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>📋 Ficha Locação</button>
          <button onClick={() => setModalFicha('devolucao')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${D.border}`, background: D.card, color: D.muted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>📋 Ficha Devolução</button>
          <button onClick={() => setModalHistGeral(true)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${D.border}`, background: D.card, color: D.muted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>📋 Histórico Geral</button>
          <button onClick={exportarCSV} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${D.border}`, background: D.card, color: D.muted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>↓ CSV</button>
        </div>
      </div>

      {/* ── ABA PAINEL ── */}
      {aba === 'painel' && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Total',       value: abrigos.length,                color: D.text },
              { label: 'Disponíveis', value: statsStatus.disponivel || 0,   color: '#00ff88' },
              { label: 'Alugados',    value: (statsStatus.alugado || 0) + (statsStatus.em_atraso || 0), color: '#4da6ff' },
              { label: 'Em Atraso',   value: statsStatus.em_atraso || 0,    color: '#ff4444' },
              { label: 'Manutenção',  value: statsStatus.manutencao || 0,   color: '#bb44ff' },
              { label: 'Receita/mês', value: fmt(receitaMes),               color: '#00ff88' },
            ].map(k => (
              <div key={k.label} style={{ background: D.card, borderRadius: 10, padding: '12px 14px', border: `1px solid ${D.border}` }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, color: D.muted, textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Alerta */}
          {totalAtrasadas > 0 && (
            <div style={{ background: '#1a0000', border: '1px solid #ff444433', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#ff4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠ <strong>{totalAtrasadas} parcela(s) em atraso</strong>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.muted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input style={{ ...inputSt, paddingLeft: 32 }} placeholder="Buscar nº ou locatário..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            {[['todos','Todos'], ...Object.entries(STATUS).map(([k,v]) => [k, v.label])].map(([k, lbl]) => (
              <button key={k} onClick={() => setFiltro(k)} style={{ ...btnSt, background: filtro === k ? (STATUS[k]?.card || '#1a1a1a') : D.card, color: filtro === k ? (STATUS[k]?.color || D.text) : D.muted, border: `1px solid ${filtro === k ? (STATUS[k]?.border || D.border) : D.border}`, padding: '6px 12px' }}>{lbl}</button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8 }}>
            {abrigosFiltrados.map(a => {
              const sk    = getStatusKey(a, parcelas)
              const s     = STATUS[sk]
              const parcs = parcelas.filter(p => p.abrigo_id === a.id)
              const atr   = parcs.filter(p => p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje()))
              const pagas = parcs.filter(p => p.status === 'pago')
              return (
                <div key={a.id} onClick={() => setSel(a)}
                  style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 0 12px ${s.border}` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>#{a.num}</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  </div>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '.5px' }}>{s.label}</p>
                  {a.locatario ? (
                    <>
                      <p style={{ margin: '4px 0 2px', fontSize: 12, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.locatario}</p>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: s.color }}>{fmt(a.valor_mensal)}/mês</p>
                      <p style={{ margin: 0, fontSize: 10, color: D.muted }}>
                        {pagas.length}/{parcs.length} pagas
                        {atr.length > 0 && <span style={{ color: '#ff4444', fontWeight: 700 }}> · {atr.length} atrasada{atr.length > 1 ? 's' : ''}</span>}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: D.muted }}>Sem locatário</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── ABA FINANCEIRO ── */}
      {aba === 'financeiro' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Receita Recebida', value: fmt(receitaRecebida), color: '#00ff88' },
              { label: 'A Receber (mês)',   value: fmt(receitaPendente), color: '#4da6ff' },
              { label: 'Parcelas em Atraso', value: totalAtrasadas,     color: '#ff4444' },
            ].map(k => (
              <div key={k.label} style={{ background: D.card, borderRadius: 10, padding: '14px 16px', border: `1px solid ${D.border}` }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, color: D.muted, textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: D.card, borderRadius: 10, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  {['Abrigo','Locatário','Parc.','Vencimento','Valor','Status','Pago em','Ação'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: D.muted, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...parcelas].sort((a,b) => (a.vencimento||'').localeCompare(b.vencimento||'')).map(p => {
                  const abr     = abrigos.find(a => a.id === p.abrigo_id)
                  const atrasado = p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje())
                  const cor     = p.status === 'pago' ? '#00ff88' : atrasado ? '#ff4444' : '#4da6ff'
                  const lbl     = p.status === 'pago' ? 'PAGO' : atrasado ? 'ATRASADO' : 'PENDENTE'
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${D.border}` }}>
                      <td style={{ padding: '9px 12px', color: cor, fontWeight: 700, fontFamily: 'monospace' }}>#{abr?.num}</td>
                      <td style={{ padding: '9px 12px', color: D.text, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{abr?.locatario}</td>
                      <td style={{ padding: '9px 12px', color: D.muted }}>#{p.parcela_num}</td>
                      <td style={{ padding: '9px 12px', color: atrasado ? '#ff4444' : D.muted }}>{fmtD(p.vencimento)}</td>
                      <td style={{ padding: '9px 12px', color: D.text, fontWeight: 600 }}>{fmt(p.valor_pago || abr?.valor_mensal)}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ color: cor, fontSize: 10, fontWeight: 700 }}>{lbl}</span></td>
                      <td style={{ padding: '9px 12px', color: D.muted }}>{fmtD(p.data_pagamento)}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {p.status !== 'pago'
                          ? <button onClick={() => setModalPagamento({ parcela: p, abrigo: abr })} style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833', padding: '3px 8px', fontSize: 11 }}>Pagar</button>
                          : <button onClick={() => handleEstorno(p)} style={{ ...btnSt, background: '#1a0000', color: '#ff4444', border: '1px solid #ff444433', padding: '3px 8px', fontSize: 11 }}>Estornar</button>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA VENCIMENTOS ── */}
      {aba === 'vencimentos' && (
        <div>
          <p style={{ color: D.muted, fontSize: 12, marginBottom: 12 }}>Parcelas vencidas não pagas — ordenadas por data</p>
          <div style={{ background: D.card, borderRadius: 10, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  {['Abrigo','Locatário','Parcela','Vencimento','Valor','Dias em atraso','Ação'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: D.muted, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parcelas
                  .filter(p => p.status === 'atrasado' || (p.status === 'pendente' && p.vencimento < hoje()))
                  .sort((a,b) => (a.vencimento||'').localeCompare(b.vencimento||''))
                  .map(p => {
                    const abr  = abrigos.find(a => a.id === p.abrigo_id)
                    const dias = Math.floor((new Date() - new Date(p.vencimento)) / 86400000)
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${D.border}` }}>
                        <td style={{ padding: '9px 12px', color: '#ff4444', fontWeight: 700, fontFamily: 'monospace' }}>#{abr?.num}</td>
                        <td style={{ padding: '9px 12px', color: D.text }}>{abr?.locatario}</td>
                        <td style={{ padding: '9px 12px', color: D.muted }}>#{p.parcela_num}</td>
                        <td style={{ padding: '9px 12px', color: '#ff4444' }}>{fmtD(p.vencimento)}</td>
                        <td style={{ padding: '9px 12px', color: D.text, fontWeight: 600 }}>{fmt(abr?.valor_mensal)}</td>
                        <td style={{ padding: '9px 12px', color: '#ff4444', fontWeight: 700 }}>{dias} dias</td>
                        <td style={{ padding: '9px 12px' }}>
                          <button onClick={() => setModalPagamento({ parcela: p, abrigo: abr })} style={{ ...btnSt, background: '#001a0e', color: '#00ff88', border: '1px solid #00ff8833', padding: '3px 8px', fontSize: 11 }}>Pagar</button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modais ── */}
      {sel && (() => {
        const sk = getStatusKey(sel, parcelas)
        return (
          <ModalDetalhes
            abrigo={sel} statusKey={sk}
            parcelas={parcelas.filter(p => p.abrigo_id === sel.id)}
            historico={historico.filter(h => h.abrigo_id === sel.id)}
            onClose={() => setSel(null)}
            onPagar={p => setModalPagamento({ parcela: p, abrigo: sel })}
            onEstornar={handleEstorno}
            onAcao={handleAcao}
          />
        )
      })()}

      {modalLocacao && (
        <ModalLocacao abrigo={modalLocacao} onClose={() => setModalLocacao(null)} onSalvar={handleLocacao} />
      )}

      {modalPagamento && (
        <ModalPagamento
          parcela={modalPagamento.parcela} abrigo={modalPagamento.abrigo}
          onClose={() => setModalPagamento(null)} onSalvar={handlePagamento}
        />
      )}

      {modalFicha && (
        <ModalSeletorFicha
          tipo={modalFicha} abrigos={abrigos} parcelas={parcelas}
          onClose={() => setModalFicha(null)}
        />
      )}

      {modalHistGeral && (
        <ModalHistoricoGeral historico={historico} abrigos={abrigos} onClose={() => setModalHistGeral(false)} />
      )}

    </div>
  )
}