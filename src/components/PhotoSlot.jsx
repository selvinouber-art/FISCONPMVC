import React, { useRef } from 'react'
import Icon from './Icon.jsx'

export default function PhotoSlot({ url, onUpload, onRemove, label = 'Foto', disabled = false }) {
  const inputRef = useRef()

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const carimbada = await adicionarCarimbo(file)
    onUpload(carimbada, file.name)
    e.target.value = ''
  }

  async function adicionarCarimbo(file) {
    return new Promise((resolve) => {
      const img = new Image()
      const objUrl = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        // Marca d'água central
        ctx.save()
        ctx.globalAlpha = 0.1
        ctx.font = `bold ${img.width * 0.07}px sans-serif`
        ctx.fillStyle = '#1A56DB'
        ctx.translate(img.width / 2, img.height / 2)
        ctx.rotate(-30 * Math.PI / 180)
        ctx.textAlign = 'center'
        ctx.fillText('FISCALIZAÇÃO', 0, 0)
        ctx.restore()

        // Faixa inferior
        const fh = img.height * 0.11
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(0, img.height - fh, img.width, fh)
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${fh * 0.36}px sans-serif`
        ctx.textAlign = 'left'
        ctx.fillText(`FISCALIZAÇÃO PMVC  •  ${new Date().toLocaleString('pt-BR')}`, img.width * 0.015, img.height - fh * 0.28)

        canvas.toBlob(blob => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          URL.revokeObjectURL(objUrl)
        }, 'image/jpeg', 0.92)
      }
      img.src = objUrl
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>{label}</label>

      {/* Container quadrado */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {url ? (
            <>
              <img
                src={url}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '2px solid #CBD5E0', display: 'block' }}
              />
              {!disabled && (
                <button
                  onClick={onRemove}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(185,28,28,0.9)', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  <Icon name="x" size={14} color="#fff" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              style={{
                width: '100%', height: '100%',
                border: '2px dashed #CBD5E0', borderRadius: '10px',
                background: '#F8FAFC', cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '6px', color: '#94A3B8', fontSize: '0.72rem',
              }}
            >
              <Icon name="camera" size={22} color="#CBD5E0" />
              Adicionar
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
