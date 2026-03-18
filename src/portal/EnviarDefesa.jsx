import React, { useState } from 'react'
import { insert, upload, query } from '../config/supabase.js'
import MascaraInput, { apenasDigitos } from '../components/MascaraInput.jsx'

export default function EnviarDefesa({ registro, onVoltar }) {
  const [form, setForm] = useState({ nome: '', cpf: '', texto: '' })
  const [anexos, setAnexos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAnexo(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const caminho = `defesas/${Date.now()}_${file.name}`
      const url = await upload('fiscon-fotos', caminho, file)
      setAnexos(prev => [...prev, url])
    } catch {
      setErro('Erro ao enviar anexo.')
    }
  }

  async function enviar() {
    if (!form.nome || !form.texto) {
      setErro('Preencha seu nome e o texto da defesa.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      const existente = await query('defesas', q =>
        q.eq('record_id', registro.id).eq('status', 'pendente').limit(1)
      )
      if (existente?.length > 0) {
        setErro('Já existe uma defesa pendente para este documento.')
        setEnviando(false)
        return
      }
      await insert('defesas', {
        id: `def-${Date.now()}`,
        gerencia: registro.gerencia,
        record_id: registro.id,
        record_num: registro.num,
        nome: form.nome,
        cpf: apenasDigitos(form.cpf),
        texto: form.texto,
        anexos,
        status: 'pendente',
      })
      setEnviado(true)
    } catch {
      setErro('Erro ao enviar defesa. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px 28px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#166534', marginBottom: '8px' }}>Defesa Enviada!</h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Sua defesa foi recebida e será analisada. Consulte o resultado com o mesmo código de acesso.
          </p>
          <button onClick={onVoltar} style={{ background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 28px', fontWeight: '700', cursor: 'pointer' }}>
            Voltar à consulta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onVoltar} style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#64748B' }}>
            ← Voltar
          </button>
          <h2 style={{ fontSize: '1.1rem', color: '#1E293B', margin: 0 }}>Enviar Defesa</h2>
        </div>

        <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '0.82rem', color: '#B45309' }}>
          📋 Referente ao documento <strong>{registro.num}</strong>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Campo label="Seu nome completo *">
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do defensor" />
          </Campo>

          <Campo label="CPF">
            <MascaraInput tipo="cpf" value={form.cpf} onChange={v => setForm(f => ({ ...f, cpf: v }))} />
          </Campo>

          <Campo label="Texto da defesa *">
            <textarea
              value={form.texto}
              onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
              rows={6}
              placeholder="Descreva os motivos pelos quais você contesta a notificação/auto..."
              style={{ resize: 'vertical' }}
            />
          </Campo>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Anexos (fotos, documentos)
            </label>
            {anexos.map((url, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: '#1A56DB', marginBottom: '4px' }}>📎 Anexo {i + 1} enviado</div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '2px dashed #CBD5E0', borderRadius: '10px', cursor: 'pointer', color: '#64748B', fontSize: '0.82rem' }}>
              + Adicionar anexo
              <input type="file" accept="image/*,.pdf" onChange={handleAnexo} style={{ display: 'none' }} />
            </label>
          </div>

          {erro && (
            <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '12px', color: '#B91C1C', fontSize: '0.85rem' }}>{erro}</div>
          )}

          <button onClick={enviar} disabled={enviando} style={{
            background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '12px',
            padding: '14px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
          }}>
            {enviando ? 'Enviando...' : 'Enviar Defesa'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
