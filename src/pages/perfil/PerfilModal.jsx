import React, { useState } from 'react'
import { rpc } from '../../config/supabase.js'
import Icon from '../../components/Icon.jsx'
import Modal from '../../components/Modal.jsx'
import { getGerencia, nomePerfil } from '../../gerencia/gerencia.js'
import { mascaraMatricula } from '../../components/MascaraInput.jsx'
import Credencial from './Credencial.jsx'

export default function PerfilModal({ usuario, mostrarToast, setPagina }) {
  const [senhaAtual, setSenhaAtual]     = useState('')
  const [novaSenha, setNovaSenha]       = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [salvando, setSalvando]         = useState(false)
  const [verCredencial, setVerCredencial] = useState(false)

  const g = getGerencia(usuario.gerencia)

  async function alterarSenha() {
    if (!senhaAtual || !novaSenha) { mostrarToast('Preencha todos os campos', 'erro'); return }
    if (novaSenha !== confirmaSenha) { mostrarToast('As senhas não conferem', 'erro'); return }
    if (novaSenha.length < 6) { mostrarToast('Mínimo 6 caracteres', 'erro'); return }
    setSalvando(true)
    try {
      const res = await rpc('alterar_senha', {
        p_user_id: usuario.id,
        p_senha_atual: senhaAtual,
        p_nova_senha: novaSenha,
      })
      if (!res?.success) { mostrarToast('Senha atual incorreta', 'erro'); return }
      mostrarToast('Senha alterada com sucesso!', 'sucesso')
      setSenhaAtual(''); setNovaSenha(''); setConfirmaSenha('')
    } catch { mostrarToast('Erro ao alterar senha', 'erro') }
    finally { setSalvando(false) }
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPagina('mais')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="chevronRight" size={20} color="#64748B" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>Meu Perfil</h2>
      </div>

      {/* Card do usuário */}
      <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          {/* Foto */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: g.fundo, border: `3px solid ${g.cor}44`,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {usuario.foto_perfil
              ? <img src={usuario.foto_perfil} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.8rem' }}>👤</span>
            }
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B' }}>{usuario.name}</div>
            {usuario.cargo && <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>{usuario.cargo}</div>}
            <div style={{ fontSize: '0.75rem', color: g.cor, fontWeight: '600', marginTop: '2px' }}>{nomePerfil(usuario)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <InfoRow icone="user"  label="Matrícula" valor={mascaraMatricula(usuario.matricula || '')} />
          {usuario.email    && <InfoRow icone="eye"   label="E-mail"    valor={usuario.email} />}
          {usuario.telefone && <InfoRow icone="phone" label="Telefone"  valor={usuario.telefone} />}
        </div>

        {/* Botão crachá */}
        <button onClick={() => setVerCredencial(true)} style={{
          width: '100%', background: g.fundo, color: g.cor,
          border: `2px solid ${g.cor}44`, borderRadius: '10px',
          padding: '12px', fontWeight: '700', fontSize: '0.9rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px',
        }}>
          🪪 Visualizar Crachá / Credencial
        </button>
      </div>

      {/* Alterar senha */}
      <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#1E293B', margin: '0 0 16px' }}>Alterar senha</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Campo label="Senha atual">
            <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" />
          </Campo>
          <Campo label="Nova senha">
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Campo>
          <Campo label="Confirmar nova senha">
            <input type="password" value={confirmaSenha} onChange={e => setConfirmaSenha(e.target.value)} placeholder="Repita a nova senha" />
          </Campo>
          <button onClick={alterarSenha} disabled={salvando} style={{
            background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '10px',
            padding: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '4px',
          }}>
            {salvando ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>

      {/* Modal do crachá */}
      <Modal aberto={verCredencial} onClose={() => setVerCredencial(false)} titulo="Credencial / Crachá">
        <Credencial usuario={usuario} onFechar={() => setVerCredencial(false)} />
      </Modal>
    </div>
  )
}

function InfoRow({ icone, label, valor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
      <Icon name={icone} size={16} color="#94A3B8" />
      <span style={{ color: '#94A3B8', minWidth: '70px' }}>{label}</span>
      <span style={{ color: '#374151', fontWeight: '600' }}>{valor}</span>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
