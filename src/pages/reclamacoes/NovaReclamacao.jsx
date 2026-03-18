import React, { useState, useEffect } from 'react'
import { insert, upload, query } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import MascaraInput from '../../components/MascaraInput.jsx'
import { ORIGENS_RECLAMACAO, PRIORIDADES } from '../../config/constants.js'
import { podeRegistrarReclamacoes } from '../../gerencia/gerencia.js'

export default function NovaReclamacao({ usuario, mostrarToast, setPagina }) {
  // Bloqueia acesso se não tiver permissão — redireciona para lista
  if (!podeRegistrarReclamacoes(usuario)) {
    // useEffect não funciona antes do return, então mostramos tela breve e redirecionamos
    setTimeout(() => {
      mostrarToast('Apenas Balcão e Administração podem registrar reclamações', 'erro')
      setPagina('reclamacoes')
    }, 0)
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚫</div>
        <h3 style={{ color: '#B91C1C', marginBottom: '8px' }}>Acesso não permitido</h3>
        <p style={{ color: '#64748B', fontSize: '0.88rem' }}>
          Apenas os perfis <strong>Balcão</strong> e <strong>Administração</strong> podem registrar reclamações.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '8px' }}>Redirecionando...</p>
      </div>
    )
  }

  const [form, setForm] = useState({
    reclamante: '', telefone: '', email: '',
    reclamado: '', cpf_cnpj: '',
    endereco: '', numero: '', bairro: '', cep: '',
    descricao: '', prioridade: 'normal', origem: 'presencial',
    fiscal: '', fiscal_matricula: '',
  })
  const [bairros, setBairros]   = useState([])
  const [fiscais, setFiscais]   = useState([])
  const [foto, setFoto]         = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [fiscalSugerido, setFiscalSugerido] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const [bs, fs] = await Promise.all([
          query('bairros', q => q.eq('ativo', true).order('nome')),
          query('usuarios', q => q.eq('gerencia', usuario.gerencia).eq('role', 'fiscal').eq('ativo', true).order('name')),
        ])
        setBairros(bs)
        setFiscais(fs)
      } catch { /* silencioso */ }
    }
    init()
  }, [])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleBairroChange(bairro) {
    set('bairro', bairro)
    if (!bairro) { setFiscalSugerido(null); return }
    try {
      const resultado = await query('usuarios', q =>
        q.eq('gerencia', usuario.gerencia).eq('role', 'fiscal').eq('ativo', true)
         .contains('bairros', [bairro]).limit(1)
      )
      if (resultado?.length > 0) {
        const f = resultado[0]
        setFiscalSugerido(f)
        set('fiscal', f.name)
        set('fiscal_matricula', f.matricula)
      } else {
        setFiscalSugerido(null)
        set('fiscal', '')
        set('fiscal_matricula', '')
      }
    } catch { setFiscalSugerido(null) }
  }

  function handleFiscalManual(matricula) {
    const f = fiscais.find(f => f.matricula === matricula)
    if (f) { set('fiscal', f.name); set('fiscal_matricula', f.matricula) }
    else { set('fiscal', ''); set('fiscal_matricula', '') }
  }

  async function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await upload('fiscon-fotos', `reclamacoes/${Date.now()}.jpg`, file)
      setFoto(url)
    } catch { mostrarToast('Erro ao enviar foto', 'erro') }
  }

  async function salvar() {
    if (!form.descricao || !form.endereco) {
      mostrarToast('Preencha endereço e descrição', 'erro')
      return
    }
    setSalvando(true)
    try {
      const protocolo = `RC-${Date.now().toString(36).toUpperCase().slice(-8)}`
      await insert('reclamacoes', {
        id: `rec-${Date.now()}`,
        gerencia: usuario.gerencia,
        protocolo,
        origem: form.origem,
        reclamante: form.reclamante,
        telefone: form.telefone,
        email: form.email,
        reclamado: form.reclamado,
        cpf_cnpj: form.cpf_cnpj,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        cep: form.cep,
        descricao: form.descricao,
        prioridade: form.prioridade,
        fiscal: form.fiscal,
        fiscal_matricula: form.fiscal_matricula,
        status: form.fiscal ? 'em_atendimento' : 'nova',
        foto_url: foto,
        criado_por: usuario.name,
        criado_por_matricula: usuario.matricula,
      })
      await insert('logs', {
        gerencia: usuario.gerencia,
        acao: 'NOVA_RECLAMACAO',
        detalhe: `Reclamação ${protocolo} registrada por ${usuario.name}. Reclamado: ${form.reclamado || 'não informado'}. Endereço: ${form.endereco}${form.bairro ? `, ${form.bairro}` : ''}.${form.fiscal ? ` Atribuída para: ${form.fiscal}.` : ''}`,
        usuario: usuario.name,
      })
      mostrarToast(`Reclamação ${protocolo} registrada!`, 'sucesso')
      setPagina('reclamacoes')
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao salvar reclamação', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('reclamacoes')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Nova Reclamação</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Secao titulo="Origem e Prioridade">
          <div style={{ display: 'flex', gap: '10px' }}>
            <Campo label="Origem" style={{ flex: 1 }}>
              <select value={form.origem} onChange={e => set('origem', e.target.value)}>
                {ORIGENS_RECLAMACAO.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Campo>
            <Campo label="Prioridade" style={{ flex: 1 }}>
              <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Campo>
          </div>
        </Secao>

        <Secao titulo="Reclamante (opcional / pode ser anônimo)">
          <Campo label="Nome">
            <input value={form.reclamante} onChange={e => set('reclamante', e.target.value)} placeholder="Nome ou 'Anônimo'" />
          </Campo>
          <Campo label="Telefone">
            <MascaraInput tipo="telefone" value={form.telefone} onChange={v => set('telefone', v)} />
          </Campo>
        </Secao>

        <Secao titulo="Local / Reclamado">
          <Campo label="Nome / Estabelecimento / Proprietário">
            <input value={form.reclamado} onChange={e => set('reclamado', e.target.value)} placeholder="Quem está sendo reclamado" />
          </Campo>
          <Campo label="Endereço *">
            <input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número" />
          </Campo>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Campo label="Número" style={{ flex: 1 }}>
              <input value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="Nº" />
            </Campo>
            <Campo label="Bairro" style={{ flex: 2 }}>
              {bairros.length > 0 ? (
                <select value={form.bairro} onChange={e => handleBairroChange(e.target.value)}>
                  <option value="">Selecione o bairro</option>
                  {bairros.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                </select>
              ) : (
                <input value={form.bairro} onChange={e => handleBairroChange(e.target.value)} placeholder="Bairro" />
              )}
            </Campo>
          </div>
        </Secao>

        <Secao titulo="Descrição *">
          <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={4}
            placeholder="Descreva o problema: obra irregular, material na calçada, terreno com mato..." style={{ resize: 'vertical' }} />
        </Secao>

        <Secao titulo="Atribuir Fiscal">
          {fiscalSugerido && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px', marginBottom: '4px', fontSize: '0.82rem', color: '#166534' }}>
              ✅ Fiscal sugerido pelo bairro: <strong>{fiscalSugerido.name}</strong>
            </div>
          )}
          <select value={form.fiscal_matricula} onChange={e => handleFiscalManual(e.target.value)}>
            <option value="">Sem fiscal (atribuir depois)</option>
            {fiscais.map(f => <option key={f.matricula} value={f.matricula}>{f.name}</option>)}
          </select>
        </Secao>

        <Secao titulo="Foto (opcional)">
          {foto ? (
            <div style={{ position: 'relative' }}>
              <img src={foto} style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover' }} alt="foto" />
              <button onClick={() => setFoto(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(185,28,28,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <Icon name="x" size={14} color="#fff" />
              </button>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px', border: '2px dashed #CBD5E0', borderRadius: '10px', cursor: 'pointer', color: '#94A3B8', fontSize: '0.82rem' }}>
              <Icon name="camera" size={24} color="#94A3B8" />
              Adicionar foto
              <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
            </label>
          )}
        </Secao>

        <button onClick={salvar} disabled={salvando} style={{
          background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '12px',
          padding: '16px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
        }}>
          {salvando ? 'Salvando...' : 'Registrar Reclamação'}
        </button>
      </div>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '16px' }}>
      <h3 style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Campo({ label, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
