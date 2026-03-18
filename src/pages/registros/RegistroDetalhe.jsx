import React, { useState, useEffect, useRef } from 'react'
import { getOne, update, insert, query } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import { statusCores } from '../../config/theme.js'
import { isGerencia, isAdminGeral, isFiscal, mascaraMatricula } from '../../gerencia/gerencia.js'
import { mascaraMatricula as fmtMat } from '../../components/MascaraInput.jsx'
import { INFO_MODULO } from '../../gerencia/GerenciaUI.jsx'

const STATUS_PERMITIDOS = ['Pendente', 'Regularizado', 'Em recurso', 'Autuado']

export default function RegistroDetalhe({ registroId, usuario, mostrarToast, setPagina }) {
  const [registro, setRegistro] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [solicitandoCancel, setSolicitandoCancel] = useState(false)
  const [motivoCancel, setMotivoCancel] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const printRef = useRef()

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
        gerencia: registro.gerencia,
        acao: 'STATUS_ATUALIZADO',
        detalhe: `${registro.num}: status alterado de "${registro.status}" para "${novoStatus}" por ${usuario.name}`,
        usuario: usuario.name,
      })
      setRegistro(r => ({ ...r, status: novoStatus }))
      mostrarToast(`Status atualizado para ${novoStatus}`, 'sucesso')
    } catch { mostrarToast('Erro ao atualizar status', 'erro') }
    finally { setAtualizando(false) }
  }

  async function solicitarCancelamento() {
    if (!motivoCancel.trim()) { mostrarToast('Informe o motivo', 'erro'); return }
    setSolicitandoCancel(true)
    try {
      await insert('cancel_pending', {
        id: `cp-${Date.now()}`,
        record_id: registro.id,
        record_num: registro.num,
        record_fiscal: registro.fiscal,
        motivo: motivoCancel.trim(),
        solicitado_por: usuario.name,
      })
      await insert('logs', {
        gerencia: registro.gerencia,
        acao: 'SOLICITACAO_CANCELAMENTO',
        detalhe: `Cancelamento solicitado para ${registro.num} por ${usuario.name}. Motivo: ${motivoCancel}`,
        usuario: usuario.name,
      })
      mostrarToast('Solicitação enviada à Gerência', 'sucesso')
      setShowCancelForm(false)
      setMotivoCancel('')
    } catch { mostrarToast('Erro ao solicitar cancelamento', 'erro') }
    finally { setSolicitandoCancel(false) }
  }

  function imprimirTermica() {
    if (!registro) return
    const info = INFO_MODULO[registro.gerencia] || INFO_MODULO.obras
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://fiscon.pmvc.ba.gov.br/portal?codigo=${registro.codigo_acesso}`)}`
    const infracoes = (registro.infracoes || []).map(i => `<div style="margin:2px 0;font-size:10px;">• ${i.descricao}${i.valor > 0 ? ` — R$ ${Number(i.valor).toFixed(2).replace('.',',')}` : ''}</div>`).join('')

    const html = `<!DOCTYPE html><html><head><title>${registro.num}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Courier New', monospace; font-size: 11px; width: 58mm; padding: 3mm; background: #fff; }
      .centro { text-align: center; }
      .linha { border-top: 1px dashed #000; margin: 4px 0; }
      .titulo { font-size: 13px; font-weight: bold; }
      .negrito { font-weight: bold; }
      .pequeno { font-size: 9px; }
      img.brasao { width: 20mm; height: 20mm; }
      img.qr { width: 20mm; height: 20mm; }
      @media print { @page { size: 58mm auto; margin: 0; } }
    </style></head><body>
    <div class="centro">
      <img class="brasao" src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg" />
      <div class="pequeno">Prefeitura Municipal de Vitória da Conquista</div>
      <div class="negrito" style="font-size:10px;">${info.secretaria}</div>
      <div class="pequeno">${info.gerencia}</div>
    </div>
    <div class="linha"></div>
    <div class="centro titulo">${registro.type === 'auto' ? 'AUTO DE INFRAÇÃO' : 'NOTIFICAÇÃO PRELIMINAR'}</div>
    <div class="centro negrito" style="font-size:13px;letter-spacing:1px;">${registro.num}</div>
    <div class="centro pequeno">Data: ${registro.date}</div>
    <div class="linha"></div>
    <div class="negrito">NOTIFICADO/AUTUADO:</div>
    <div>${registro.owner || '-'}</div>
    ${registro.cpf ? `<div class="pequeno">CPF/CNPJ: ${registro.cpf}</div>` : ''}
    <div class="pequeno">${registro.addr || '-'}${registro.bairro ? `, ${registro.bairro}` : ''}</div>
    <div class="linha"></div>
    <div class="negrito">INFRAÇÕES:</div>
    ${infracoes}
    ${registro.multa && Number(registro.multa) > 0 ? `<div class="linha"></div><div class="negrito">MULTA TOTAL: R$ ${Number(registro.multa).toFixed(2).replace('.',',')}</div>` : ''}
    <div class="linha"></div>
    <div class="negrito">PRAZO: ${registro.prazo || '-'}</div>
    <div class="linha"></div>
    <div>Fiscal: ${registro.fiscal || '-'}</div>
    <div class="pequeno">Mat.: ${fmtMat(registro.matricula || '')}</div>
    <div class="linha"></div>
    <div class="centro">
      <div class="pequeno negrito">Acesse o Portal do Cidadão:</div>
      <img class="qr" src="${qrUrl}" />
      <div class="pequeno">Código de acesso:</div>
      <div class="negrito" style="font-size:13px;letter-spacing:2px;">${registro.codigo_acesso || '-'}</div>
      <div class="pequeno">fiscon.pmvc.ba.gov.br/portal</div>
    </div>
    <div class="linha"></div>
    <div class="centro pequeno">Este documento é válido como notificação oficial.<br/>Vitória da Conquista — BA</div>
    </body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  if (carregando) return <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Carregando...</div>
  if (!registro) return null

  const sc = statusCores[registro.status] || { fundo: '#F1F5F9', cor: '#6B7280' }
  const podeAlterar = !isFiscal(usuario) || registro.matricula === usuario.matricula

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
            {registro.type === 'auto' ? '⚠️ Auto de Infração' : '📋 Notificação Preliminar'} • {registro.date}
          </div>
        </div>
        <span style={{ background: sc.fundo, color: sc.cor, fontSize: '0.72rem', fontWeight: '700', borderRadius: '999px', padding: '4px 12px' }}>
          {registro.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Dados do notificado */}
        <Secao titulo="Notificado / Infrator">
          <InfoLinha label="Nome"       valor={registro.owner} />
          <InfoLinha label="CPF/CNPJ"   valor={registro.cpf} />
          <InfoLinha label="Endereço"   valor={registro.addr} />
          <InfoLinha label="Bairro"     valor={registro.bairro} />
          <InfoLinha label="Loteamento" valor={registro.loteamento} />
        </Secao>

        {/* Infrações */}
        {registro.infracoes?.length > 0 && (
          <Secao titulo={`Infrações (${registro.infracoes.length})`}>
            {registro.infracoes.map((inf, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < registro.infracoes.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ fontSize: '0.82rem', color: '#1E293B' }}>{inf.descricao}</div>
                {inf.valor > 0 && <div style={{ fontSize: '0.72rem', color: '#B91C1C', fontWeight: '600', marginTop: '2px' }}>R$ {Number(inf.valor).toFixed(2).replace('.', ',')}</div>}
              </div>
            ))}
            {registro.multa && Number(registro.multa) > 0 && (
              <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '10px', textAlign: 'center', marginTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: '#B91C1C' }}>Multa Total</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#B91C1C' }}>R$ {Number(registro.multa).toFixed(2).replace('.', ',')}</div>
              </div>
            )}
          </Secao>
        )}

        {/* Detalhes */}
        <Secao titulo="Detalhes">
          <InfoLinha label="Prazo"      valor={registro.prazo} />
          <InfoLinha label="Fiscal"     valor={`${registro.fiscal} — Mat. ${fmtMat(registro.matricula || '')}`} />
          {registro.descricao && <InfoLinha label="Descrição" valor={registro.descricao} />}
          {registro.testemunha1 && <InfoLinha label="Testemunha 1" valor={registro.testemunha1} />}
          {registro.testemunha2 && <InfoLinha label="Testemunha 2" valor={registro.testemunha2} />}
          {registro.obs_recusa  && <InfoLinha label="Obs. recusa"  valor={registro.obs_recusa} />}
        </Secao>

        {/* Fotos */}
        {registro.foto_urls?.length > 0 && (
          <Secao titulo={`Fotos (${registro.foto_urls.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {registro.foto_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Foto ${i+1}`} style={{ width: '100%', borderRadius: '8px', height: '100px', objectFit: 'cover', display: 'block' }} />
                </a>
              ))}
            </div>
          </Secao>
        )}

        {/* Atualizar Status */}
        {podeAlterar && registro.status !== 'Cancelado' && (
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
          {/* Imprimir */}
          <button onClick={imprimirTermica} style={{
            width: '100%', background: '#1A56DB', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px',
          }}>
            🖨️ Imprimir (Térmica 58mm)
          </button>

          {/* Encaminhar para autuação — só se for notificação pendente */}
          {registro.type === 'notif' && registro.status === 'Pendente' && isFiscal(usuario) && registro.matricula === usuario.matricula && (
            <button onClick={() => setPagina('novo-auto', registro)} style={{
              width: '100%', background: '#FEE2E2', color: '#B91C1C', border: '2px solid #FECACA',
              borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.9rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px',
            }}>
              ⚠️ Encaminhar para Auto de Infração
            </button>
          )}

          {/* Solicitar cancelamento */}
          {registro.status !== 'Cancelado' && !isGerencia(usuario) && !isAdminGeral(usuario) && (
            <>
              {!showCancelForm ? (
                <button onClick={() => setShowCancelForm(true)} style={{
                  width: '100%', background: '#F1F5F9', color: '#6B7280', border: '2px solid #E2E8F0',
                  borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                }}>
                  Solicitar Cancelamento
                </button>
              ) : (
                <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#C2410C', marginBottom: '10px' }}>
                    Solicitar cancelamento à Gerência
                  </div>
                  <textarea
                    value={motivoCancel}
                    onChange={e => setMotivoCancel(e.target.value)}
                    placeholder="Informe o motivo do cancelamento..."
                    rows={3} style={{ resize: 'vertical', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={solicitarCancelamento} disabled={solicitandoCancel} style={{
                      flex: 1, background: '#C2410C', color: '#fff', border: 'none',
                      borderRadius: '8px', padding: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
                    }}>
                      {solicitandoCancel ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                    <button onClick={() => { setShowCancelForm(false); setMotivoCancel('') }} style={{
                      flex: 1, background: '#F1F5F9', color: '#6B7280', border: 'none',
                      borderRadius: '8px', padding: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem',
                    }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Gerente pode cancelar diretamente */}
          {(isGerencia(usuario) || isAdminGeral(usuario)) && registro.status !== 'Cancelado' && (
            <button onClick={async () => {
              if (!window.confirm('Confirmar cancelamento definitivo?')) return
              await update('records', registro.id, { status: 'Cancelado', cancelado_em: new Date().toLocaleDateString('pt-BR') })
              await insert('logs', { gerencia: registro.gerencia, acao: 'CANCELAMENTO_AUTORIZADO', detalhe: `${registro.num} cancelado por ${usuario.name}`, usuario: usuario.name })
              setRegistro(r => ({ ...r, status: 'Cancelado' }))
              mostrarToast('Registro cancelado', 'sucesso')
            }} style={{
              width: '100%', background: '#FEE2E2', color: '#B91C1C', border: '2px solid #FECACA',
              borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', marginTop: '8px',
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
