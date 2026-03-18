import React, { useState, useEffect } from 'react'
import { query, update } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import Modal from '../../components/Modal.jsx'
import { isFiscal, isBalcao, isAdministracao, podeAtribuirReclamacoes, podeRegistrarReclamacoes, isAdminGeral } from '../../gerencia/gerencia.js'

const STATUS_INFO = {
  nova:           { fundo: '#FEE2E2', cor: '#B91C1C', label: 'Nova' },
  em_atendimento: { fundo: '#FEF3C7', cor: '#B45309', label: 'Em Atendimento' },
  resolvida:      { fundo: '#F0FDF4', cor: '#166534', label: 'Resolvida' },
  arquivada:      { fundo: '#F1F5F9', cor: '#6B7280', label: 'Arquivada' },
}

export default function ReclamacoesScreen({ usuario, setPagina, mostrarToast }) {
  const [reclamacoes, setReclamacoes] = useState([])
  const [fiscais, setFiscais]         = useState([])
  const [busca, setBusca]             = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando]   = useState(true)
  const [selecionada, setSelecionada] = useState(null)
  const [novoFiscal, setNovoFiscal]   = useState('')
  const [atribuindo, setAtribuindo]   = useState(false)

  const podeCriar = podeRegistrarReclamacoes(usuario)

  useEffect(() => { carregar() }, [usuario])

  async function carregar() {
    try {
      const dados = await query('reclamacoes', q => {
        let qr = q.order('created_at', { ascending: false })
        if (!isAdminGeral(usuario)) qr = qr.eq('gerencia', usuario.gerencia)
        // Fiscal só vê as atribuídas a ele
        if (isFiscal(usuario)) qr = qr.eq('fiscal_matricula', usuario.matricula)
        return qr
      })
      setReclamacoes(dados)

      if (podeAtribuirReclamacoes(usuario)) {
        const fs = await query('usuarios', q =>
          q.eq('gerencia', usuario.gerencia).eq('role', 'fiscal').eq('ativo', true).order('name')
        )
        setFiscais(fs)
      }
    } catch {
      mostrarToast('Erro ao carregar reclamações', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  async function atribuirFiscal() {
    if (!novoFiscal) { mostrarToast('Selecione um fiscal', 'erro'); return }
    const fiscal = fiscais.find(f => f.matricula === novoFiscal)
    if (!fiscal) return
    setAtribuindo(true)
    try {
      await update('reclamacoes', selecionada.id, {
        fiscal: fiscal.name,
        fiscal_matricula: fiscal.matricula,
        status: 'em_atendimento',
      })
      mostrarToast(`Atribuída para ${fiscal.name}`, 'sucesso')
      setSelecionada(null)
      carregar()
    } catch { mostrarToast('Erro ao atribuir', 'erro') }
    finally { setAtribuindo(false) }
  }

  const filtradas = reclamacoes.filter(r => {
    const buscaOk = !busca ||
      r.reclamante?.toLowerCase().includes(busca.toLowerCase()) ||
      r.reclamado?.toLowerCase().includes(busca.toLowerCase()) ||
      r.endereco?.toLowerCase().includes(busca.toLowerCase()) ||
      r.protocolo?.includes(busca)
    const statusOk = !filtroStatus || r.status === filtroStatus
    return buscaOk && statusOk
  })

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>
          {isFiscal(usuario) ? 'Minhas Reclamações' : 'Reclamações'}
        </h2>
        {podeCriar && (
          <button onClick={() => setPagina('nova-reclamacao')} style={{
            background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px',
            padding: '8px 14px', fontSize: '0.85rem', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
          }}>
            <Icon name="plus" size={16} color="#fff" /> Nova
          </button>
        )}
      </div>

      {/* Aviso para fiscal */}
      {isFiscal(usuario) && (
        <div style={{ background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.8rem', color: '#1A56DB' }}>
          ℹ️ Você visualiza apenas as reclamações atribuídas a você pelo Balcão ou Administração.
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Icon name="search" size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: '36px' }} />
      </div>

      <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ marginBottom: '16px', fontSize: '0.8rem' }}>
        <option value="">Todos os status</option>
        {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>

      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
        {filtradas.length} reclamação{filtradas.length !== 1 ? 'ões' : ''}
      </div>

      {carregando ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>Carregando...</p>
      ) : filtradas.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed #E2E8F0', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
          {isFiscal(usuario) ? 'Nenhuma reclamação atribuída a você ainda.' : 'Nenhuma reclamação encontrada.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtradas.map(rec => {
            const sc = STATUS_INFO[rec.status] || STATUS_INFO.nova
            return (
              <div key={rec.id} style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px', cursor: 'pointer' }}
                onClick={() => { setSelecionada(rec); setNovoFiscal(rec.fiscal_matricula || '') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', color: '#1A56DB' }}>
                    {rec.protocolo || rec.id.slice(-8).toUpperCase()}
                  </span>
                  <span style={{ background: sc.fundo, color: sc.cor, fontSize: '0.65rem', fontWeight: '700', borderRadius: '999px', padding: '3px 10px' }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '2px' }}>{rec.reclamado || 'Reclamado não informado'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{rec.endereco}{rec.bairro ? ` — ${rec.bairro}` : ''}</div>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: rec.fiscal ? '#166534' : '#94A3B8' }}>
                    {rec.fiscal ? `👤 ${rec.fiscal}` : '⚪ Sem fiscal atribuído'}
                  </span>
                  {rec.prioridade === 'urgente' && <span style={{ fontSize: '0.68rem', color: '#B91C1C', fontWeight: '700' }}>🔴 URGENTE</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de detalhe */}
      <Modal aberto={!!selecionada} onClose={() => setSelecionada(null)} titulo={`Reclamação — ${selecionada?.protocolo || ''}`}>
        {selecionada && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InfoBloco label="Reclamado"  valor={selecionada.reclamado} />
            <InfoBloco label="Endereço"   valor={`${selecionada.endereco || ''}${selecionada.bairro ? ` — ${selecionada.bairro}` : ''}`} />
            {selecionada.reclamante && <InfoBloco label="Reclamante" valor={`${selecionada.reclamante}${selecionada.telefone ? ` — ${selecionada.telefone}` : ''}`} />}
            <InfoBloco label="Origem"     valor={selecionada.origem} />
            {selecionada.descricao && (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '4px' }}>Descrição</div>
                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>
                  {selecionada.descricao}
                </div>
              </div>
            )}

            {/* Atribuição */}
            {podeAtribuirReclamacoes(usuario) && fiscais.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  {selecionada.fiscal ? `Fiscal atual: ${selecionada.fiscal}` : 'Atribuir fiscal'}
                </div>
                <select value={novoFiscal} onChange={e => setNovoFiscal(e.target.value)} style={{ marginBottom: '10px' }}>
                  <option value="">Selecione o fiscal...</option>
                  {fiscais.map(f => <option key={f.matricula} value={f.matricula}>{f.name}</option>)}
                </select>
                <button onClick={atribuirFiscal} disabled={atribuindo} style={{
                  background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', width: '100%',
                }}>
                  {atribuindo ? 'Salvando...' : (selecionada.fiscal ? 'Reatribuir Fiscal' : 'Atribuir Fiscal')}
                </button>
              </div>
            )}

            {/* Ações do fiscal */}
            {isFiscal(usuario) && selecionada.fiscal_matricula === usuario.matricula && (
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px', display: 'flex', gap: '10px' }}>
                <button onClick={() => { setSelecionada(null); setPagina('nova-notificacao', { fromReclamacao: selecionada }) }}
                  style={{ flex: 1, background: '#EBF5FF', color: '#1A56DB', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  📋 Gerar Notificação
                </button>
                <button onClick={() => { setSelecionada(null); setPagina('novo-auto', { fromReclamacao: selecionada }) }}
                  style={{ flex: 1, background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ⚠️ Gerar Auto
                </button>
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
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: '#374151' }}>{valor}</div>
    </div>
  )
}
