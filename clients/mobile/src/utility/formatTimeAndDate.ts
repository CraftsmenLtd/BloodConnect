export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  const today = new Date()

  const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

  const hours = (date.getHours() % 12 === 0) ? 12 : date.getHours() % 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'

  const formattedDate = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${hours}:${minutes}${ampm}, ${formattedDate}`
}
