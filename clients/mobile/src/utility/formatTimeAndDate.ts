export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  const today = new Date()

  // Check if the date is today's date
  const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

  // Format time in 12-hour format
  const hours = date.getHours() % 12 || 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'

  // Format date as "Today" if it's today's date, otherwise as "MMM dd"
  const formattedDate = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${hours}:${minutes}${ampm}, ${formattedDate}`
}
