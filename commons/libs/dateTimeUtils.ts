export function getRemainingSecsOfDay (dateNow = Date.now()): number {
  return Math.round((new Date().setUTCHours(23, 59, 59) - dateNow) / 1000)
}

export function getDaysInSecs (dayCount: number): number {
  if (dayCount < 0) {
    return 0
  }
  return dayCount * 24 * 60 * 60
}
