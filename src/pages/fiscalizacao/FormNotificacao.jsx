import React, { useState, useEffect } from 'react'
import { insert, get, upload, query } from '../../config/supabase.js'
import { gerarCodigoAcesso, gerarNumDocumento, isFiscal } from '../../gerencia/gerencia.js'
import PhotoSlot from '../../components/PhotoSlot.jsx'
import MascaraInput, { mascaraMatricula, apenasDigitos } from '../../components/MascaraInput.jsx'
import InfracoesObras from './InfracoesObras.jsx'
import InfracoesPosturas from './InfracoesPosturas.jsx'
import Icon from '../../components/Icon.jsx'
import { PRAZOS_NOTIFICACAO, calcularDataVencimento } from '../../config/constants.js'

export default function FormNotificacao({ usuario, mostrarToast, setPagina, params }) {
  const fromRec = params?.fromReclamacao

  const [form, setForm] = useState({
    owner: fromRec?.reclamado || '',
    cpf: '', addr: fromRec?.endereco || '',
    bairro: fromRec?.bairro || '',
    loteamento: '', descricao: fromRec?.descricao || '',
    prazoDias: '', infracoes: [],
  })
  const [bairros, setBairros]   = useState([])
  const [fotos, setFotos]       = useState([null, null, null, null])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros]       = useState({})

  useEffect(() => {
    if (usuario.gerencia === 'obras') {
      get('bairros', { ativo: true })
        .then(dados => {
          const lista = (dados || []).sort((a, b) => a.nome.localeCompare(b.nome))
          // Bairros do fiscal ficam no topo
          const bairrosFiscal = usuario.bairros || []
          if (bairrosFiscal.length > 0) {
            const doFiscal = lista.filter(b => bairrosFiscal.includes(b.nome))
            const outros   = lista.filter(b => !bairrosFiscal.includes(b.nome))
            setBairros([...doFiscal, { divisor: true }, ...outros])
          } else {
            setBairros(lista)
          }
        })
        .catch(() => setBairros([]))
    }
  }, [])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErros(e => ({ ...e, [campo]: '' }))
  }

  async function handleFoto(index, arquivo) {
    try {
      const url = await upload('fiscon-fotos', `fotos/${Date.now()}_${index}.jpg`, arquivo)
      const novas = [...fotos]; novas[index] = url; setFotos(novas)
    } catch { mostrarToast('Erro ao enviar foto', 'erro') }
  }

  function validar() {
    const e = {}
    if (!form.owner.trim())          e.owner    = 'Nome obrigatório'
    if (!form.addr.trim())           e.addr     = 'Endereço obrigatório'
    if (form.infracoes.length === 0) e.infracoes = 'Selecione ao menos uma infração'
    if (!form.prazoDias)             e.prazoDias = 'Selecione o prazo'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function salvar() {
    if (!validar()) { mostrarToast('Preencha os campos obrigatórios', 'erro'); return }
    setSalvando(true)
    try {
      const anoAtual = new Date().getFullYear()
      const prefixo  = usuario.gerencia === 'obras' ? 'NP-OB' : 'NP-PO'
      const existentes = await query('records', q =>
        q.eq('gerencia', usuario.gerencia).eq('type', 'notif').like('num', `${prefixo}-%/${anoAtual}`)
      )
      const seq         = (existentes?.length || 0) + 1
      const num         = gerarNumDocumento('notif', usuario.gerencia, seq)
      const codigo_acesso = gerarCodigoAcesso()
      const prazoData   = calcularDataVencimento(Number(form.prazoDias))
      const matFormatada = mascaraMatricula(usuario.matricula)

      await insert('records', {
        id: `notif-${Date.now()}`, num, type: 'notif',
        gerencia: usuario.gerencia,
        owner: form.owner.trim(), cpf: apenasDigitos(form.cpf),
        addr: form.addr.trim(), bairro: form.bairro, loteamento: form.loteamento,
        descricao: form.descricao, prazo: prazoData,
        infracoes: form.infracoes, fiscal: usuario.name, matricula: usuario.matricula,
        status: 'Pendente', codigo_acesso,
        foto_urls: fotos.filter(Boolean),
        date: new Date().toLocaleDateString('pt-BR'),
        notif_rec_id: fromRec?.id || null,
      })
      await insert('logs', {
        gerencia: usuario.gerencia, acao: 'NOVA_NOTIFICACAO',
        detalhe: `${num} emitida. Prop.: ${form.owner}. End.: ${form.addr}. Infrações: ${form.infracoes.length}. Prazo: ${prazoData}. Fiscal: ${usuario.name} (Mat. ${matFormatada}).`,
        usuario: usuario.name,
      })
      mostrarToast(`Notificação ${num} criada!`, 'sucesso')
      setPagina('registros')
    } catch (err) {
      console.error(err)
      mostrarToast(`Erro: ${err.message || 'tente novamente'}`, 'erro')
    } finally { setSalvando(false) }
  }

  const ehObras = usuario.gerencia === 'obras'

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('registros')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Nova Notificação</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {usuario.name} — Mat. {mascaraMatricula(usuario.matricula)}
          </div>
        </div>
      </div>

      {fromRec && (
        <div style={{ background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#1A56DB' }}>
          📋 Pré-preenchido da reclamação <strong>{fromRec.protocolo}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Secao titulo="Proprietário / Infrator">
          <Campo label="Nome completo *" erro={erros.owner}>
            <input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Nome do proprietário" />
          </Campo>
          <Campo label="CPF / CNPJ">
            <MascaraInput tipo="cpfCnpj" value={form.cpf} onChange={v => set('cpf', v)} />
          </Campo>
        </Secao>

        <Secao titulo="Endereço">
          <Campo label="Endereço completo *" erro={erros.addr}>
            <input value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="Rua, número" />
          </Campo>
          <Campo label="Bairro">
            {ehObras && bairros.length > 0 ? (
              <select value={form.bairro} onChange={e => set('bairro', e.target.value)}>
                <option value="">Selecione o bairro</option>
                {(usuario.bairros || []).length > 0 && (
                  <optgroup label="Meus bairros">
                    {bairros.filter(b => !b.divisor && (usuario.bairros || []).includes(b.nome)).map(b => (
                      <option key={b.id} value={b.nome}>{b.nome}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Outros bairros">
                  {bairros.filter(b => !b.divisor && !(usuario.bairros || []).includes(b.nome)).map(b => (
                    <option key={b.id} value={b.nome}>{b.nome}</option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <input value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
            )}
          </Campo>
          {ehObras && (
            <Campo label="Loteamento">
              <input value={form.loteamento} onChange={e => set('loteamento', e.target.value)} placeholder="Nome do loteamento" />
            </Campo>
          )}
        </Secao>

        <Secao titulo="Infrações *">
          {erros.infracoes && <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#B91C1C' }}>{erros.infracoes}</div>}
          {ehObras
            ? <InfracoesObras selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
            : <InfracoesPosturas selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
          }
        </Secao>

        <Secao titulo="Detalhes">
          <Campo label="Descrição">
            <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva a irregularidade..." rows={3} style={{ resize: 'vertical' }} />
          </Campo>
          <Campo label="Prazo para regularização *" erro={erros.prazoDias}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PRAZOS_NOTIFICACAO.map(p => (
                <button key={p.valor} type="button" onClick={() => set('prazoDias', p.valor)} style={{
                  flex: 1, padding: '10px 6px', borderRadius: '10px',
                  border: `2px solid ${form.prazoDias === p.valor ? '#1A56DB' : '#E2E8F0'}`,
                  background: form.prazoDias === p.valor ? '#EBF5FF' : '#fff',
                  color: form.prazoDias === p.valor ? '#1A56DB' : '#374151',
                  fontWeight: form.prazoDias === p.valor ? '700' : '500',
                  fontSize: '0.85rem', cursor: 'pointer',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
            {form.prazoDias && (
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>
                ✅ Vence em: <strong>{calcularDataVencimento(Number(form.prazoDias))}</strong>
              </div>
            )}
          </Campo>
        </Secao>

        <Secao titulo="Fotos (até 4)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {fotos.map((url, i) => (
              <PhotoSlot key={i} url={url} label={`Foto ${i+1}`}
                onUpload={arquivo => handleFoto(i, arquivo)}
                onRemove={() => { const n = [...fotos]; n[i] = null; setFotos(n) }}
              />
            ))}
          </div>
        </Secao>

        <button onClick={salvar} disabled={salvando} style={{
          background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '12px',
          padding: '16px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Icon name="check" size={18} color="#fff" />
          {salvando ? 'Salvando...' : 'Salvar Notificação'}
        </button>
      </div>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '16px' }}>
      <h3 style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Campo({ label, children, erro }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>}
      {children}
      {erro && <span style={{ fontSize: '0.72rem', color: '#B91C1C' }}>{erro}</span>}
    </div>
  )
}
