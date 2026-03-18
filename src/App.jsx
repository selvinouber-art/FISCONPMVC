import React, { useState, useEffect } from 'react'
import { loadSession, clearSession, startActivityTracking, revalidateSession } from './auth/auth.js'
import Login from './auth/Login.jsx'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Sidebar from './components/Sidebar.jsx'
import Toast from './components/Toast.jsx'
import { GerenciaHeader } from './gerencia/GerenciaUI.jsx'
import {
  podeRegistrarReclamacoes, podeEmitirDocumentos,
  podeCriarUsuarios, podeVerLogs, podeJulgarDefesas,
} from './gerencia/gerencia.js'

import Dashboard from './pages/Dashboard.jsx'
import RegistrosScreen from './pages/registros/RegistrosScreen.jsx'
import PrazosScreen from './pages/registros/PrazosScreen.jsx'
import ReclamacoesScreen from './pages/reclamacoes/ReclamacoesScreen.jsx'
import NovaReclamacao from './pages/reclamacoes/NovaReclamacao.jsx'
import DefesasScreen from './pages/defesas/DefesasScreen.jsx'
import FormNotificacao from './pages/fiscalizacao/FormNotificacao.jsx'
import FormAutoInfracao from './pages/fiscalizacao/FormAutoInfracao.jsx'
import AdminScreen from './pages/admin/AdminScreen.jsx'
import AuditoriaScreen from './pages/admin/AuditoriaScreen.jsx'
import PerfilModal from './pages/perfil/PerfilModal.jsx'
import MaisScreen from './pages/MaisScreen.jsx'

export default function App() {
  const [usuario, setUsuario]           = useState(null)
  const [pagina, setPaginaState]        = useState('dashboard')
  const [paginaParams, setPaginaParams] = useState(null)
  const [toast, setToast]               = useState(null)
  const [carregando, setCarregando]     = useState(true)

  useEffect(() => {
    async function init() {
      const sessao = loadSession()
      if (sessao) {
        // Revalida dados do banco para garantir role/cargo/foto atualizados
        const revalidado = await revalidateSession(sessao)
        setUsuario(revalidado)
      }
      setCarregando(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!usuario) return
    const parar = startActivityTracking()
    return parar
  }, [usuario])

  function mostrarToast(mensagem, tipo = 'sucesso') {
    setToast({ mensagem, tipo })
  }

  function navegar(pag, params = null) {
    // Guard de rotas — bloqueia acesso direto a páginas sem permissão
    if (pag === 'nova-reclamacao' && !podeRegistrarReclamacoes(usuario)) {
      mostrarToast('Acesso restrito a Balcão e Administração', 'erro')
      return
    }
    if ((pag === 'nova-notificacao' || pag === 'novo-auto') && !podeEmitirDocumentos(usuario)) {
      mostrarToast('Acesso restrito a Fiscais', 'erro')
      return
    }
    if (pag === 'admin' && !podeCriarUsuarios(usuario)) {
      mostrarToast('Acesso restrito', 'erro')
      return
    }
    if (pag === 'auditoria' && !podeVerLogs(usuario)) {
      mostrarToast('Acesso restrito', 'erro')
      return
    }
    if (pag === 'defesas' && !podeJulgarDefesas(usuario)) {
      mostrarToast('Acesso restrito', 'erro')
      return
    }
    setPaginaState(pag)
    setPaginaParams(params)
    window.scrollTo(0, 0)
  }

  function handleLogin(user) {
    setUsuario(user)
    navegar('dashboard')
  }

  function handleLogout() {
    clearSession()
    setUsuario(null)
    setPaginaState('dashboard')
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A56DB' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '0.1em' }}>FISCON</div>
          <div style={{ marginTop: '8px', opacity: 0.7 }}>Carregando...</div>
        </div>
      </div>
    )
  }

  if (!usuario) return <Login onLogin={handleLogin} />

  const props = { usuario, mostrarToast, setPagina: navegar }
  const abas  = getAbasNav(usuario)

  function renderPagina() {
    switch (pagina) {
      case 'dashboard':        return <Dashboard {...props} />
      case 'registros':        return <RegistrosScreen {...props} />
      case 'prazos':           return <PrazosScreen {...props} />
      case 'reclamacoes':      return <ReclamacoesScreen {...props} />
      case 'nova-reclamacao':
        // Dupla verificação — guard no nível da rota E no componente
        if (!podeRegistrarReclamacoes(usuario)) return <Dashboard {...props} />
        return <NovaReclamacao {...props} />
      case 'defesas':          return <DefesasScreen {...props} />
      case 'nova-notificacao':
        if (!podeEmitirDocumentos(usuario)) return <Dashboard {...props} />
        return <FormNotificacao {...props} params={paginaParams} />
      case 'novo-auto':
        if (!podeEmitirDocumentos(usuario)) return <Dashboard {...props} />
        return <FormAutoInfracao {...props} notificacao={paginaParams} />
      case 'admin':
        if (!podeCriarUsuarios(usuario)) return <Dashboard {...props} />
        return <AdminScreen {...props} />
      case 'auditoria':
        if (!podeVerLogs(usuario)) return <Dashboard {...props} />
        return <AuditoriaScreen {...props} />
      case 'perfil':           return <PerfilModal {...props} />
      case 'mais':             return <MaisScreen {...props} />
      default:                 return <Dashboard {...props} />
    }
  }

  return (
    <div className="fiscon-layout">
      <div className="fiscon-sidebar">
        <Sidebar usuario={usuario} paginaAtiva={pagina} onNavegar={navegar} onLogout={handleLogout} />
      </div>
      <div className="fiscon-main-area">
        <div className="fiscon-topbar">
          <TopBar usuario={usuario} onPerfil={() => navegar('perfil')} onLogout={handleLogout} />
          <GerenciaHeader gerencia={usuario.gerencia} />
        </div>
        <div className="fiscon-content">
          {renderPagina()}
        </div>
      </div>
      <div className="fiscon-bottom-nav">
        <BottomNav ativo={pagina} onNavegar={navegar} abas={abas} />
      </div>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}

function getAbasNav(u) {
  const role = u?.role
  const base = [{ id: 'dashboard', label: 'Início', icone: 'home' }]

  if (role === 'fiscal') return [
    ...base,
    { id: 'registros',   label: 'Registros',  icone: 'file' },
    { id: 'reclamacoes', label: 'Reclamações', icone: 'phone' },
    { id: 'prazos',      label: 'Prazos',      icone: 'clock' },
    { id: 'mais',        label: 'Mais',        icone: 'settings' },
  ]
  if (role === 'balcao') return [
    ...base,
    { id: 'reclamacoes',     label: 'Reclamações', icone: 'phone' },
    { id: 'nova-reclamacao', label: 'Nova',         icone: 'plus' },
    { id: 'mais',            label: 'Mais',         icone: 'settings' },
  ]
  if (role === 'administracao') return [
    ...base,
    { id: 'registros',       label: 'Registros',  icone: 'file' },
    { id: 'reclamacoes',     label: 'Reclamações', icone: 'phone' },
    { id: 'nova-reclamacao', label: 'Nova Rec.',   icone: 'plus' },
    { id: 'mais',            label: 'Mais',        icone: 'settings' },
  ]
  if (role === 'gerencia') return [
    ...base,
    { id: 'registros',   label: 'Registros',  icone: 'file' },
    { id: 'reclamacoes', label: 'Reclamações', icone: 'phone' },
    { id: 'defesas',     label: 'Defesas',     icone: 'shield' },
    { id: 'mais',        label: 'Mais',        icone: 'settings' },
  ]
  return [
    ...base,
    { id: 'registros',   label: 'Registros',  icone: 'file' },
    { id: 'reclamacoes', label: 'Reclamações', icone: 'phone' },
    { id: 'admin',       label: 'Usuários',   icone: 'users' },
    { id: 'mais',        label: 'Mais',       icone: 'settings' },
  ]
}
