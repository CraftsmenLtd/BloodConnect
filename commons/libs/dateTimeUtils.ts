export function getRemainingMsOfDay(dateNow = Date.now()): number {
  return new Date().setUTCHours(23, 59, 59) - dateNow
}
