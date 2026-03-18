import React, { useState, useEffect } from 'react'
import { query } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import { isAdminGeral } from '../../gerencia/gerencia.js'

const CORES_ACAO = {
  NOVA_NOTIFICACAO:    { fundo: '#EBF5FF', cor: '#1A56DB', emoji: '📋' },
  NOVO_AUTO_INFRACAO:  { fundo: '#FEE2E2', cor: '#B91C1C', emoji: '⚠️' },
  NOVA_RECLAMACAO:     { fundo: '#FEF3C7', cor: '#B45309', emoji: '📞' },
  DEFESA_DEFERIDA:     { fundo: '#F0FDF4', cor: '#166534', emoji: '✅' },
  DEFESA_INDEFERIDA:   { fundo: '#FEE2E2', cor: '#B91C1C', emoji: '❌' },
  LOGIN:               { fundo: '#F0FDF4', cor: '#166534', emoji: '🔑' },
  LOGOUT:              { fundo: '#F1F5F9', cor: '#6B7280', emoji: '🚪' },
  USUARIO_CRIADO:      { fundo: '#EBF5FF', cor: '#1A56DB', emoji: '👤' },
  USUARIO_ATUALIZADO:  { fundo: '#FEF3C7', cor: '#B45309', emoji: '✏️' },
}

export default function AuditoriaScreen({ usuario, mostrarToast, setPagina }) {
  const [logs, setLogs]           = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca]         = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')
  const [pagAtual, setPagAtual]   = useState(1)
  const POR_PAGINA = 30

  useEffect(() => { carregar() }, [usuario])

  async function carregar() {
    try {
      const dados = await query('logs', q => {
        let qr = q.order('created_at', { ascending: false }).limit(500)
        if (!isAdminGeral(usuario)) qr = qr.eq('gerencia', usuario.gerencia)
        return qr
      })
      setLogs(dados || [])
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao carregar logs', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  const filtrados = logs.filter(l => {
    const buscaOk = !busca ||
      l.usuario?.toLowerCase().includes(busca.toLowerCase()) ||
      l.detalhe?.toLowerCase().includes(busca.toLowerCase()) ||
      l.acao?.toLowerCase().includes(busca.toLowerCase())
    const acaoOk = !filtroAcao || l.acao === filtroAcao
    return buscaOk && acaoOk
  })

  const totalPags = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados = filtrados.slice((pagAtual - 1) * POR_PAGINA, pagAtual * POR_PAGINA)

  const acoes = [...new Set(logs.map(l => l.acao).filter(Boolean))]

  function formatarData(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    } catch { return iso }
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('mais')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Auditoria / Log</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            Histórico completo de ações no sistema
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Icon name="search" size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, detalhe..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagAtual(1) }}
            style={{ paddingLeft: '30px', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      <select
        value={filtroAcao}
        onChange={e => { setFiltroAcao(e.target.value); setPagAtual(1) }}
        style={{ marginBottom: '12px', fontSize: '0.8rem' }}
      >
        <option value="">Todas as ações</option>
        {acoes.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      {/* Contador */}
      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <span>{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</span>
        {totalPags > 1 && <span>Página {pagAtual} de {totalPags}</span>}
      </div>

      {/* Lista */}
      {carregando ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>Carregando...</p>
      ) : paginados.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed #E2E8F0', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
          <Icon name="eye" size={32} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
          <div>Nenhum registro encontrado</div>
          <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>
            Os logs são gerados automaticamente ao criar notificações, autos e reclamações.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paginados.map(log => {
            const info = CORES_ACAO[log.acao] || { fundo: '#F1F5F9', cor: '#6B7280', emoji: '📝' }
            return (
              <div key={log.id} style={{
                background: '#fff',
                border: '2px solid #E2E8F0',
                borderLeft: `4px solid ${info.cor}`,
                borderRadius: '12px',
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{info.emoji}</span>
                    <span style={{
                      background: info.fundo, color: info.cor,
                      fontSize: '0.65rem', fontWeight: '700',
                      borderRadius: '999px', padding: '2px 10px',
                    }}>
                      {log.acao?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                    {formatarData(log.created_at)}
                  </span>
                </div>

                {/* Usuário */}
                <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  👤 {log.usuario || 'Sistema'}
                </div>

                {/* Detalhe */}
                {log.detalhe && (
                  <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                    {log.detalhe}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setPagAtual(p => Math.max(1, p - 1))}
            disabled={pagAtual === 1}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}
          >
            ← Anterior
          </button>
          <button
            onClick={() => setPagAtual(p => Math.min(totalPags, p + 1))}
            disabled={pagAtual === totalPags}
            style={{ background: '#1A56DB', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#fff' }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
