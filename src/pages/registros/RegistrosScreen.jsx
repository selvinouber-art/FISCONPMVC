import React, { useState, useEffect } from 'react'
import { query } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import { statusCores } from '../../config/theme.js'
import { STATUS_REGISTROS } from '../../config/constants.js'
import { isFiscal, podeEmitirDocumentos, isAdminGeral } from '../../gerencia/gerencia.js'
import RegistroDetalhe from './RegistroDetalhe.jsx'

const ABAS = [
  { id: 'todos',    label: 'Todos',    icone: 'file' },
  { id: 'notif',   label: 'Notif.',   icone: 'file' },
  { id: 'auto',    label: 'Autos',    icone: 'alert' },
  { id: 'multados',label: 'Multados', icone: 'chart' },
]

export default function RegistrosScreen({ usuario, setPagina, mostrarToast }) {
  const [registros, setRegistros]       = useState([])
  const [busca, setBusca]               = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [abaAtiva, setAbaAtiva]         = useState('todos')
  const [carregando, setCarregando]     = useState(true)
  const [detalheId, setDetalheId]       = useState(null)

  useEffect(() => { carregar() }, [usuario])

  async function carregar() {
    try {
      const dados = await query('records', q => {
        let qr = q.order('created_at', { ascending: false })
        if (!isAdminGeral(usuario)) qr = qr.eq('gerencia', usuario.gerencia)
        if (isFiscal(usuario)) qr = qr.eq('matricula', usuario.matricula)
        return qr
      })
      setRegistros(dados)
    } catch {
      mostrarToast('Erro ao carregar registros', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  if (detalheId) {
    return (
      <RegistroDetalhe
        registroId={detalheId}
        usuario={usuario}
        mostrarToast={mostrarToast}
        setPagina={(pag, params) => {
          if (pag === 'registros') { setDetalheId(null); carregar() }
          else setPagina(pag, params)
        }}
      />
    )
  }

  const filtrados = registros.filter(r => {
    const buscaOk = !busca ||
      r.num?.toLowerCase().includes(busca.toLowerCase()) ||
      r.owner?.toLowerCase().includes(busca.toLowerCase()) ||
      r.addr?.toLowerCase().includes(busca.toLowerCase()) ||
      r.cpf?.includes(busca)
    const statusOk = !filtroStatus || r.status === filtroStatus
    const abaOk = abaAtiva === 'todos'
      ? true
      : abaAtiva === 'multados'
        ? r.multado === true
        : r.type === abaAtiva
    return buscaOk && statusOk && abaOk
  })

  const countMultados = registros.filter(r => r.multado).length

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Registros</h2>
        {podeEmitirDocumentos(usuario) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPagina('nova-notificacao')} style={{
              background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '10px',
              padding: '8px 12px', fontSize: '0.8rem', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
            }}>
              <Icon name="plus" size={14} color="#fff" /> NP
            </button>
            <button onClick={() => setPagina('novo-auto')} style={{
              background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px',
              padding: '8px 12px', fontSize: '0.8rem', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
            }}>
              <Icon name="alert" size={14} color="#fff" /> AI
            </button>
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
        {ABAS.map(aba => {
          const ativo = abaAtiva === aba.id
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
              padding: '7px 14px', borderRadius: '999px', border: 'none', whiteSpace: 'nowrap',
              background: ativo ? '#1A56DB' : '#fff',
              color: ativo ? '#fff' : '#64748B',
              fontWeight: ativo ? '700' : '500',
              fontSize: '0.82rem', cursor: 'pointer',
              border: `2px solid ${ativo ? '#1A56DB' : '#E2E8F0'}`,
              position: 'relative',
            }}>
              {aba.label}
              {aba.id === 'multados' && countMultados > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#B91C1C', color: '#fff', fontSize: '0.6rem',
                  fontWeight: '700', borderRadius: '999px', minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {countMultados}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Icon name="search" size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Número, nome, endereço, CPF..." value={busca}
          onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '36px' }} />
      </div>

      <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ marginBottom: '10px', fontSize: '0.8rem' }}>
        <option value="">Todos os status</option>
        {STATUS_REGISTROS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
        {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
      </div>

      {carregando ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed #E2E8F0', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
          <Icon name="file" size={32} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
          <div>
            {abaAtiva === 'multados' ? 'Nenhum auto com multa encaminhada.' : 'Nenhum registro encontrado.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtrados.map(reg => {
            const sc = statusCores[reg.status] || { fundo: '#F1F5F9', cor: '#6B7280' }
            return (
              <div key={reg.id}
                style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px', cursor: 'pointer' }}
                onClick={() => setDetalheId(reg.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1E293B' }}>{reg.num}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                      {reg.type === 'auto' ? '⚠️ Auto' : '📋 Notificação'}
                      {reg.fiscal ? ` — ${reg.fiscal}` : ''}
                      {reg.multado ? ' — 💰 Multa encaminhada' : ''}
                    </div>
                  </div>
                  <span style={{ background: sc.fundo, color: sc.cor, fontSize: '0.65rem', fontWeight: '700', borderRadius: '999px', padding: '3px 10px' }}>
                    {reg.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '4px' }}>{reg.owner || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{reg.addr}{reg.bairro ? ` — ${reg.bairro}` : ''}</div>
                {reg.prazo && (
                  <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="clock" size={12} color="#B45309" />
                    Prazo: {reg.prazo}
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
