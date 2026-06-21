// Compact "x ago" label from an ISO timestamp or epoch ms.
export const timeAgo = (when: string | number, now: number = Date.now()): string => {
  const then = typeof when === 'number' ? when : new Date(when).getTime()
  if (!Number.isFinite(then)) return '—'

  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}
