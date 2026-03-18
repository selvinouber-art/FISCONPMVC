import React, { useState, useEffect } from 'react'
import { loadSession, clearSession, startActivityTracking } from './auth/auth.js'
import Login from './auth/Login.jsx'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Toast from './components/Toast.jsx'
import { GerenciaHeader } from './gerencia/GerenciaUI.jsx'
import { podeEmitirDocumentos, podeRegistrarReclamacoes } from './gerencia/gerencia.js'

// Páginas
import Dashboard from './pages/Dashboard.jsx'
import RegistrosScreen from './pages/registros/RegistrosScreen.jsx'
import PrazosScreen from './pages/registros/PrazosScreen.jsx'
import ReclamacoesScreen from './pages/reclamacoes/ReclamacoesScreen.jsx'
import NovaReclamacao from './pages/reclamacoes/NovaReclamacao.jsx'
import DefesasScreen from './pages/defesas/DefesasScreen.jsx'
import FormNotificacao from './pages/fiscalizacao/FormNotificacao.jsx'
import FormAutoInfracao from './pages/fiscalizacao/FormAutoInfracao.jsx'
import AdminScreen from './pages/admin/AdminScreen.jsx'
import PerfilModal from './pages/perfil/PerfilModal.jsx'
import MaisScreen from './pages/MaisScreen.jsx'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [pagina, setPagina] = useState('dashboard')
  const [paginaParams, setPaginaParams] = useState(null)
  const [toast, setToast] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const sessao = loadSession()
    if (sessao) setUsuario(sessao)
    setCarregando(false)
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
    setPagina(pag)
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
    navegar('dashboard')
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

  function renderPagina() {
    switch (pagina) {
      case 'dashboard':        return <Dashboard {...props} />
      case 'registros':        return <RegistrosScreen {...props} />
      case 'prazos':           return <PrazosScreen {...props} />
      case 'reclamacoes':      return <ReclamacoesScreen {...props} />
      case 'nova-reclamacao':  return <NovaReclamacao {...props} />
      case 'defesas':          return <DefesasScreen {...props} />
      case 'nova-notificacao': return <FormNotificacao {...props} />
      case 'novo-auto':        return <FormAutoInfracao {...props} notificacao={paginaParams} />
      case 'admin':            return <AdminScreen {...props} />
      case 'perfil':           return <PerfilModal {...props} />
      case 'mais':             return <MaisScreen {...props} />
      default:                 return <Dashboard {...props} />
    }
  }

  // Abas do BottomNav variam conforme o perfil
  const abasPorPerfil = getAbasNav(usuario)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F1F5F9' }}>
      <TopBar usuario={usuario} onPerfil={() => navegar('perfil')} onLogout={handleLogout} />
      <GerenciaHeader gerencia={usuario.gerencia} />
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {renderPagina()}
      </main>
      <BottomNav ativo={pagina} onNavegar={navegar} abas={abasPorPerfil} />
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}

function getAbasNav(usuario) {
  const role = usuario?.role
  const base = [{ id: 'dashboard', label: 'Início', icone: 'home' }]

  if (role === 'fiscal') {
    return [
      ...base,
      { id: 'registros',   label: 'Registros',   icone: 'file' },
      { id: 'reclamacoes', label: 'Reclamações',  icone: 'phone' },
      { id: 'prazos',      label: 'Prazos',       icone: 'clock' },
      { id: 'mais',        label: 'Mais',         icone: 'settings' },
    ]
  }

  if (role === 'balcao') {
    return [
      ...base,
      { id: 'reclamacoes',     label: 'Reclamações', icone: 'phone' },
      { id: 'nova-reclamacao', label: 'Nova',        icone: 'plus' },
      { id: 'mais',            label: 'Mais',        icone: 'settings' },
    ]
  }

  if (role === 'administracao') {
    return [
      ...base,
      { id: 'registros',   label: 'Registros',   icone: 'file' },
      { id: 'reclamacoes', label: 'Reclamações',  icone: 'phone' },
      { id: 'mais',        label: 'Mais',         icone: 'settings' },
    ]
  }

  if (role === 'gerencia') {
    return [
      ...base,
      { id: 'registros',   label: 'Registros',  icone: 'file' },
      { id: 'reclamacoes', label: 'Reclamações', icone: 'phone' },
      { id: 'defesas',     label: 'Defesas',     icone: 'shield' },
      { id: 'mais',        label: 'Mais',        icone: 'settings' },
    ]
  }

  // Admin geral
  return [
    ...base,
    { id: 'registros',   label: 'Registros',  icone: 'file' },
    { id: 'reclamacoes', label: 'Reclamações', icone: 'phone' },
    { id: 'admin',       label: 'Usuários',   icone: 'users' },
    { id: 'mais',        label: 'Mais',       icone: 'settings' },
  ]
}
