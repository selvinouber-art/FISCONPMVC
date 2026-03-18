import React, { useRef, useEffect, useState } from 'react'
import { INFO_MODULO } from '../../gerencia/GerenciaUI.jsx'
import { getGerencia, nomePerfil } from '../../gerencia/gerencia.js'
import { mascaraMatricula } from '../../components/MascaraInput.jsx'
import { getOne } from '../../config/supabase.js'

// Dimensões cartão padrão: 85.6mm × 54mm
// Em px a 96dpi: ~324px × 204px
// Usamos 2x para qualidade: 648 × 408

export default function Credencial({ usuario: usuarioInicial, onFechar }) {
  const cardRef = useRef()
  const [usuario, setUsuario] = useState(usuarioInicial)

  // Recarrega do banco para pegar foto atualizada
  useEffect(() => {
    async function recarregar() {
      try {
        const dados = await getOne('usuarios', usuarioInicial.id)
        if (dados) setUsuario(dados)
      } catch { /* usa o que tem */ }
    }
    recarregar()
  }, [usuarioInicial.id])

  const g    = getGerencia(usuario.gerencia)
  const info = INFO_MODULO[usuario.gerencia] || INFO_MODULO.obras
  const mat  = mascaraMatricula(usuario.matricula || '')

  function imprimir() {
    const html = cardRef.current.outerHTML
    const win  = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head><title>Crachá — ${usuario.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap" rel="stylesheet"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Barlow', sans-serif; }
        @media print {
          body { background: #fff; }
          @page { size: 85.6mm 54mm; margin: 0; }
        }
      </style></head><body>${html}</body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Card — proporção 85.6mm × 54mm = 1.585:1 */}
      <div ref={cardRef} style={{
        width: '324px',
        height: '204px',
        background: `linear-gradient(145deg, ${g.cor} 0%, ${g.cor}DD 60%, #0F2A6B 100%)`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Barlow', sans-serif",
      }}>
        {/* Faixa decorativa superior */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.4)' }} />

        {/* Corpo principal */}
        <div style={{ flex: 1, display: 'flex', padding: '10px 12px', gap: '10px' }}>
          {/* Coluna esquerda: brasão + foto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '64px', flexShrink: 0 }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
              alt="Brasão"
              style={{ width: '28px', height: '28px' }}
            />
            {/* Foto */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.7)',
              overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {usuario.foto_perfil
                ? <img src={usuario.foto_perfil} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.4rem' }}>👤</span>
              }
            </div>
          </div>

          {/* Coluna direita: textos */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.2 }}>
              Prefeitura Municipal de Vitória da Conquista
            </div>
            <div style={{ fontSize: '0.6rem', color: '#fff', fontWeight: '700', lineHeight: 1.2 }}>
              {info.secretaria}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, marginBottom: '4px' }}>
              {info.gerencia}
            </div>

            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.95rem', fontWeight: '700',
              color: '#fff', lineHeight: 1.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {usuario.name?.toUpperCase()}
            </div>

            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
              {usuario.cargo || nomePerfil(usuario)}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matrícula</div>
            <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '700', letterSpacing: '0.08em' }}>{mat}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perfil</div>
            <div style={{ fontSize: '0.62rem', color: '#fff', fontWeight: '600' }}>{nomePerfil(usuario)}</div>
          </div>
        </div>

        {/* Barra cor inferior */}
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.25)' }} />
      </div>

      {/* Aviso foto */}
      {!usuario.foto_perfil && (
        <div style={{ fontSize: '0.75rem', color: '#B45309', background: '#FEF3C7', borderRadius: '8px', padding: '8px 14px', textAlign: 'center', maxWidth: '324px' }}>
          ⚠️ Nenhuma foto cadastrada. Edite o usuário para adicionar.
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', width: '324px' }}>
        <button onClick={imprimir} style={{
          flex: 1, background: '#1A56DB', color: '#fff', border: 'none',
          borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
        }}>
          🖨️ Imprimir Crachá
        </button>
        <button onClick={onFechar} style={{
          flex: 1, background: '#F1F5F9', color: '#475569', border: 'none',
          borderRadius: '10px', padding: '12px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer',
        }}>
          Fechar
        </button>
      </div>
    </div>
  )
}
