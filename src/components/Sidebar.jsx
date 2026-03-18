import React from 'react'
import Icon from './Icon.jsx'
import { GerenciaBadge } from '../gerencia/GerenciaUI.jsx'
import {
  nomePerfil, getGerencia,
  isAdminGeral, isFiscal, isBalcao,
  podeJulgarDefesas, podeCriarUsuarios, podeVerRelatorios, podeVerLogs,
  podeEmitirDocumentos, podeRegistrarReclamacoes,
} from '../gerencia/gerencia.js'

export default function Sidebar({ usuario, paginaAtiva, onNavegar, onLogout }) {
  const g = getGerencia(usuario.gerencia)
  const itens = buildItens(usuario)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg" alt="Brasão" style={{ width: '36px', height: '36px' }} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: '700', fontSize: '1.4rem', color: '#1A56DB', lineHeight: 1 }}>FISCON</div>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', lineHeight: 1 }}>PMVC</div>
          </div>
        </div>
        <div onClick={() => onNavegar('perfil')} style={{ background: g.fundo, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' }}>
          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1E293B' }}>{usuario.name}</div>
          {usuario.cargo && <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1px' }}>{usuario.cargo}</div>}
          <div style={{ fontSize: '0.72rem', color: g.cor, marginTop: '2px', fontWeight: '600' }}>{nomePerfil(usuario)}</div>
          <div style={{ marginTop: '6px' }}><GerenciaBadge gerencia={usuario.gerencia} /></div>
        </div>
      </div>

      <div style={{ background: g.fundo, padding: '7px 16px', borderBottom: `2px solid ${g.cor}22`, fontSize: '0.72rem', color: g.cor, fontWeight: '600' }}>
        {g.emoji} {g.nome}
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {itens.map((item, i) => {
          if (item.divisor) return <div key={i} style={{ height: '1px', background: '#F1F5F9', margin: '8px' }} />
          const ativo = paginaAtiva === item.id
          return (
            <button key={item.id} onClick={() => onNavegar(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', border: 'none',
              background: ativo ? '#EBF5FF' : 'transparent',
              color: ativo ? '#1A56DB' : '#475569',
              fontWeight: ativo ? '700' : '500',
              fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left',
              marginBottom: '2px',
            }}>
              <Icon name={item.icone} size={18} color={ativo ? '#1A56DB' : '#94A3B8'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid #F1F5F9' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', border: 'none',
          background: 'transparent', color: '#94A3B8', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
        }}>
          <Icon name="logout" size={18} color="#94A3B8" />
          Sair
        </button>
        <div style={{ fontSize: '0.65rem', color: '#CBD5E0', textAlign: 'center', marginTop: '8px' }}>FISCON v1.0 — 2026</div>
      </div>
    </div>
  )
}

function buildItens(u) {
  const itens = [{ id: 'dashboard', label: 'Início', icone: 'home' }]

  if (!isBalcao(u)) itens.push({ id: 'registros', label: 'Registros', icone: 'file' })
  if (isFiscal(u))  itens.push({ id: 'prazos', label: 'Prazos', icone: 'clock' })

  itens.push({ id: 'reclamacoes', label: 'Reclamações', icone: 'phone' })

  // Nova Reclamação: NUNCA aparece para fiscal
  if (podeRegistrarReclamacoes(u)) {
    itens.push({ id: 'nova-reclamacao', label: 'Nova Reclamação', icone: 'plus' })
  }

  if (podeEmitirDocumentos(u)) {
    itens.push({ id: 'nova-notificacao', label: 'Nova Notificação', icone: 'file' })
    itens.push({ id: 'novo-auto', label: 'Novo Auto de Infração', icone: 'alert' })
  }

  itens.push({ divisor: true })

  if (podeJulgarDefesas(u))  itens.push({ id: 'defesas',    label: 'Defesas',        icone: 'shield' })
  if (podeVerRelatorios(u))  itens.push({ id: 'relatorios', label: 'Relatórios',      icone: 'chart' })
  if (podeVerLogs(u))        itens.push({ id: 'auditoria',  label: 'Auditoria / Log', icone: 'eye' })
  if (podeCriarUsuarios(u))  itens.push({ id: 'admin',      label: 'Usuários',        icone: 'users' })
  if (isAdminGeral(u))       itens.push({ id: 'config',     label: 'Configurações',   icone: 'settings' })

  // Pedidos de cancelamento — fiscal, administração e gerência veem
  itens.push({ id: 'cancelamentos', label: 'Cancelamentos', icone: 'x' })

  itens.push({ divisor: true })
  itens.push({ id: 'perfil', label: 'Meu Perfil', icone: 'user' })

  return itens
}
