/**
 * Funções de formatação para campos brasileiros
 */

/**
 * Formata CPF: 12345678901 -> 123.456.789-01
 */
export const formatCPF = (value: string): string => {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return numbers.slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Formata Telefone: 11999887766 -> (11) 99988-7766
 * Suporta telefone fixo (10 dígitos) e celular (11 dígitos)
 */
export const formatTelefone = (value: string): string => {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return numbers.slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

/**
 * Formata CEP: 01310100 -> 01310-100
 */
export const formatCEP = (value: string): string => {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '')
  return numbers.slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

/**
 * Remove formatação, mantendo apenas números
 */
export const removeFormatting = (value: string): string => {
  return value.replace(/\D/g, '')
}
