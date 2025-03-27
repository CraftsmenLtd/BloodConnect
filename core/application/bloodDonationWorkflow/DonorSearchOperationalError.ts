class DonorSearchError extends Error {
  constructor (readonly name: string, message: string) {
    super(message)
  }
}

export class DonorSearchOperationalError extends DonorSearchError {
  constructor (message: string) {
    super('DonorSearchOperationalError', message)
  }
}

export class DonorSearchIntentionalError extends DonorSearchError {
  constructor (message: string) {
    super('DonorSearchIntentionalError', message)
  }
}
