/* eslint-disable no-console */
import Environments from '@commons/libs/constants/Environments'
import Logger from '@commons/libs/logger/Logger'

export class ApplicationLogger implements Logger {
  readonly shouldLog: boolean

  constructor(env: Environments) {
    this.shouldLog = !(env === 'production' || env === 'test')
  }

  info(...message: string[]): void {
    this.shouldLog && console.log(...message)
  }

  debug(...message: string[]): void {
    this.shouldLog && console.debug(...message)
  }

  warn(...message: string[]): void {
    this.shouldLog && console.warn(...message)
  }

  error(...message: string[]): void {
    this.shouldLog && console.error(...message)
  }
}

export default (env: Environments): Logger => new ApplicationLogger(env)
