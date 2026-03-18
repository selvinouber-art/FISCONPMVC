import React, { useState, useEffect } from 'react'
import { query, update, insert } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import Modal from '../../components/Modal.jsx'
import { isFiscal, isGerencia, isAdminGeral, podeJulgarDefesas } from '../../gerencia/gerencia.js'

const STATUS = {
  pendente:    { fundo: '#FEF3C7', cor: '#B45309', label: 'Pendente' },
  deferida:    { fundo: '#F0FDF4', cor: '#166534', label: 'Deferida' },
  indeferida:  { fundo: '#FEE2E2', cor: '#B91C1C', label: 'Indeferida' },
}

export default function DefesasScreen({ usuario, mostrarToast, setPagina }) {
  const [defesas, setDefesas]       = useState([])
  const [carregando, setCarregando] = useState(true)
  const [selecionada, setSelecionada] = useState(null)
  const [parecer, setParecer]       = useState('')
  const [julgando, setJulgando]     = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const dados = await query('defesas', q => {
        let qr = q.order('created_at', { ascending: false })
        if (!isAdminGeral(usuario)) qr = qr.eq('gerencia', usuario.gerencia)
        return qr
      })

      // Fiscal só vê defesas dos registros que ele emitiu
      if (isFiscal(usuario)) {
        const matricula = usuario.matricula
        // Busca os records do fiscal
        const { query: qFn } = await import('../../config/supabase.js')
        const meusRegistros = await qFn('records', q => q.eq('matricula', matricula).select('id'))
        const meuIds = (meusRegistros || []).map(r => r.id)
        setDefesas((dados || []).filter(d => meuIds.includes(d.record_id)))
      } else {
        setDefesas(dados || [])
      }
    } catch {
      mostrarToast('Erro ao carregar defesas', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  async function julgar(decisao) {
    if (!parecer.trim()) { mostrarToast('Informe o parecer', 'erro'); return }
    setJulgando(true)
    try {
      await update('defesas', selecionada.id, {
        status: decisao,
        parecer,
        julgado_por: usuario.name,
        julgado_em: new Date().toLocaleDateString('pt-BR'),
      })
      await insert('logs', {
        gerencia: usuario.gerencia,
        acao: `DEFESA_${decisao.toUpperCase()}`,
        detalhe: `Defesa de ${selecionada.record_num} ${decisao} por ${usuario.name}. Parecer: ${parecer}`,
        usuario: usuario.name,
      })
      mostrarToast(`Defesa ${decisao}!`, 'sucesso')
      setSelecionada(null)
      carregar()
    } catch { mostrarToast('Erro ao julgar', 'erro') }
    finally { setJulgando(false) }
  }

  const podeJulgar = podeJulgarDefesas(usuario)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setPagina('mais')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Defesas</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {isFiscal(usuario) ? 'Defesas das suas notificações/autos' : 'Todas as defesas recebidas'}
          </div>
        </div>
      </div>

      {carregando ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>Carregando...</p>
      ) : defesas.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed #E2E8F0', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
          <Icon name="shield" size={32} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
          <div>Nenhuma defesa recebida</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {defesas.map(def => {
            const sc = STATUS[def.status] || STATUS.pendente
            return (
              <div key={def.id}
                onClick={() => { setSelecionada(def); setParecer(def.parecer || '') }}
                style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1A56DB' }}>{def.record_num}</span>
                  <span style={{ background: sc.fundo, color: sc.cor, fontSize: '0.65rem', fontWeight: '700', borderRadius: '999px', padding: '3px 10px' }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#374151' }}>{def.nome}</div>
                {def.cpf && <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>CPF: {def.cpf}</div>}
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                  {def.created_at ? new Date(def.created_at).toLocaleDateString('pt-BR') : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal aberto={!!selecionada} onClose={() => setSelecionada(null)} titulo={`Defesa — ${selecionada?.record_num}`}>
        {selecionada && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InfoBloco label="Defensor" valor={`${selecionada.nome}${selecionada.cpf ? ` — CPF: ${selecionada.cpf}` : ''}`} />
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>Texto da defesa</div>
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>
                {selecionada.texto}
              </div>
            </div>
            {selecionada.anexos?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '6px' }}>Anexos</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selecionada.anexos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#1A56DB' }}>📎 Anexo {i+1}</a>
                  ))}
                </div>
              </div>
            )}

            {selecionada.status === 'pendente' && podeJulgar ? (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Parecer *</div>
                <textarea value={parecer} onChange={e => setParecer(e.target.value)} rows={4} placeholder="Fundamente a decisão..." style={{ resize: 'vertical', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => julgar('deferida')} disabled={julgando} style={{ flex: 1, background: '#166534', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    ✅ Deferir
                  </button>
                  <button onClick={() => julgar('indeferida')} disabled={julgando} style={{ flex: 1, background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    ❌ Indeferir
                  </button>
                </div>
              </div>
            ) : selecionada.status !== 'pendente' ? (
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Parecer — {selecionada.julgado_por} em {selecionada.julgado_em}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>{selecionada.parecer}</div>
              </div>
            ) : (
              <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '12px', fontSize: '0.82rem', color: '#B45309' }}>
                ⏳ Aguardando julgamento pela Gerência
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoBloco({ label, valor }) {
  if (!valor) return null
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: '#374151' }}>{valor}</div>
    </div>
  )
}
