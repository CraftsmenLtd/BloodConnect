import { ulid } from 'ulid'

export const generateUniqueID = (): string => {
  return ulid()
}
