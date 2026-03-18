import React from 'react'
import Icon from './Icon.jsx'

export default function BottomNav({ ativo, onNavegar, abas = [], badgeReclamacoes = 0 }) {
  if (!abas.length) return null

  return (
    <nav style={estilos.nav}>
      {abas.map(item => {
        const estaAtivo = ativo === item.id
        const temBadge = item.id === 'reclamacoes' && badgeReclamacoes > 0
        return (
          <button
            key={item.id}
            onClick={() => onNavegar(item.id)}
            style={{ ...estilos.botao, ...(estaAtivo ? estilos.botaoAtivo : {}) }}
          >
            <div style={{ position: 'relative' }}>
              <Icon name={item.icone} size={22} color={estaAtivo ? '#1A56DB' : '#94A3B8'} />
              {temBadge && (
                <span style={estilos.badge}>
                  {badgeReclamacoes > 9 ? '9+' : badgeReclamacoes}
                </span>
              )}
            </div>
            <span style={{ ...estilos.label, color: estaAtivo ? '#1A56DB' : '#94A3B8' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const estilos = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '500px',
    background: '#fff',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 12px',
    zIndex: 100,
  },
  botao: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: '10px',
    flex: 1,
  },
  botaoAtivo: { background: '#EBF5FF' },
  label: { fontSize: '0.65rem', fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-6px',
    background: '#B91C1C',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: '700',
    borderRadius: '999px',
    minWidth: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
}
