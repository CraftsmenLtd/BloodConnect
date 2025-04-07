export default class ApplicationError extends Error {
  constructor(readonly name: string, message: string, readonly errorCode: number) {
    super(message)
  }
}
