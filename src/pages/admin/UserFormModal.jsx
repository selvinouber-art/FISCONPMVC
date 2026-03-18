import React, { useState, useEffect } from 'react'
import { rpc, query } from '../../config/supabase.js'
import Modal from '../../components/Modal.jsx'
import MascaraInput, { apenasDigitos } from '../../components/MascaraInput.jsx'
import { isAdminGeral, getPerfisGerencia, GERENCIAS } from '../../gerencia/gerencia.js'
import { BAIRROS_VDC } from '../../config/constants.js'

export default function UserFormModal({ aberto, onClose, usuarioEditando, usuarioLogado, onSalvo, mostrarToast }) {
  const [form, setForm] = useState({
    name: '', matricula: '', cpf: '', senha: '',
    role: '', gerencia: '', email: '', telefone: '',
    bairros: [],
  })
  const [perfis, setPerfis] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})

  const gerenciasDisponiveis = isAdminGeral(usuarioLogado)
    ? Object.values(GERENCIAS)
    : [GERENCIAS[usuarioLogado.gerencia]].filter(Boolean)

  useEffect(() => {
    if (!aberto) return
    if (usuarioEditando) {
      // Preenche TODOS os campos do usuário existente
      setForm({
        name:      usuarioEditando.name      || '',
        matricula: formatarMatricula(usuarioEditando.matricula || ''),
        cpf:       formatarCpf(usuarioEditando.endereco || ''), // cpf salvo em endereco
        senha:     '',
        role:      usuarioEditando.role      || '',
        gerencia:  usuarioEditando.gerencia  || '',
        email:     usuarioEditando.email     || '',
        telefone:  usuarioEditando.telefone  || '',
        bairros:   usuarioEditando.bairros   || [],
      })
      setPerfis(getPerfisGerencia(usuarioEditando.gerencia || ''))
    } else {
      const gerenciaInicial = !isAdminGeral(usuarioLogado) ? usuarioLogado.gerencia : ''
      setForm({
        name: '', matricula: '', cpf: '', senha: '',
        role: '', gerencia: gerenciaInicial,
        email: '', telefone: '', bairros: [],
      })
      setPerfis(gerenciaInicial ? getPerfisGerencia(gerenciaInicial) : [])
    }
    setErros({})
  }, [aberto, usuarioEditando?.id])

  function formatarMatricula(v) {
    const nums = String(v).replace(/\D/g, '')
    if (nums.length <= 5) return nums
    return `${nums.slice(0, 5)}-${nums.slice(5)}`
  }

  function formatarCpf(v) {
    const nums = String(v).replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
    return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
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

  function toggleBairro(bairro) {
    setForm(f => {
      const jatem = f.bairros.includes(bairro)
      return { ...f, bairros: jatem ? f.bairros.filter(b => b !== bairro) : [...f.bairros, bairro] }
    })
    setErros(e => ({ ...e, bairros: '' }))
  }

  function validar() {
    const e = {}
    if (!form.name.trim())     e.name = 'Nome obrigatório'
    if (!form.matricula.trim()) e.matricula = 'Matrícula obrigatória'
    if (!form.cpf.trim())      e.cpf = 'CPF obrigatório'
    if (!form.email.trim())    e.email = 'E-mail obrigatório'
    if (!form.telefone.trim()) e.telefone = 'Telefone obrigatório'
    if (!form.gerencia)        e.gerencia = 'Selecione o módulo'
    if (!form.role)            e.role = 'Selecione o perfil'
    if (!usuarioEditando && !form.senha) e.senha = 'Senha obrigatória'
    if (form.role === 'fiscal' && form.gerencia === 'obras' && form.bairros.length === 0) {
      e.bairros = 'Atribua ao menos 1 bairro para o fiscal'
    }
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function salvar() {
    if (!validar()) {
      mostrarToast('Preencha todos os campos obrigatórios', 'erro')
      return
    }
    const matriculaSoDigitos = apenasDigitos(form.matricula)

    // Verifica matrícula duplicada
    try {
      const existentes = await query('usuarios', q =>
        q.eq('matricula', matriculaSoDigitos)
      )
      const duplicada = existentes.filter(u => u.id !== (usuarioEditando?.id || ''))
      if (duplicada.length > 0) {
        setErros(e => ({ ...e, matricula: 'Esta matrícula já está em uso' }))
        mostrarToast('Matrícula já cadastrada para outro usuário', 'erro')
        return
      }
    } catch { /* segue */ }

    setSalvando(true)
    try {
      const resultado = await rpc('criar_usuario_seguro', {
        p_id:       usuarioEditando?.id || `user-${Date.now()}`,
        p_name:     form.name.trim(),
        p_matricula: matriculaSoDigitos,
        p_senha:    form.senha || '__manter__',
        p_role:     form.role,
        p_email:    form.email.trim(),
        p_telefone: form.telefone,
        p_endereco: apenasDigitos(form.cpf), // CPF salvo no campo endereco
        p_bairros:  form.bairros,
        p_ativo:    true,
        p_gerencia: form.gerencia,
      })
      if (!resultado?.success) throw new Error('Falha ao salvar')
      mostrarToast(usuarioEditando ? 'Usuário atualizado!' : 'Usuário criado!', 'sucesso')
      onSalvo()
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao salvar. Tente novamente.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const ehFiscalObras = form.role === 'fiscal' && form.gerencia === 'obras'

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <Campo label="Nome completo *" erro={erros.name}>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do servidor" />
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
                  <div style={{ fontWeight: '600', fontSize: '0.88rem', color: form.gerencia === g.id ? g.cor : '#374151' }}>
                    {g.nome}
                  </div>
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

        {/* Bairros — só para fiscal de obras */}
        {ehFiscalObras && (
          <Campo label="Bairros sob responsabilidade *" erro={erros.bairros}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px' }}>
              Selecione ao menos 1 bairro. As reclamações desses bairros serão atribuídas automaticamente a este fiscal.
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '8px' }}>
              {BAIRROS_VDC.map(b => (
                <button key={b} type="button" onClick={() => toggleBairro(b)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '6px 8px', borderRadius: '8px',
                  border: 'none', background: form.bairros.includes(b) ? '#EBF5FF' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${form.bairros.includes(b) ? '#1A56DB' : '#CBD5E0'}`,
                    background: form.bairros.includes(b) ? '#1A56DB' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {form.bairros.includes(b) && <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: form.bairros.includes(b) ? '#1A56DB' : '#374151', fontWeight: form.bairros.includes(b) ? '600' : '400' }}>
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

        <Campo label={usuarioEditando ? 'Nova senha (em branco = manter atual)' : 'Senha inicial *'} erro={erros.senha}>
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
