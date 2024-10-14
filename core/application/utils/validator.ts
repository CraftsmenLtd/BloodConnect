export function validateDonationDateTime(donationDateTime: string): null {
  const now = new Date()
  const donationDate = new Date(donationDateTime)

  if (donationDate < now) {
    throw new Error('donationDateTime cannot be in the past.')
  }

  return null
}

export function validateBloodQuantity(bloodQuantity: number): null | string {
  if (bloodQuantity < 1 || bloodQuantity > 10) {
    throw new Error('bloodQuantity must be between 1 and 10.')
  }

  return null
}

export type ValidationRule<T> = (value: T) => null | string

export function validateInputWithRules<T extends Record<string, unknown>>(
  inputs: T,
  rules: Record<keyof T, Array<ValidationRule<unknown>>>
): string | null {
  for (const key in rules) {
    const value = inputs[key]
    const validators = rules[key]

    for (const validator of validators) {
      try {
        const result = validator(value)
        if (typeof result === 'string') {
          return `${key}: ${result}`
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        return `${key}: ${errorMessage}`
      }
    }
  }

  return null
}
