import React, { useState, useEffect } from 'react'
import { insert, rpc, get, upload } from '../../config/supabase.js'
import { gerarCodigoAcesso, gerarNumDocumento } from '../../gerencia/gerencia.js'
import PhotoSlot from '../../components/PhotoSlot.jsx'
import SigCanvas from '../../components/SigCanvas.jsx'
import MascaraInput, { mascaraMatricula, apenasDigitos } from '../../components/MascaraInput.jsx'
import InfracoesObras from './InfracoesObras.jsx'
import InfracoesPosturas from './InfracoesPosturas.jsx'
import Icon from '../../components/Icon.jsx'

export default function FormNotificacao({ usuario, mostrarToast, setPagina, params }) {
  // Pré-preenche se vier de uma reclamação
  const fromRec = params?.fromReclamacao

  const [form, setForm] = useState({
    owner: fromRec?.reclamado || '',
    cpf: '',
    addr: fromRec?.endereco || '',
    bairro: fromRec?.bairro || '',
    loteamento: '',
    descricao: fromRec?.descricao || '',
    prazo: '',
    infracoes: [],
  })
  const [bairros, setBairros] = useState([])
  const [fotos, setFotos] = useState([null, null, null, null])
  const [assinatura, setAssinatura] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usuario.gerencia === 'obras') {
      get('bairros', { ativo: true }).then(setBairros).catch(() => setBairros([]))
    }
  }, [])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleFoto(index, arquivo) {
    try {
      const caminho = `fotos/${Date.now()}_${index}.jpg`
      const url = await upload('fiscon-fotos', caminho, arquivo)
      const novas = [...fotos]
      novas[index] = url
      setFotos(novas)
    } catch {
      mostrarToast('Erro ao enviar foto', 'erro')
    }
  }

  async function salvar() {
    if (!form.owner || !form.addr || form.infracoes.length === 0) {
      mostrarToast('Preencha proprietário, endereço e ao menos uma infração', 'erro')
      return
    }
    setSalvando(true)
    try {
      const seq = await rpc('proximo_sequencial', { p_gerencia: usuario.gerencia, p_tipo: 'notif' })
      const num = gerarNumDocumento('notif', usuario.gerencia, seq || 1)
      const codigo_acesso = gerarCodigoAcesso()
      const id = `notif-${Date.now()}`
      const matriculaFormatada = mascaraMatricula(usuario.matricula)

      await insert('records', {
        id, num, type: 'notif',
        gerencia: usuario.gerencia,
        owner: form.owner,
        cpf: apenasDigitos(form.cpf),   // salva só dígitos
        addr: form.addr,
        bairro: form.bairro,
        loteamento: form.loteamento,
        descricao: form.descricao,
        prazo: form.prazo,
        infracoes: form.infracoes,
        fiscal: usuario.name,
        matricula: usuario.matricula,   // dígitos puros
        status: 'Pendente',
        codigo_acesso,
        foto_urls: fotos.filter(Boolean),
        date: new Date().toLocaleDateString('pt-BR'),
        notif_rec_id: fromRec?.id || null,
      })

      await insert('logs', {
        gerencia: usuario.gerencia,
        acao: 'NOVA_NOTIFICACAO',
        detalhe: `Notificação ${num} criada pelo fiscal ${usuario.name} (Mat. ${matriculaFormatada})`,
        usuario: usuario.name,
      })

      mostrarToast(`Notificação ${num} criada!`, 'sucesso')
      setPagina('registros')
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao salvar notificação', 'erro')
    } finally {
      setSalvando(false)
    }
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
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            Fiscal: {usuario.name} — Mat. {mascaraMatricula(usuario.matricula)}
          </div>
        </div>
      </div>

      {fromRec && (
        <div style={{ background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#1A56DB' }}>
          📋 Pré-preenchido a partir da reclamação <strong>{fromRec.protocolo}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Proprietário */}
        <Secao titulo="Proprietário / Infrator">
          <Campo label="Nome completo *">
            <input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Nome do proprietário" />
          </Campo>
          <Campo label="CPF / CNPJ">
            <MascaraInput tipo="cpfCnpj" value={form.cpf} onChange={v => set('cpf', v)} />
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '3px' }}>
              Detecta CPF ou CNPJ automaticamente
            </span>
          </Campo>
        </Secao>

        {/* Endereço */}
        <Secao titulo="Endereço">
          <Campo label="Endereço completo *">
            <input value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="Rua, número" />
          </Campo>
          <Campo label="Bairro">
            {ehObras && bairros.length > 0 ? (
              <select value={form.bairro} onChange={e => set('bairro', e.target.value)}>
                <option value="">Selecione o bairro</option>
                {bairros.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
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

        {/* Infrações */}
        <Secao titulo="Infrações *">
          {ehObras
            ? <InfracoesObras selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
            : <InfracoesPosturas selecionadas={form.infracoes} onChange={v => set('infracoes', v)} />
          }
        </Secao>

        {/* Detalhes */}
        <Secao titulo="Detalhes">
          <Campo label="Descrição da irregularidade">
            <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Descreva a irregularidade encontrada..." rows={3} style={{ resize: 'vertical' }} />
          </Campo>
          <Campo label="Prazo para regularização">
            <MascaraInput tipo="data" value={form.prazo} onChange={v => set('prazo', v)} />
          </Campo>
        </Secao>

        {/* Fotos */}
        <Secao titulo="Fotos (até 4)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {fotos.map((url, i) => (
              <PhotoSlot key={i} url={url} label={`Foto ${i + 1}`}
                onUpload={(arquivo) => handleFoto(i, arquivo)}
                onRemove={() => { const n = [...fotos]; n[i] = null; setFotos(n) }}
              />
            ))}
          </div>
        </Secao>

        {/* Assinatura */}
        <Secao titulo="Assinatura do Notificado">
          <SigCanvas onChange={setAssinatura} />
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

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
