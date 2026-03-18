// Gerenciamento de sessão do FISCON
// Sessão expira após 30 minutos de inatividade

import { query } from '../config/supabase.js'

const SESSAO_KEY = 'fiscon_sessao'
const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

// Salvar sessão no localStorage
export function saveSession(usuario) {
  const sessao = {
    ...usuario,
    ultimaAtividade: Date.now(),
  }
  localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao))
}

// Carregar sessão salva
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSAO_KEY)
    if (!raw) return null
    const sessao = JSON.parse(raw)
    if (checkExpired(sessao)) {
      clearSession()
      return null
    }
    return sessao
  } catch {
    return null
  }
}

// Revalidar sessão contra o banco de dados
// Garante que role, cargo, foto_perfil e ativo estejam atualizados
export async function revalidateSession(sessao) {
  if (!sessao?.matricula) return sessao
  try {
    const resultado = await query('usuarios', q =>
      q.eq('matricula', sessao.matricula).eq('ativo', true).limit(1)
    )
    if (!resultado || resultado.length === 0) {
      // Usuário desativado ou removido — limpa sessão
      clearSession()
      return null
    }
    const db = resultado[0]
    const atualizado = {
      ...sessao,
      role:        db.role,
      gerencia:    db.gerencia,
      cargo:       db.cargo || '',
      foto_perfil: db.foto_perfil || '',
      name:        db.name,
      email:       db.email,
      telefone:    db.telefone,
      bairros:     db.bairros || [],
      ativo:       db.ativo,
      ultimaAtividade: Date.now(),
    }
    // Atualiza localStorage com dados frescos
    localStorage.setItem(SESSAO_KEY, JSON.stringify(atualizado))
    return atualizado
  } catch (err) {
    console.warn('Falha ao revalidar sessão, usando cache local:', err)
    // Se falhar a rede, usa os dados cacheados
    return sessao
  }
}

// Limpar sessão (logout)
export function clearSession() {
  localStorage.removeItem(SESSAO_KEY)
}

// Verificar se a sessão expirou
export function checkExpired(sessao) {
  if (!sessao || !sessao.ultimaAtividade) return true
  return Date.now() - sessao.ultimaAtividade > TIMEOUT_MS
}

// Renovar tempo da sessão (chamado em eventos de atividade)
export function renewSession() {
  try {
    const raw = localStorage.getItem(SESSAO_KEY)
    if (!raw) return
    const sessao = JSON.parse(raw)
    sessao.ultimaAtividade = Date.now()
    localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao))
  } catch {
    // silencioso
  }
}

// Iniciar rastreamento de atividade para renovar sessão automaticamente
export function startActivityTracking() {
  const eventos = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
  const handler = () => renewSession()
  eventos.forEach(ev => window.addEventListener(ev, handler, { passive: true }))
  return () => eventos.forEach(ev => window.removeEventListener(ev, handler))
}
