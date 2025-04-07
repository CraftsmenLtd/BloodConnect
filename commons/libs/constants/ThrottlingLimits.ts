export const THROTTLING_LIMITS = {
  BLOOD_REQUEST: {
    MAX_REQUESTS_PER_DAY: 10,
    get ERROR_MESSAGE() {
      return `You've reached today's limit of ${this.MAX_REQUESTS_PER_DAY} requests. Please try tomorrow.`
    }
  }
} as const
