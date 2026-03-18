import React, { useRef } from 'react'
import { INFO_MODULO } from '../../gerencia/GerenciaUI.jsx'
import { getGerencia, nomePerfil } from '../../gerencia/gerencia.js'
import { mascaraMatricula } from '../../components/MascaraInput.jsx'

export default function Credencial({ usuario, onFechar }) {
  const g = getGerencia(usuario.gerencia)
  const info = INFO_MODULO[usuario.gerencia] || INFO_MODULO.obras
  const cardRef = useRef()

  function imprimir() {
    const conteudo = cardRef.current.innerHTML
    const janela = window.open('', '_blank')
    janela.document.write(`
      <html><head><title>Credencial — ${usuario.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap" rel="stylesheet"/>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #E8EDF5; font-family: 'Barlow', sans-serif; }
        @media print { body { background: white; } }
      </style>
      </head><body>${conteudo}</body></html>
    `)
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close() }, 400)
  }

  const matriculaFormatada = mascaraMatricula(usuario.matricula || '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

      {/* Card da credencial */}
      <div ref={cardRef}>
        <div style={{
          width: '320px',
          background: `linear-gradient(160deg, ${g.cor} 0%, ${g.cor}CC 100%)`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          fontFamily: "'Barlow', sans-serif",
        }}>
          {/* Cabeçalho */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
              alt="Brasão"
              style={{ width: '36px', height: '36px', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                Prefeitura Municipal de Vitória da Conquista
              </div>
              <div style={{ fontSize: '0.68rem', color: '#fff', fontWeight: '700', lineHeight: 1.3 }}>
                {info.secretaria}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>
                {info.gerencia}
              </div>
            </div>
          </div>

          {/* Foto + dados */}
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            {/* Foto */}
            <div style={{
              width: '96px', height: '96px',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.8)',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {usuario.foto_perfil ? (
                <img src={usuario.foto_perfil} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem' }}>👤</span>
              )}
            </div>

            {/* Nome */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.2rem', fontWeight: '700',
                color: '#fff', letterSpacing: '0.02em', lineHeight: 1.2,
              }}>
                {usuario.name?.toUpperCase()}
              </div>
              <div style={{
                fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)',
                fontWeight: '600', marginTop: '4px',
              }}>
                {usuario.cargo || nomePerfil(usuario)}
              </div>
            </div>
          </div>

          {/* Rodapé com matrícula */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Matrícula</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700', letterSpacing: '0.1em' }}>
                {matriculaFormatada}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Perfil</div>
              <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '600' }}>
                {nomePerfil(usuario)}
              </div>
            </div>
          </div>

          {/* Barra colorida inferior */}
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: '10px', width: '320px' }}>
        <button onClick={imprimir} style={{
          flex: 1, background: '#1A56DB', color: '#fff', border: 'none',
          borderRadius: '10px', padding: '12px', fontWeight: '700',
          fontSize: '0.88rem', cursor: 'pointer',
        }}>
          🖨️ Imprimir Crachá
        </button>
        <button onClick={onFechar} style={{
          flex: 1, background: '#F1F5F9', color: '#475569', border: 'none',
          borderRadius: '10px', padding: '12px', fontWeight: '600',
          fontSize: '0.88rem', cursor: 'pointer',
        }}>
          Fechar
        </button>
      </div>
    </div>
  )
}
