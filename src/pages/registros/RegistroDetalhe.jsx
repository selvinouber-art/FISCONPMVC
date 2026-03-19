import React, { useState, useEffect } from 'react'
import { getOne, update, insert } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import { statusCores } from '../../config/theme.js'
import { isGerencia, isAdminGeral, isFiscal, isAdministracao } from '../../gerencia/gerencia.js'
import { mascaraMatricula } from '../../components/MascaraInput.jsx'
import { imprimirDocumentoOficial } from '../../impressao/DocumentoPDF.jsx'

const STATUS_PERMITIDOS = ['Pendente', 'Regularizado', 'Em recurso', 'Autuado']

export default function RegistroDetalhe({ registroId, usuario, mostrarToast, setPagina }) {
  const [registro, setRegistro]       = useState(null)
  const [carregando, setCarregando]   = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [motivoCancel, setMotivoCancel]     = useState('')
  const [solicitando, setSolicitando]       = useState(false)

  useEffect(() => { carregar() }, [registroId])

  async function carregar() {
    try {
      const dados = await getOne('records', registroId)
      setRegistro(dados)
    } catch {
      mostrarToast('Erro ao carregar registro', 'erro')
      setPagina('registros')
    } finally {
      setCarregando(false)
    }
  }

  async function atualizarStatus(novoStatus) {
    setAtualizando(true)
    try {
      await update('records', registro.id, { status: novoStatus })
      await insert('logs', {
        gerencia: registro.gerencia, acao: 'STATUS_ATUALIZADO',
        detalhe: `${registro.num}: "${registro.status}" → "${novoStatus}" por ${usuario.name}`,
        usuario: usuario.name,
      })
      setRegistro(r => ({ ...r, status: novoStatus }))
      mostrarToast(`Status: "${novoStatus}"`, 'sucesso')
    } catch { mostrarToast('Erro ao atualizar', 'erro') }
    finally { setAtualizando(false) }
  }

  async function toggleMultado() {
    const novoMultado = !registro.multado
    try {
      await update('records', registro.id, { multado: novoMultado })
      await insert('logs', {
        gerencia: registro.gerencia, acao: novoMultado ? 'MULTA_ENCAMINHADA' : 'MULTA_DESMARCADA',
        detalhe: `${registro.num}: multa ${novoMultado ? 'marcada como encaminhada' : 'desmarcada'} por ${usuario.name}`,
        usuario: usuario.name,
      })
      setRegistro(r => ({ ...r, multado: novoMultado, status: novoMultado ? 'Multa Encaminhada' : r.status }))
      if (novoMultado) await update('records', registro.id, { status: 'Multa Encaminhada' })
      mostrarToast(novoMultado ? 'Multa marcada como encaminhada!' : 'Marcação removida', novoMultado ? 'sucesso' : 'alerta')
    } catch { mostrarToast('Erro ao atualizar', 'erro') }
  }

  async function solicitarCancelamento() {
    if (!motivoCancel.trim()) { mostrarToast('Informe o motivo', 'erro'); return }
    setSolicitando(true)
    try {
      await insert('cancel_pending', {
        id: `cp-${Date.now()}`, record_id: registro.id,
        record_num: registro.num, record_fiscal: registro.fiscal,
        motivo: motivoCancel.trim(), solicitado_por: usuario.name,
      })
      await insert('logs', {
        gerencia: registro.gerencia, acao: 'SOLICITACAO_CANCELAMENTO',
        detalhe: `Cancelamento solicitado para ${registro.num} por ${usuario.name}. Motivo: ${motivoCancel}`,
        usuario: usuario.name,
      })
      mostrarToast('Solicitação enviada à Gerência', 'sucesso')
      setShowCancelForm(false); setMotivoCancel('')
    } catch { mostrarToast('Erro ao solicitar', 'erro') }
    finally { setSolicitando(false) }
  }

  function imprimirTermica() {
    if (!registro) return
    const matFmt = mascaraMatricula(registro.matricula || '')
    const ehAuto = registro.type === 'auto'
    const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://fiscon.pmvc.ba.gov.br/portal?codigo=${registro.codigo_acesso}`)}`
    const infracoes = (registro.infracoes || []).map(i => `<div style="margin:2px 0;font-size:10px;">• ${i.descricao}</div>`).join('')

    const html = `<!DOCTYPE html><html><head><title>${registro.num}</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'Courier New',monospace; font-size:11px; width:58mm; padding:3mm; background:#fff; }
      .c { text-align:center; } .l { border-top:1px dashed #000; margin:4px 0; }
      .b { font-weight:bold; } .p { font-size:9px; }
      img.br { width:18mm; height:18mm; } img.qr { width:22mm; height:22mm; }
      @media print { @page { size:58mm auto; margin:0; } }
    </style></head><body>
    <div class="c"><img class="br" src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"/></div>
    <div class="l"></div>
    <div class="c b" style="font-size:12px;">${ehAuto ? 'AUTO DE INFRAÇÃO' : 'NOTIFICAÇÃO PRELIMINAR'}</div>
    <div class="c b" style="font-size:13px;letter-spacing:1px;">${registro.num}</div>
    <div class="c p">Data: ${registro.date}</div>
    <div class="l"></div>
    <div class="b">NOTIFICADO:</div>
    <div>${registro.owner || '—'}</div>
    ${registro.cpf ? `<div class="p">CPF/CNPJ: ${registro.cpf}</div>` : ''}
    <div class="p">${registro.addr || '—'}${registro.bairro ? `, ${registro.bairro}` : ''}</div>
    <div class="l"></div>
    <div class="b">INFRAÇÕES:</div>
    ${infracoes}
    ${ehAuto && registro.multa && Number(registro.multa) > 0
      ? `<div class="l"></div><div class="b">MULTA: R$ ${Number(registro.multa).toFixed(2).replace('.',',')}</div>` : ''}
    <div class="l"></div>
    <div class="b">PRAZO: ${registro.prazo || '—'}</div>
    <div class="l"></div>
    <div class="c b">${registro.fiscal || '—'}</div>
    <div class="c p">Mat.: ${matFmt}</div>
    <div class="l"></div>
    <div class="c">
      <div class="p b">Portal do Cidadão:</div>
      <img class="qr" src="${qrUrl}"/>
      <div class="p">Código: <span class="b" style="letter-spacing:2px;">${registro.codigo_acesso || '—'}</span></div>
    </div>
    </body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  if (carregando) return <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Carregando...</div>
  if (!registro)  return null

  const sc        = statusCores[registro.status] || { fundo: '#F1F5F9', cor: '#6B7280' }
  const cancelado = registro.status === 'Cancelado'
  const ehAuto    = registro.type === 'auto'
  // Pode alterar status: administração, gerência, admin ou o próprio fiscal
  const podeAlterar = isAdministracao(usuario) || isGerencia(usuario) || isAdminGeral(usuario) ||
    (isFiscal(usuario) && registro.matricula === usuario.matricula)

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('registros')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.1rem', color: '#1E293B', margin: 0 }}>{registro.num}</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {ehAuto ? '⚠️ Auto de Infração' : '📋 Notificação'} • {registro.date}
          </div>
        </div>
        <span style={{ background: sc.fundo, color: sc.cor, fontSize: '0.72rem', fontWeight: '700', borderRadius: '999px', padding: '4px 12px' }}>
          {registro.status}
        </span>
      </div>

      {cancelado && (
        <div style={{ background: '#FEE2E2', border: '2px solid #FECACA', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.85rem', color: '#B91C1C', fontWeight: '600' }}>
          🚫 Registro cancelado definitivamente. Impressão não disponível.
          {registro.cancelado_em && ` Cancelado em: ${registro.cancelado_em}`}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <Secao titulo="Notificado / Infrator">
          <InfoLinha label="Nome"       valor={registro.owner} />
          <InfoLinha label="CPF/CNPJ"   valor={registro.cpf} />
          <InfoLinha label="Endereço"   valor={registro.addr} />
          <InfoLinha label="Bairro"     valor={registro.bairro} />
          <InfoLinha label="Loteamento" valor={registro.loteamento} />
        </Secao>

        {registro.infracoes?.length > 0 && (
          <Secao titulo={`Infrações (${registro.infracoes.length})`}>
            {registro.infracoes.map((inf, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < registro.infracoes.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ fontSize: '0.82rem', color: '#1E293B' }}>{inf.descricao}</div>
                {ehAuto && inf.valor > 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#B91C1C', fontWeight: '600', marginTop: '2px' }}>
                    R$ {Number(inf.valor).toFixed(2).replace('.', ',')}
                  </div>
                )}
              </div>
            ))}
            {ehAuto && registro.multa && Number(registro.multa) > 0 && (
              <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '10px', textAlign: 'center', marginTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: '#B91C1C' }}>Multa Total</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#B91C1C' }}>
                  R$ {Number(registro.multa).toFixed(2).replace('.', ',')}
                </div>
              </div>
            )}
          </Secao>
        )}

        <Secao titulo="Detalhes">
          <InfoLinha label="Prazo"  valor={registro.prazo} />
          <InfoLinha label="Fiscal" valor={`${registro.fiscal} — Mat. ${mascaraMatricula(registro.matricula || '')}`} />
          {registro.descricao   && <InfoLinha label="Descrição"    valor={registro.descricao} />}
          {registro.testemunha1 && <InfoLinha label="Testemunha 1" valor={registro.testemunha1} />}
          {registro.testemunha2 && <InfoLinha label="Testemunha 2" valor={registro.testemunha2} />}
          {registro.obs_recusa  && <InfoLinha label="Obs. recusa"  valor={registro.obs_recusa} />}
        </Secao>

        {registro.foto_urls?.length > 0 && (
          <Secao titulo={`Fotos (${registro.foto_urls.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {registro.foto_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Foto ${i+1}`} style={{ width: '100%', borderRadius: '8px', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                </a>
              ))}
            </div>
          </Secao>
        )}

        {/* Encaminhar multa — só auto, não cancelado */}
        {ehAuto && !cancelado && podeAlterar && (
          <Secao titulo="Multa">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1E293B' }}>Multa encaminhada ao setor competente?</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  {registro.multado ? '✅ Sim — multa encaminhada' : '⏳ Não — pendente de encaminhamento'}
                </div>
              </div>
              <button onClick={toggleMultado} style={{
                background: registro.multado ? '#F0FDF4' : '#FEF3C7',
                border: `2px solid ${registro.multado ? '#166534' : '#B45309'}`,
                color: registro.multado ? '#166534' : '#B45309',
                borderRadius: '10px', padding: '8px 14px',
                fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                {registro.multado ? '✅ Encaminhada' : 'Marcar encaminhada'}
              </button>
            </div>
          </Secao>
        )}

        {/* Atualizar Status */}
        {!cancelado && podeAlterar && (
          <Secao titulo="Atualizar Situação">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {STATUS_PERMITIDOS.map(s => {
                const sc2 = statusCores[s] || { fundo: '#F1F5F9', cor: '#6B7280' }
                const ativo = registro.status === s
                return (
                  <button key={s} onClick={() => atualizarStatus(s)} disabled={atualizando || ativo} style={{
                    background: ativo ? sc2.fundo : '#fff',
                    border: `2px solid ${ativo ? sc2.cor : '#E2E8F0'}`,
                    borderRadius: '10px', padding: '10px 8px',
                    fontSize: '0.8rem', fontWeight: ativo ? '700' : '500',
                    color: ativo ? sc2.cor : '#374151',
                    cursor: ativo ? 'default' : 'pointer',
                  }}>
                    {ativo ? '✓ ' : ''}{s}
                  </button>
                )
              })}
            </div>
          </Secao>
        )}

        {/* Ações */}
        <Secao titulo="Ações">
          {!cancelado && (
            <>
              <button onClick={imprimirTermica} style={{
                width: '100%', background: '#1A56DB', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '8px',
              }}>
                🖨️ Imprimir Térmica (58mm)
              </button>
              <button onClick={() => imprimirDocumentoOficial(registro)} style={{
                width: '100%', background: '#166534', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '8px',
              }}>
                📄 Documento Oficial A4 (PDF)
              </button>
            </>
          )}

          {!cancelado && ehAuto === false && registro.status === 'Pendente' &&
            isFiscal(usuario) && registro.matricula === usuario.matricula && (
            <button onClick={() => setPagina('novo-auto', registro)} style={{
              width: '100%', background: '#FEE2E2', color: '#B91C1C',
              border: '2px solid #FECACA', borderRadius: '10px', padding: '12px',
              fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px',
            }}>
              ⚠️ Encaminhar para Auto de Infração
            </button>
          )}

          {!cancelado && !isGerencia(usuario) && !isAdminGeral(usuario) && (
            !showCancelForm ? (
              <button onClick={() => setShowCancelForm(true)} style={{
                width: '100%', background: '#F1F5F9', color: '#6B7280',
                border: '2px solid #E2E8F0', borderRadius: '10px', padding: '12px',
                fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
              }}>
                Solicitar Cancelamento à Gerência
              </button>
            ) : (
              <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#C2410C', marginBottom: '10px' }}>
                  Motivo do cancelamento *
                </div>
                <textarea value={motivoCancel} onChange={e => setMotivoCancel(e.target.value)}
                  placeholder="Descreva o motivo..." rows={3} style={{ resize: 'vertical', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={solicitarCancelamento} disabled={solicitando} style={{
                    flex: 1, background: '#C2410C', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    {solicitando ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                  <button onClick={() => { setShowCancelForm(false); setMotivoCancel('') }} style={{
                    flex: 1, background: '#F1F5F9', color: '#6B7280', border: 'none',
                    borderRadius: '8px', padding: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )
          )}

          {!cancelado && (isGerencia(usuario) || isAdminGeral(usuario)) && (
            <button onClick={async () => {
              if (!window.confirm('Confirmar cancelamento definitivo?')) return
              await update('records', registro.id, { status: 'Cancelado', cancelado_em: new Date().toLocaleDateString('pt-BR') })
              await insert('logs', { gerencia: registro.gerencia, acao: 'CANCELAMENTO_AUTORIZADO', detalhe: `${registro.num} cancelado por ${usuario.name}`, usuario: usuario.name })
              setRegistro(r => ({ ...r, status: 'Cancelado', cancelado_em: new Date().toLocaleDateString('pt-BR') }))
              mostrarToast('Registro cancelado', 'sucesso')
            }} style={{
              width: '100%', background: '#FEE2E2', color: '#B91C1C',
              border: '2px solid #FECACA', borderRadius: '10px', padding: '12px',
              fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', marginTop: '8px',
            }}>
              🗑️ Cancelar Registro (Definitivo)
            </button>
          )}
        </Secao>
      </div>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '14px' }}>
      <h3 style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</h3>
      {children}
    </div>
  )
}

function InfoLinha({ label, valor }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', fontSize: '0.85rem' }}>
      <span style={{ color: '#94A3B8', minWidth: '90px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1E293B', fontWeight: '500' }}>{valor}</span>
    </div>
  )
}
