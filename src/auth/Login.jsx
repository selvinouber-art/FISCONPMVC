import React, { useState } from 'react'
import { rpc } from '../config/supabase.js'
import { saveSession } from './auth.js'
import MascaraInput, { mascaraMatricula, apenasDigitos } from '../components/MascaraInput.jsx'

export default function Login({ onLogin }) {
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    const mat = apenasDigitos(matricula)
    if (!mat || !senha) {
      setErro('Preencha matrícula e senha.')
      return
    }
    setCarregando(true)
    try {
      const resultado = await rpc('autenticar_usuario', {
        p_matricula: mat,
        p_senha: senha,
      })
      if (!resultado || !resultado.success) {
        setErro('Matrícula ou senha incorretos.')
        return
      }
      saveSession(resultado)
      onLogin(resultado)
    } catch (err) {
      setErro('Erro ao conectar. Verifique sua conexão.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-fundo">
      <div className="login-card">
        {/* Brasão */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
            alt="Brasão PMVC"
            style={{ width: '72px', height: '72px', marginBottom: '12px' }}
          />
          <h1 style={{ fontSize: '2.4rem', color: '#1A56DB', letterSpacing: '0.1em', margin: 0 }}>
            FISCON
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0 2px' }}>
            Fiscalização de Obras e Posturas
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>
            Prefeitura Municipal de Vitória da Conquista — BA
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={estilos.label}>Matrícula</label>
            <MascaraInput
              tipo="matricula"
              value={matricula}
              onChange={setMatricula}
              autoComplete="username"
            />
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Formato: 00000-0</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={estilos.label}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div style={{ color: '#B91C1C', fontSize: '0.85rem', background: '#FEE2E2', padding: '10px 14px', borderRadius: '8px' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              background: '#1A56DB', color: '#fff', padding: '14px',
              fontSize: '1rem', fontWeight: '700', borderRadius: '10px',
              border: 'none', cursor: 'pointer', marginTop: '4px',
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.7rem', color: '#CBD5E0' }}>
          FISCON v1.0 — 2026
        </p>
      </div>
    </div>
  )
}

const estilos = {
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
}
