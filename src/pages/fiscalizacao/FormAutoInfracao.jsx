import React, { useState, useEffect } from 'react'
import { insert, upload, query, get } from '../../config/supabase.js'
import { gerarCodigoAcesso, gerarNumDocumento } from '../../gerencia/gerencia.js'
import PhotoSlot from '../../components/PhotoSlot.jsx'
import MascaraInput, { mascaraMatricula, apenasDigitos } from '../../components/MascaraInput.jsx'
import InfracoesObras from './InfracoesObras.jsx'
import InfracoesPosturas from './InfracoesPosturas.jsx'
import Icon from '../../components/Icon.jsx'
import { PRAZO_AUTO_DIAS, calcularDataVencimento } from '../../config/constants.js'

export default function FormAutoInfracao({ usuario, mostrarToast, setPagina, notificacao }) {
  const fromRec = notificacao?.fromReclamacao

  const [form, setForm] = useState({
    owner:     notificacao?.owner || fromRec?.reclamado || '',
    cpf:       notificacao?.cpf   || '',
    addr:      notificacao?.addr  || fromRec?.endereco || '',
    bairro:    notificacao?.bairro || fromRec?.bairro || '',
    descricao: notificacao?.descricao || fromRec?.descricao || '',
    infracoes: notificacao?.infracoes || [],
    testemunha1: '', testemunha2: '', obs_recusa: '',
  })
  const [bairros, setBairros]   = useState([])
  const [fotos, setFotos]       = useState([null, null, null, null])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros]       = useState({})

  const prazoFixo = calcularDataVencimento(PRAZO_AUTO_DIAS)
  const ehObras   = usuario.gerencia === 'obras'
  const totalMulta = form.infracoes.reduce((acc, i) => acc + (Number(i.valor) || 0), 0)

  useEffect(() => {
    if (ehObras) {
      get('bairros', { ativo: true }).then(dados => {
        const lista = (dados || []).sort((a, b) => a.nome.localeCompare(b.nome))
        const bairrosFiscal = usuario.bairros || []
        if (bairrosFiscal.length > 0) {
          const doFiscal = lista.filter(b => bairrosFiscal.includes(b.nome))
          const outros   = lista.filter(b => !bairrosFiscal.includes(b.nome))
          setBairros([...doFiscal, ...outros])
        } else {
          setBairros(lista)
        }
      }).catch(() => setBairros([]))
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
    if (!apenasDigitos(form.cpf))    e.cpf      = 'CPF/CNPJ obrigatório'
    if (form.infracoes.length === 0) e.infracoes = 'Selecione ao menos uma infração'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function salvar() {
    if (!validar()) { mostrarToast('Preencha os campos obrigatórios', 'erro'); return }
    setSalvando(true)
    try {
      const anoAtual   = new Date().getFullYear()
      const prefixo    = usuario.gerencia === 'obras' ? 'AI-OB' : 'AI-PO'
      const existentes = await query('records', q =>
        q.eq('gerencia', usuario.gerencia).eq('type', 'auto').like('num', `${prefixo}-%/${anoAtual}`)
      )
      const seq          = (existentes?.length || 0) + 1
      const num          = gerarNumDocumento('auto', usuario.gerencia, seq)
      const codigo_acesso = gerarCodigoAcesso()
      const matFormatada = mascaraMatricula(usuario.matricula)

      await insert('records', {
        id: `auto-${Date.now()}`, num, type: 'auto',
        gerencia: usuario.gerencia,
        owner: form.owner.trim(), cpf: apenasDigitos(form.cpf),
        addr: form.addr.trim(), bairro: form.bairro, descricao: form.descricao,
        infracoes: form.infracoes, multa: totalMulta.toFixed(2),
        testemunha1: form.testemunha1, testemunha2: form.testemunha2, obs_recusa: form.obs_recusa,
        fiscal: usuario.name, matricula: usuario.matricula,
        status: 'Autuado', codigo_acesso,
        foto_urls: fotos.filter(Boolean),
        date: new Date().toLocaleDateString('pt-BR'),
        prazo: prazoFixo,
        notif_id: notificacao?.id || null, notif_num: notificacao?.num || null,
      })
      await insert('logs', {
        gerencia: usuario.gerencia, acao: 'NOVO_AUTO_INFRACAO',
        detalhe: `${num} lavrado. Infrator: ${form.owner}. End.: ${form.addr}. Infrações: ${form.infracoes.length}. Multa: R$ ${totalMulta.toFixed(2)}. Prazo: ${prazoFixo}. Fiscal: ${usuario.name} (Mat. ${matFormatada}).${notificacao?.num ? ` Origem NP: ${notificacao.num}.` : ''}`,
        usuario: usuario.name,
      })
      mostrarToast(`Auto de Infração ${num} lavrado!`, 'sucesso')
      setPagina('registros')
    } catch (err) {
      console.error(err)
      mostrarToast(`Erro: ${err.message || 'tente novamente'}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('registros')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Auto de Infração</h2>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
            {usuario.name} — Mat. {mascaraMatricula(usuario.matricula)}
          </div>
        </div>
      </div>

      {notificacao?.num && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#B45309' }}>
          📋 Baseado na notificação <strong>{notificacao.num}</strong> — Prazo: {prazoFixo}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Secao titulo="Infrator">
          <Campo label="Nome completo *" erro={erros.owner}>
            <input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Nome do infrator" />
          </Campo>
          <Campo label="CPF / CNPJ *" erro={erros.cpf}>
            <MascaraInput tipo="cpfCnpj" value={form.cpf} onChange={v => set('cpf', v)} />
          </Campo>
          <Campo label="Endereço *" erro={erros.addr}>
            <input value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="Rua, número" />
          </Campo>
          <Campo label="Bairro">
            {ehObras && bairros.length > 0 ? (
              <select value={form.bairro} onChange={e => set('bairro', e.target.value)}>
                <option value="">Selecione o bairro</option>
                {(usuario.bairros || []).length > 0 && (
                  <optgroup label="Meus bairros">
                    {bairros.filter(b => (usuario.bairros || []).includes(b.nome)).map(b => (
                      <option key={b.id} value={b.nome}>{b.nome}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Outros bairros">
                  {bairros.filter(b => !(usuario.bairros || []).includes(b.nome)).map(b => (
                    <option key={b.id} value={b.nome}>{b.nome}</option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <input value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
            )}
          </Campo>
        </Secao>

        <Secao titulo="Infrações *">
          {erros.infracoes && <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#B91C1C' }}>{erros.infracoes}</div>}
          {ehObras
            ? <InfracoesObras selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
            : <InfracoesPosturas selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
          }
          {totalMulta > 0 && (
            <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '12px', textAlign: 'center', marginTop: '4px' }}>
              <div style={{ fontSize: '0.78rem', color: '#B91C1C' }}>Multa total</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#B91C1C' }}>
                {ehObras ? `R$ ${totalMulta.toFixed(2).replace('.', ',')}` : `~${totalMulta.toFixed(0)} UFMs`}
              </div>
            </div>
          )}
        </Secao>

        <Secao titulo="Descrição">
          <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva as circunstâncias..." rows={3} style={{ resize: 'vertical' }} />
        </Secao>

        <Secao titulo="Testemunhas">
          <Campo label="Testemunha 1">
            <input value={form.testemunha1} onChange={e => set('testemunha1', e.target.value)} placeholder="Nome da testemunha" />
          </Campo>
          <Campo label="Testemunha 2">
            <input value={form.testemunha2} onChange={e => set('testemunha2', e.target.value)} placeholder="Nome da testemunha" />
          </Campo>
          <Campo label="Obs. de recusa de assinatura">
            <textarea value={form.obs_recusa} onChange={e => set('obs_recusa', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
          </Campo>
        </Secao>

        <Secao titulo="Fotos">
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
          background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '12px',
          padding: '16px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Icon name="alert" size={18} color="#fff" />
          {salvando ? 'Salvando...' : 'Lavrar Auto de Infração'}
        </button>
      </div>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '16px' }}>
      {titulo && <h3 style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</h3>}
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
