import React from 'react'
import { getGerencia, GERENCIAS } from './gerencia.js'

// Informações institucionais por módulo
export const INFO_MODULO = {
  obras: {
    secretaria: 'Secretaria Municipal de Infraestrutura Urbana',
    gerencia: 'Gerência de Fiscalização',
  },
  posturas: {
    secretaria: 'Secretaria de Serviços Públicos',
    gerencia: 'Gerência de Posturas',
  },
  admin_geral: {
    secretaria: 'Prefeitura Municipal de Vitória da Conquista',
    gerencia: 'Administração Geral',
  },
}

// Barra colorida com nome da secretaria e gerência
export function GerenciaHeader({ gerencia }) {
  const g = getGerencia(gerencia)
  const info = INFO_MODULO[gerencia] || INFO_MODULO.obras
  return (
    <div style={{
      background: g.fundo,
      borderBottom: `2px solid ${g.cor}22`,
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '1rem' }}>{g.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: g.cor, fontWeight: '700', lineHeight: 1.2 }}>
          {info.secretaria}
        </div>
        <div style={{ fontSize: '0.65rem', color: `${g.cor}99`, lineHeight: 1.2 }}>
          {info.gerencia}
        </div>
      </div>
      <span style={{ fontSize: '0.65rem', color: `${g.cor}66`, whiteSpace: 'nowrap' }}>
        {g.lei}
      </span>
    </div>
  )
}

// Badge com sigla
export function GerenciaBadge({ gerencia, style = {} }) {
  const g = getGerencia(gerencia)
  return (
    <span style={{
      background: g.fundo,
      color: g.cor,
      border: `1px solid ${g.cor}44`,
      borderRadius: '999px',
      padding: '2px 10px',
      fontSize: '0.68rem',
      fontWeight: '700',
      letterSpacing: '0.04em',
      ...style,
    }}>
      {g.sigla}
    </span>
  )
}

// Seletor de gerência
export function GerenciaSelector({ value, onChange, label = 'Gerência' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione a gerência</option>
        {Object.values(GERENCIAS).map(g => (
          <option key={g.id} value={g.id}>{g.emoji} {g.nome}</option>
        ))}
      </select>
    </div>
  )
}

// Filtro de gerência para admin geral
export function GerenciaFilter({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ minWidth: '160px' }}>
      <option value="">Todas as gerências</option>
      {Object.values(GERENCIAS).filter(g => g.id !== 'admin_geral').map(g => (
        <option key={g.id} value={g.id}>{g.emoji} {g.sigla}</option>
      ))}
    </select>
  )
}

// Seletor de função
export function FuncaoSelector({ value, onChange, funcoes = [], label = 'Função' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={funcoes.length === 0}>
        <option value="">Selecione a função</option>
        {funcoes.map(f => (
          <option key={f.id} value={f.codigo}>{f.nome}</option>
        ))}
      </select>
      {funcoes.length === 0 && (
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Selecione a gerência primeiro</span>
      )}
    </div>
  )
}
