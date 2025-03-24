export class ProfileError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ProfileError'
  }
}
