import React from 'react'
import Icon from '../components/Icon.jsx'
import { isAdminGeral, isGerencia, isAdministracao, isFiscal, podeVerLogs, podeVerRelatorios, podeCriarUsuarios, podeJulgarDefesas } from '../gerencia/gerencia.js'

export default function MaisScreen({ usuario, setPagina }) {
  const itens = [
    {
      label: 'Defesas Recebidas',
      icone: 'shield',
      pagina: 'defesas',
      visivel: podeJulgarDefesas(usuario),
      desc: 'Analisar e julgar defesas dos contribuintes',
    },
    {
      label: 'Relatórios',
      icone: 'chart',
      pagina: 'relatorios',
      visivel: podeVerRelatorios(usuario),
      desc: 'Relatórios por período, fiscal, infração',
    },
    {
      label: 'Auditoria / Log',
      icone: 'eye',
      pagina: 'auditoria',
      visivel: podeVerLogs(usuario),
      desc: 'Histórico de ações do sistema',
    },
    {
      label: 'Usuários',
      icone: 'users',
      pagina: 'admin',
      visivel: podeCriarUsuarios(usuario),
      desc: 'Criar e gerenciar usuários',
    },
    {
      label: 'Configurações',
      icone: 'settings',
      pagina: 'config',
      visivel: isAdminGeral(usuario),
      desc: 'Configurações gerais do sistema',
    },
    {
      label: 'Prazos',
      icone: 'clock',
      pagina: 'prazos',
      visivel: isFiscal(usuario) || isGerencia(usuario) || isAdministracao(usuario) || isAdminGeral(usuario),
      desc: 'Controle de vencimentos',
    },
    {
      label: 'Meu Perfil',
      icone: 'user',
      pagina: 'perfil',
      visivel: true,
      desc: 'Alterar senha e dados pessoais',
    },
  ].filter(i => i.visivel)

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#1E293B', marginBottom: '20px' }}>Mais opções</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {itens.map(item => (
          <button key={item.pagina} onClick={() => setPagina(item.pagina)} style={{
            background: '#fff', border: '2px solid #E2E8F0', borderRadius: '14px',
            padding: '16px', display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ background: '#F1F5F9', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={item.icone} size={20} color="#475569" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1E293B' }}>{item.label}</div>
              {item.desc && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{item.desc}</div>}
            </div>
            <Icon name="chevronRight" size={18} color="#CBD5E0" />
          </button>
        ))}
      </div>
      <div style={{ marginTop: '32px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>FISCON v1.0 — 2026</div>
        <div style={{ fontSize: '0.7rem', color: '#CBD5E0', marginTop: '4px' }}>Prefeitura Municipal de Vitória da Conquista</div>
      </div>
    </div>
  )
}
