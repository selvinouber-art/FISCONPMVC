import React, { useState, useEffect } from 'react'
import { query, update, insert, remove } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import { isGerencia, isAdminGeral } from '../../gerencia/gerencia.js'

export default function CancelamentosScreen({ usuario, mostrarToast, setPagina }) {
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const dados = await query('cancel_pending', q => {
        let qr = q.order('created_at', { ascending: false })
        if (!isAdminGeral(usuario)) {
          // Filtra por gerência buscando os records
          return qr
        }
        return qr
      })
      setPendentes(dados || [])
    } catch {
      mostrarToast('Erro ao carregar solicitações', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  async function autorizar(item) {
    setProcessando(item.id)
    try {
      await update('records', item.record_id, {
        status: 'Cancelado',
        motivo_cancel: item.motivo,
        cancelado_em: new Date().toLocaleDateString('pt-BR'),
      })
      await insert('logs', {
        gerencia: usuario.gerencia,
        acao: 'CANCELAMENTO_AUTORIZADO',
        detalhe: `Cancelamento de ${item.record_num} autorizado por ${usuario.name}. Solicitado por: ${item.solicitado_por}. Motivo: ${item.motivo}`,
        usuario: usuario.name,
      })
      await remove('cancel_pending', item.id)
      mostrarToast(`${item.record_num} cancelado com sucesso`, 'sucesso')
      carregar()
    } catch { mostrarToast('Erro ao autorizar cancelamento', 'erro') }
    finally { setProcessando(null) }
  }

  async function recusar(item) {
    setProcessando(item.id)
    try {
      await insert('logs', {
        gerencia: usuario.gerencia,
        acao: 'CANCELAMENTO_RECUSADO',
        detalhe: `Cancelamento de ${item.record_num} RECUSADO por ${usuario.name}. Solicitado por: ${item.solicitado_por}. Motivo: ${item.motivo}`,
        usuario: usuario.name,
      })
      await remove('cancel_pending', item.id)
      mostrarToast(`Solicitação de ${item.record_num} recusada`, 'alerta')
      carregar()
    } catch { mostrarToast('Erro ao recusar', 'erro') }
    finally { setProcessando(null) }
  }

  const podeCancelar = isGerencia(usuario) || isAdminGeral(usuario)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Cancelamentos</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {podeCancelar ? 'Solicitações pendentes de aprovação' : 'Suas solicitações de cancelamento'}
          </div>
        </div>
      </div>

      {carregando ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>Carregando...</p>
      ) : pendentes.length === 0 ? (
        <div style={{ background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#166534' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <div style={{ fontWeight: '600' }}>Nenhuma solicitação pendente</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendentes.map(item => (
            <div key={item.id} style={{
              background: '#fff',
              border: '2px solid #FED7AA',
              borderLeft: '4px solid #C2410C',
              borderRadius: '14px',
              padding: '14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B' }}>{item.record_num}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    Solicitado por: <strong>{item.solicitado_por}</strong>
                  </div>
                  {item.record_fiscal && (
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Fiscal: {item.record_fiscal}</div>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''}
                </div>
              </div>

              <div style={{ background: '#FFF7ED', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#C2410C', fontWeight: '600', marginBottom: '4px' }}>MOTIVO:</div>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>{item.motivo}</div>
              </div>

              {/* Botões — só gerente/admin vê */}
              {podeCancelar && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => autorizar(item)}
                    disabled={processando === item.id}
                    style={{
                      flex: 1, background: '#166534', color: '#fff', border: 'none',
                      borderRadius: '8px', padding: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    ✅ Autorizar Cancelamento
                  </button>
                  <button
                    onClick={() => recusar(item)}
                    disabled={processando === item.id}
                    style={{
                      flex: 1, background: '#F1F5F9', color: '#6B7280', border: '2px solid #E2E8F0',
                      borderRadius: '8px', padding: '10px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    ❌ Recusar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
