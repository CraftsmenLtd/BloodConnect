export function getRemainingMsOfDay(dateNow = Date.now()): number {
  return new Date().setUTCHours(23, 59, 59) - dateNow
}

export function getDaysInSecs(dayCount: number): number {
  if (dayCount < 0) {
    return 0
  }
  return dayCount * 24 * 60 * 60
}
