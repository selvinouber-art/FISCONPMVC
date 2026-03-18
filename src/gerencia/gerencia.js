export const GERENCIAS = {
  obras: {
    id: 'obras',
    nome: 'Gerência de Fiscalização de Obras',
    sigla: 'OB',
    lei: 'Lei nº 1.481/2007',
    emoji: '🏗️',
    cor: '#1A56DB',
    fundo: '#EBF5FF',
    prefixoNotif: 'NP-OB',
    prefixoAuto: 'AI-OB',
  },
  posturas: {
    id: 'posturas',
    nome: 'Gerência de Fiscalização de Posturas',
    sigla: 'PO',
    lei: 'Lei nº 695/1993',
    emoji: '🏪',
    cor: '#166534',
    fundo: '#F0FDF4',
    prefixoNotif: 'NP-PO',
    prefixoAuto: 'AI-PO',
  },
  admin_geral: {
    id: 'admin_geral',
    nome: 'Administração Geral',
    sigla: 'GERAL',
    lei: '',
    emoji: '🏛️',
    cor: '#B45309',
    fundo: '#FEF3C7',
    prefixoNotif: 'NP-GR',
    prefixoAuto: 'AI-GR',
  },
}

export const PERFIS_POR_GERENCIA = {
  obras: [
    { codigo: 'gerencia',      nome: 'Gerência',      cor: '#7E22CE', fundo: '#FDF4FF', ordem: 1 },
    { codigo: 'fiscal',        nome: 'Fiscal',        cor: '#1A56DB', fundo: '#EBF5FF', ordem: 2 },
    { codigo: 'balcao',        nome: 'Balcão',        cor: '#166534', fundo: '#F0FDF4', ordem: 3 },
    { codigo: 'administracao', nome: 'Administração', cor: '#B45309', fundo: '#FEF3C7', ordem: 4 },
  ],
  posturas: [
    { codigo: 'gerencia',      nome: 'Gerência',      cor: '#7E22CE', fundo: '#FDF4FF', ordem: 1 },
    { codigo: 'fiscal',        nome: 'Fiscal',        cor: '#166534', fundo: '#F0FDF4', ordem: 2 },
    { codigo: 'balcao',        nome: 'Balcão',        cor: '#0891B2', fundo: '#ECFEFF', ordem: 3 },
    { codigo: 'administracao', nome: 'Administração', cor: '#B45309', fundo: '#FEF3C7', ordem: 4 },
  ],
  admin_geral: [
    { codigo: 'admin', nome: 'Administrador Geral', cor: '#B45309', fundo: '#FEF3C7', ordem: 1 },
  ],
}

export function getPerfisGerencia(gerencia) {
  return PERFIS_POR_GERENCIA[gerencia] || []
}

export function getGerencia(id) {
  return GERENCIAS[id] || GERENCIAS['obras']
}

export function gerarNumDocumento(tipo, gerencia, sequencial) {
  const config = getGerencia(gerencia)
  const prefixo = tipo === 'auto' ? config.prefixoAuto : config.prefixoNotif
  const ano = new Date().getFullYear()
  const num = String(sequencial).padStart(4, '0')
  return `${prefixo}-${num}/${ano}`
}

export function gerarCodigoAcesso() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let codigo = ''
  for (let i = 0; i < 8; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)]
  }
  return codigo
}

export function filtrarPorGerencia(registros, gerencia) {
  if (gerencia === 'admin_geral') return registros
  return registros.filter(r => r.gerencia === gerencia)
}

// ============================================================
// PERMISSÕES
// ============================================================

export const isAdminGeral    = u => u?.gerencia === 'admin_geral'
export const isGerencia      = u => u?.role === 'gerencia' || isAdminGeral(u)
export const isFiscal        = u => u?.role === 'fiscal'
export const isBalcao        = u => u?.role === 'balcao'
export const isAdministracao = u => u?.role === 'administracao'

export const podeCriarUsuarios        = u => isAdminGeral(u) || u?.role === 'gerencia'
export const podeEmitirDocumentos     = u => isFiscal(u) || isAdminGeral(u)

// APENAS Balcão e Administração podem criar reclamações
// NÃO inclui: fiscal, gerência, admin_geral (admin)
export const podeRegistrarReclamacoes = u => {
  const role = u?.role
  return role === 'balcao' || role === 'administracao'
}

export const podeAtribuirReclamacoes  = u => isBalcao(u) || isAdministracao(u) || isGerencia(u) || isAdminGeral(u)
export const podeVerLogs              = u => isGerencia(u) || isAdminGeral(u)
export const podeVerRelatorios        = u => isGerencia(u) || isAdministracao(u) || isAdminGeral(u)
export const podeJulgarDefesas        = u => isGerencia(u) || isAdminGeral(u)
export const podeAlterarStatus        = u => isAdministracao(u) || isGerencia(u) || isAdminGeral(u)

export function nomePerfil(u) {
  const mapa = {
    fiscal: 'Fiscal',
    balcao: 'Balcão',
    administracao: 'Administração',
    gerencia: 'Gerência',
    admin: 'Admin Geral',
  }
  return mapa[u?.role] || u?.role || ''
}
