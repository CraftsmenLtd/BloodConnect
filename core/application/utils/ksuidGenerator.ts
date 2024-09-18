import KSUID from 'ksuid'

export const generateUniqueID = (): string => {
  return KSUID.randomSync().toString()
}
