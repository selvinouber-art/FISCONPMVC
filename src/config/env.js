// Variáveis de ambiente — lidas do Vite (Vercel) em produção
// NUNCA coloque senhas aqui. Configure tudo nas variáveis de ambiente do Vercel.
export function getEnv() {
  const SUPABASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof window !== 'undefined' && window.SUPABASE_URL) ||
    ''

  const SUPABASE_ANON_KEY =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ||
    ''

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas.')
  }

  return { SUPABASE_URL, SUPABASE_ANON_KEY }
}
