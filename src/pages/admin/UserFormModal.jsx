import React, { useState, useEffect } from 'react'
import { rpc } from '../../config/supabase.js'
import Modal from '../../components/Modal.jsx'
import MascaraInput, { mascaraMatricula, apenasDigitos } from '../../components/MascaraInput.jsx'
import { isAdminGeral, getPerfisGerencia, GERENCIAS } from '../../gerencia/gerencia.js'

export default function UserFormModal({ aberto, onClose, usuarioEditando, usuarioLogado, onSalvo, mostrarToast }) {
  const [form, setForm] = useState({
    name: '', matricula: '', cpf: '', senha: '', role: '',
    gerencia: '', email: '', telefone: '',
  })
  const [perfis, setPerfis] = useState([])
  const [salvando, setSalvando] = useState(false)

  const gerenciasDisponiveis = isAdminGeral(usuarioLogado)
    ? Object.values(GERENCIAS)
    : [GERENCIAS[usuarioLogado.gerencia]].filter(Boolean)

  useEffect(() => {
    if (!aberto) return
    if (usuarioEditando) {
      setForm({
        ...usuarioEditando,
        matricula: formatarMatricula(usuarioEditando.matricula),
        senha: '',
      })
      setPerfis(getPerfisGerencia(usuarioEditando.gerencia))
    } else {
      const gerenciaInicial = !isAdminGeral(usuarioLogado) ? usuarioLogado.gerencia : ''
      setForm({ name: '', matricula: '', cpf: '', senha: '', role: '', gerencia: gerenciaInicial, email: '', telefone: '' })
      setPerfis(gerenciaInicial ? getPerfisGerencia(gerenciaInicial) : [])
    }
  }, [aberto, usuarioEditando])

  function formatarMatricula(v) {
    if (!v) return ''
    const nums = String(v).replace(/\D/g, '')
    if (nums.length <= 5) return nums
    return `${nums.slice(0, 5)}-${nums.slice(5)}`
  }

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  function handleGerencia(gerencia) {
    set('gerencia', gerencia)
    set('role', '')
    setPerfis(getPerfisGerencia(gerencia))
  }

  async function salvar() {
    if (!form.name || !form.matricula || !form.gerencia || !form.role) {
      mostrarToast('Preencha nome, matrícula, gerência e perfil', 'erro')
      return
    }
    if (!usuarioEditando && !form.senha) {
      mostrarToast('Informe a senha inicial', 'erro')
      return
    }
    const matriculaSoDigitos = apenasDigitos(form.matricula)
    setSalvando(true)
    try {
      const resultado = await rpc('criar_usuario_seguro', {
        p_id: usuarioEditando?.id || `user-${Date.now()}`,
        p_name: form.name.trim(),
        p_matricula: matriculaSoDigitos,
        p_senha: form.senha || '__manter__',
        p_role: form.role,
        p_email: form.email || '',
        p_telefone: form.telefone || '',
        p_endereco: form.cpf || '',   // reutilizando campo endereco para CPF
        p_bairros: [],
        p_ativo: true,
        p_gerencia: form.gerencia,
      })
      if (!resultado?.success) throw new Error('Falha')
      mostrarToast(usuarioEditando ? 'Usuário atualizado!' : 'Usuário criado!', 'sucesso')
      onSalvo()
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao salvar. Verifique se a matrícula já existe.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <Campo label="Nome completo *">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do servidor" />
        </Campo>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Campo label="Matrícula *" style={{ flex: 1 }}>
            <MascaraInput tipo="matricula" value={form.matricula} onChange={v => set('matricula', v)} />
          </Campo>
          <Campo label="CPF" style={{ flex: 1 }}>
            <MascaraInput tipo="cpf" value={form.cpf} onChange={v => set('cpf', v)} />
          </Campo>
        </div>

        {/* Passo 1: Gerência */}
        <Campo label="Módulo / Gerência *">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gerenciasDisponiveis.map(g => (
              <button key={g.id} type="button" onClick={() => handleGerencia(g.id)} style={{
                background: form.gerencia === g.id ? g.fundo : '#fff',
                border: `2px solid ${form.gerencia === g.id ? g.cor : '#E2E8F0'}`,
                borderRadius: '10px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left',
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

        {/* Passo 2: Perfil */}
        {form.gerencia && perfis.length > 0 && (
          <Campo label="Perfil de acesso *">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {perfis.map(p => (
                <button key={p.codigo} type="button" onClick={() => set('role', p.codigo)} style={{
                  background: form.role === p.codigo ? p.fundo : '#fff',
                  border: `2px solid ${form.role === p.codigo ? p.cor : '#E2E8F0'}`,
                  borderRadius: '10px', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left',
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

        <Campo label={usuarioEditando ? 'Nova senha (em branco = manter)' : 'Senha inicial *'}>
          <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••••" />
        </Campo>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Campo label="E-mail" style={{ flex: 1 }}>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="servidor@pmvc.ba.gov.br" />
          </Campo>
          <Campo label="Telefone" style={{ flex: 1 }}>
            <MascaraInput tipo="telefone" value={form.telefone} onChange={v => set('telefone', v)} />
          </Campo>
        </div>

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

function Campo({ label, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
