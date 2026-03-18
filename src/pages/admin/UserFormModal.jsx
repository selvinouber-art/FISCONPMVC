import React, { useState, useEffect, useRef } from 'react'
import { rpc, query, upload, update } from '../../config/supabase.js'
import Modal from '../../components/Modal.jsx'
import MascaraInput, { apenasDigitos } from '../../components/MascaraInput.jsx'
import { isAdminGeral, getPerfisGerencia, GERENCIAS } from '../../gerencia/gerencia.js'
import { BAIRROS_VDC } from '../../config/constants.js'

export default function UserFormModal({ aberto, onClose, usuarioEditando, usuarioLogado, onSalvo, mostrarToast }) {
  const [form, setForm] = useState({
    name: '', matricula: '', cpf: '', cargo: '', senha: '',
    role: '', gerencia: '', email: '', telefone: '', bairros: [],
  })
  const [perfis, setPerfis]         = useState([])
  const [salvando, setSalvando]     = useState(false)
  const [erros, setErros]           = useState({})
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoArquivo, setFotoArquivo] = useState(null)
  const inputFotoRef = useRef()

  const gerenciasDisponiveis = isAdminGeral(usuarioLogado)
    ? Object.values(GERENCIAS)
    : [GERENCIAS[usuarioLogado.gerencia]].filter(Boolean)

  useEffect(() => {
    if (!aberto) return
    if (usuarioEditando) {
      setForm({
        name:      usuarioEditando.name      || '',
        matricula: fmtMatricula(usuarioEditando.matricula || ''),
        cpf:       fmtCpf(usuarioEditando.endereco || ''),
        cargo:     usuarioEditando.cargo     || '',
        senha:     '',
        role:      usuarioEditando.role      || '',
        gerencia:  usuarioEditando.gerencia  || '',
        email:     usuarioEditando.email     || '',
        telefone:  usuarioEditando.telefone  || '',
        bairros:   usuarioEditando.bairros   || [],
      })
      setFotoPreview(usuarioEditando.foto_perfil || null)
      setFotoArquivo(null)
      setPerfis(getPerfisGerencia(usuarioEditando.gerencia || ''))
    } else {
      const gerenciaInicial = !isAdminGeral(usuarioLogado) ? usuarioLogado.gerencia : ''
      setForm({ name:'', matricula:'', cpf:'', cargo:'', senha:'', role:'', gerencia: gerenciaInicial, email:'', telefone:'', bairros:[] })
      setFotoPreview(null)
      setFotoArquivo(null)
      setPerfis(gerenciaInicial ? getPerfisGerencia(gerenciaInicial) : [])
    }
    setErros({})
  }, [aberto, usuarioEditando?.id])

  function fmtMatricula(v) {
    const n = String(v).replace(/\D/g, '')
    return n.length <= 5 ? n : `${n.slice(0, 5)}-${n.slice(5)}`
  }

  function fmtCpf(v) {
    const n = String(v).replace(/\D/g, '').slice(0, 11)
    if (n.length <= 3) return n
    if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`
    if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`
    return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`
  }

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErros(e => ({ ...e, [campo]: '' }))
  }

  function handleGerencia(gerencia) {
    setForm(f => ({ ...f, gerencia, role: '', bairros: [] }))
    setPerfis(getPerfisGerencia(gerencia))
    setErros(e => ({ ...e, gerencia: '', role: '' }))
  }

  function toggleBairro(b) {
    setForm(f => ({
      ...f,
      bairros: f.bairros.includes(b) ? f.bairros.filter(x => x !== b) : [...f.bairros, b],
    }))
    setErros(e => ({ ...e, bairros: '' }))
  }

  function handleFotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoArquivo(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function validar() {
    const e = {}
    if (!form.name.trim())      e.name      = 'Nome obrigatório'
    if (!form.matricula.trim()) e.matricula  = 'Matrícula obrigatória'
    if (!form.cpf.trim())       e.cpf        = 'CPF obrigatório'
    if (!form.cargo.trim())     e.cargo      = 'Cargo obrigatório'
    if (!form.email.trim())     e.email      = 'E-mail obrigatório'
    if (!form.telefone.trim())  e.telefone   = 'Telefone obrigatório'
    if (!form.gerencia)         e.gerencia   = 'Selecione o módulo'
    if (!form.role)             e.role       = 'Selecione o perfil'
    if (!usuarioEditando && !form.senha) e.senha = 'Senha obrigatória'
    if (form.role === 'fiscal' && form.gerencia === 'obras' && form.bairros.length === 0) {
      e.bairros = 'Atribua ao menos 1 bairro'
    }
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function salvar() {
    if (!validar()) { mostrarToast('Preencha todos os campos obrigatórios', 'erro'); return }

    const matriculaSoDigitos = apenasDigitos(form.matricula)

    // Verifica matrícula duplicada
    try {
      const existentes = await query('usuarios', q => q.eq('matricula', matriculaSoDigitos))
      const duplicada = existentes.filter(u => u.id !== (usuarioEditando?.id || ''))
      if (duplicada.length > 0) {
        setErros(e => ({ ...e, matricula: 'Matrícula já cadastrada para outro usuário' }))
        mostrarToast('Matrícula já em uso', 'erro')
        return
      }
    } catch { /* segue */ }

    setSalvando(true)
    try {
      // Define o ID do usuário
      const userId = usuarioEditando?.id || `user-${Date.now()}`

      // Faz upload da foto ANTES de salvar o usuário
      let fotoUrl = usuarioEditando?.foto_perfil || null
      if (fotoArquivo) {
        try {
          const caminho = `perfis/${matriculaSoDigitos}_${Date.now()}.jpg`
          fotoUrl = await upload('fiscon-fotos', caminho, fotoArquivo)
        } catch (uploadErr) {
          console.warn('Erro no upload da foto:', uploadErr)
          // Continua sem a foto
        }
      }

      // Cria/atualiza o usuário via RPC
      const resultado = await rpc('criar_usuario_seguro', {
        p_id:        userId,
        p_name:      form.name.trim(),
        p_matricula: matriculaSoDigitos,
        p_senha:     form.senha || '__manter__',
        p_role:      form.role,
        p_email:     form.email.trim(),
        p_telefone:  form.telefone,
        p_endereco:  apenasDigitos(form.cpf),
        p_bairros:   form.bairros,
        p_ativo:     true,
        p_gerencia:  form.gerencia,
      })
      if (!resultado?.success) throw new Error('Falha ao salvar usuário')

      // Atualiza cargo e foto diretamente na tabela
      await update('usuarios', userId, {
        cargo:       form.cargo.trim(),
        foto_perfil: fotoUrl,
      })

      mostrarToast(usuarioEditando ? 'Usuário atualizado!' : 'Usuário criado!', 'sucesso')
      onSalvo()
    } catch (err) {
      console.error('Erro ao salvar usuário:', err)
      mostrarToast('Erro ao salvar. Tente novamente.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const ehFiscalObras = form.role === 'fiscal' && form.gerencia === 'obras'

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Foto de perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => inputFotoRef.current?.click()}
            style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: fotoPreview ? 'transparent' : '#F1F5F9',
              border: `3px dashed ${fotoPreview ? '#1A56DB' : '#CBD5E0'}`,
              overflow: 'hidden', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {fotoPreview
              ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem' }}>📷</div>
                  <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginTop: '2px' }}>Clique para adicionar</div>
                </div>
            }
          </div>
          {fotoPreview && (
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              style={{ background: 'none', border: 'none', color: '#1A56DB', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Trocar foto
            </button>
          )}
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            style={{ display: 'none' }}
          />
        </div>

        <Campo label="Nome completo *" erro={erros.name}>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do servidor" />
        </Campo>

        <Campo label="Cargo *" erro={erros.cargo}>
          <input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Fiscal de Obras, Agente Administrativo..." />
        </Campo>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Campo label="Matrícula *" erro={erros.matricula} style={{ flex: 1 }}>
            <MascaraInput tipo="matricula" value={form.matricula} onChange={v => set('matricula', v)} />
          </Campo>
          <Campo label="CPF *" erro={erros.cpf} style={{ flex: 1 }}>
            <MascaraInput tipo="cpf" value={form.cpf} onChange={v => set('cpf', v)} />
          </Campo>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Campo label="E-mail *" erro={erros.email} style={{ flex: 1 }}>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="servidor@pmvc.ba.gov.br" />
          </Campo>
          <Campo label="Telefone *" erro={erros.telefone} style={{ flex: 1 }}>
            <MascaraInput tipo="telefone" value={form.telefone} onChange={v => set('telefone', v)} />
          </Campo>
        </div>

        {/* Módulo */}
        <Campo label="Módulo *" erro={erros.gerencia}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gerenciasDisponiveis.map(g => (
              <button key={g.id} type="button" onClick={() => handleGerencia(g.id)} style={{
                background: form.gerencia === g.id ? g.fundo : '#fff',
                border: `2px solid ${form.gerencia === g.id ? g.cor : '#E2E8F0'}`,
                borderRadius: '10px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: '1.2rem' }}>{g.emoji}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.88rem', color: form.gerencia === g.id ? g.cor : '#374151' }}>{g.nome}</div>
                  {g.lei && <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{g.lei}</div>}
                </div>
              </button>
            ))}
          </div>
        </Campo>

        {/* Perfil */}
        {form.gerencia && perfis.length > 0 && (
          <Campo label="Perfil de acesso *" erro={erros.role}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {perfis.map(p => (
                <button key={p.codigo} type="button" onClick={() => set('role', p.codigo)} style={{
                  background: form.role === p.codigo ? p.fundo : '#fff',
                  border: `2px solid ${form.role === p.codigo ? p.cor : '#E2E8F0'}`,
                  borderRadius: '10px', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.cor, flexShrink: 0 }} />
                  <span style={{ fontWeight: '600', fontSize: '0.88rem', color: form.role === p.codigo ? p.cor : '#374151' }}>
                    {p.nome}
                  </span>
                </button>
              ))}
            </div>
          </Campo>
        )}

        {/* Bairros — fiscal de obras */}
        {ehFiscalObras && (
          <Campo label="Bairros sob responsabilidade *" erro={erros.bairros}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '6px' }}>
              Selecione ao menos 1 bairro. Reclamações desses bairros serão atribuídas automaticamente.
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '8px' }}>
              {BAIRROS_VDC.map(b => (
                <button key={b} type="button" onClick={() => toggleBairro(b)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '7px 8px', borderRadius: '8px', border: 'none',
                  background: form.bairros.includes(b) ? '#EBF5FF' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${form.bairros.includes(b) ? '#1A56DB' : '#CBD5E0'}`,
                    background: form.bairros.includes(b) ? '#1A56DB' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {form.bairros.includes(b) && <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700', lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    color: form.bairros.includes(b) ? '#1A56DB' : '#374151',
                    fontWeight: form.bairros.includes(b) ? '600' : '400',
                  }}>
                    {b}
                  </span>
                </button>
              ))}
            </div>
            {form.bairros.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '4px' }}>
                ✅ {form.bairros.length} bairro{form.bairros.length > 1 ? 's' : ''} selecionado{form.bairros.length > 1 ? 's' : ''}
              </div>
            )}
          </Campo>
        )}

        <Campo label={usuarioEditando ? 'Nova senha (em branco = manter)' : 'Senha inicial *'} erro={erros.senha}>
          <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="Mínimo 6 caracteres" />
        </Campo>

        <button onClick={salvar} disabled={salvando} style={{
          background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '10px',
          padding: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', marginTop: '4px',
        }}>
          {salvando ? 'Salvando...' : (usuarioEditando ? 'Atualizar Usuário' : 'Criar Usuário')}
        </button>
      </div>
    </Modal>
  )
}

function Campo({ label, children, erro, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', ...style }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
      {erro && <span style={{ fontSize: '0.72rem', color: '#B91C1C' }}>{erro}</span>}
    </div>
  )
}
