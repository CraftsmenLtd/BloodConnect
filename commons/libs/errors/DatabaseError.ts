import ApplicationError from './ApplicationError'

export default class DatabaseError extends ApplicationError {
  constructor (message: string, code: number) {
    super('Database Error', message, code)
  }
}
