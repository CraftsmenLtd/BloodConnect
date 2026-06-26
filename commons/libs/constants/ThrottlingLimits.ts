export const THROTTLING_LIMITS = {
  BLOOD_REQUEST: {
    MAX_REQUESTS_PER_DAY: 10,
    get ERROR_MESSAGE() {
      return `You've reached today's limit of ${this.MAX_REQUESTS_PER_DAY} requests. Please try tomorrow.`
    }
  },
  CHAT_MESSAGE: {
    MAX_MESSAGES_PER_MINUTE: 60,
    get ERROR_MESSAGE() {
      return `You're sending messages too quickly. Limit is ${this.MAX_MESSAGES_PER_MINUTE} per minute.`
    }
  }
} as const
