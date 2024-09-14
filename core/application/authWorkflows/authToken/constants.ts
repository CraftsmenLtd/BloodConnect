import Environments from '@commons/libs/constants/Environments'

export const jwtSecret = process.env.JWT_SECRET ?? 'secret'
export const executionEnv = (process.env.ENVIRONMENT ?? Environments.local) as Environments
