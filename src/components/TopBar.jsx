import React from 'react'
import { GerenciaBadge } from '../gerencia/GerenciaUI.jsx'
import { nomePerfil } from '../gerencia/gerencia.js'
import Icon from './Icon.jsx'

export default function TopBar({ usuario, onPerfil, onLogout }) {
  return (
    <div style={estilos.bar}>
      {/* Esquerda: brasão + título */}
      <div style={estilos.esquerda}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
          alt="Brasão"
          style={estilos.brasao}
        />
        <div>
          <span style={estilos.titulo}>FISCON</span>
          <span style={estilos.subtitulo}>PMVC — Vitória da Conquista</span>
        </div>
      </div>

      {/* Direita: usuário */}
      {usuario && (
        <div style={estilos.direita}>
          <div style={estilos.usuarioInfo} onClick={onPerfil}>
            <span style={estilos.nomeUsuario}>{usuario.name?.split(' ')[0]}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{nomePerfil(usuario)}</span>
              <GerenciaBadge gerencia={usuario.gerencia} />
            </div>
          </div>
          {/* Botão logout visível só no mobile */}
          <button
            onClick={onLogout}
            className="topbar-logout-btn"
            title="Sair"
            style={estilos.botaoLogout}
          >
            <Icon name="logout" size={18} color="#64748B" />
          </button>
        </div>
      )}
    </div>
  )
}

const estilos = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: '#fff',
    borderBottom: '2px solid #E2E8F0',
  },
  esquerda: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brasao: {
    width: '32px',
    height: '32px',
  },
  titulo: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: '700',
    fontSize: '1.3rem',
    color: '#1A56DB',
    display: 'block',
    lineHeight: 1,
  },
  subtitulo: {
    fontSize: '0.62rem',
    color: '#94A3B8',
    display: 'block',
    lineHeight: 1.2,
  },
  direita: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  usuarioInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
    cursor: 'pointer',
  },
  nomeUsuario: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1E293B',
  },
  botaoLogout: {
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
