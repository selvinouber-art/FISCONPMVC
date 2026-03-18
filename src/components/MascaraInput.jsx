// MascaraInput — componente de input com máscara automática
// Uso: <MascaraInput tipo="matricula" value={v} onChange={fn} />
// Tipos: matricula | cpf | cnpj | cpfCnpj | telefone | cep | data

import React from 'react'

// ============================================================
// Funções de máscara
// ============================================================

export function mascaraMatricula(valor) {
  // xxxxx-x (6 dígitos com hífen antes do último)
  const nums = valor.replace(/\D/g, '').slice(0, 6)
  if (nums.length <= 5) return nums
  return `${nums.slice(0, 5)}-${nums.slice(5)}`
}

export function mascaraCPF(valor) {
  // xxx.xxx.xxx-xx
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
  return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
}

export function mascaraCNPJ(valor) {
  // xx.xxx.xxx/xxxx-xx
  const nums = valor.replace(/\D/g, '').slice(0, 14)
  if (nums.length <= 2) return nums
  if (nums.length <= 5) return `${nums.slice(0,2)}.${nums.slice(2)}`
  if (nums.length <= 8) return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5)}`
  if (nums.length <= 12) return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8)}`
  return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8,12)}-${nums.slice(12)}`
}

export function mascaraCpfCnpj(valor) {
  // Detecta automaticamente: até 11 dígitos = CPF, acima = CNPJ
  const nums = valor.replace(/\D/g, '')
  if (nums.length <= 11) return mascaraCPF(valor)
  return mascaraCNPJ(valor)
}

export function mascaraTelefone(valor) {
  // (xx) xxxxx-xxxx ou (xx) xxxx-xxxx
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return nums.length ? `(${nums}` : ''
  if (nums.length <= 6) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`
  return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
}

export function mascaraCEP(valor) {
  // xxxxx-xxx
  const nums = valor.replace(/\D/g, '').slice(0, 8)
  if (nums.length <= 5) return nums
  return `${nums.slice(0,5)}-${nums.slice(5)}`
}

export function mascaraData(valor) {
  // DD/MM/AAAA
  const nums = valor.replace(/\D/g, '').slice(0, 8)
  if (nums.length <= 2) return nums
  if (nums.length <= 4) return `${nums.slice(0,2)}/${nums.slice(2)}`
  return `${nums.slice(0,2)}/${nums.slice(2,4)}/${nums.slice(4)}`
}

// Retorna apenas os dígitos (para salvar no banco sem máscara)
export function apenasDigitos(valor) {
  return (valor || '').replace(/\D/g, '')
}

// Detecta se o valor é CPF ou CNPJ
export function tipoCpfCnpj(valor) {
  const nums = apenasDigitos(valor)
  if (nums.length <= 11) return 'CPF'
  return 'CNPJ'
}

// ============================================================
// Componente de input com máscara
// ============================================================

const MASCARAS = {
  matricula: mascaraMatricula,
  cpf:       mascaraCPF,
  cnpj:      mascaraCNPJ,
  cpfCnpj:   mascaraCpfCnpj,
  telefone:  mascaraTelefone,
  cep:       mascaraCEP,
  data:      mascaraData,
}

const PLACEHOLDERS = {
  matricula: '00000-0',
  cpf:       '000.000.000-00',
  cnpj:      '00.000.000/0000-00',
  cpfCnpj:   'CPF ou CNPJ',
  telefone:  '(77) 99999-9999',
  cep:       '00000-000',
  data:      'DD/MM/AAAA',
}

export default function MascaraInput({
  tipo,
  value = '',
  onChange,
  placeholder,
  disabled = false,
  style = {},
  ...props
}) {
  const fn = MASCARAS[tipo] || (v => v)

  function handleChange(e) {
    const mascarado = fn(e.target.value)
    onChange(mascarado)
  }

  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder={placeholder || PLACEHOLDERS[tipo] || ''}
      disabled={disabled}
      style={style}
      inputMode={tipo === 'data' ? 'numeric' : tipo === 'cpfCnpj' || tipo === 'cpf' || tipo === 'cnpj' || tipo === 'matricula' || tipo === 'cep' ? 'numeric' : 'text'}
      {...props}
    />
  )
}
