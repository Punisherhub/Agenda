/**
 * Utilitários para gerenciamento de timezone do Brasil (America/Sao_Paulo)
 */

/**
 * Timezone do Brasil
 */
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Converte string ISO para Date considerando timezone do Brasil
 */
export function parseISOWithBrazilTZ(isoString: string): Date {
  return new Date(isoString)
}

/**
 * Formata data para exibição no formato brasileiro
 */
export function formatBrazilDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return new Intl.DateTimeFormat('pt-BR', options).format(dateObj)
}

/**
 * Formata hora para exibição no timezone do Brasil
 */
export function formatBrazilTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj)
}

/**
 * Obtém data/hora atual no timezone do Brasil
 */
export function getBrazilNow(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE })
  )
}

/**
 * Converte Date para string ISO no timezone do Brasil
 */
export function toBrazilISO(date: Date): string {
  // Pega os componentes da data no timezone do Brasil
  const year = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, year: 'numeric' })
  const month = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, month: '2-digit' })
  const day = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, day: '2-digit' })
  const hour = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, hour: '2-digit', hour12: false })
  const minute = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, minute: '2-digit' })
  const second = date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE, second: '2-digit' })

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

/**
 * Verifica se uma data é hoje (no timezone do Brasil)
 */
export function isBrazilToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getBrazilNow()

  const dateStr = formatBrazilDate(dateObj, false)
  const nowStr = formatBrazilDate(now, false)

  return dateStr === nowStr
}

/**
 * Formata data relativa (hoje, ontem, amanhã)
 */
export function formatRelativeBrazilDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isBrazilToday(dateObj)) {
    return `Hoje, ${formatBrazilTime(dateObj)}`
  }

  const now = getBrazilNow()
  const diffTime = dateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === -1) {
    return `Ontem, ${formatBrazilTime(dateObj)}`
  }

  if (diffDays === 1) {
    return `Amanhã, ${formatBrazilTime(dateObj)}`
  }

  return formatBrazilDate(dateObj, true)
}
