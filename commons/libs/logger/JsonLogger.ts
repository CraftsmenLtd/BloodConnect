import pino from 'pino/pino'

export const JsonLogger = pino({
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  base: null,
  level: process.env.LOG_LEVEL ?? 'info'
})
