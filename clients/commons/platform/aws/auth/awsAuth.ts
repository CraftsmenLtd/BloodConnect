import { signOut, signIn, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth'
import { UserDTO } from '@commons/dto/UserDTO'

export const userSignOut = async(): Promise<void> => {
  await signOut()
}

export const userSignIn = async(email: string, password: string): Promise<any> => {
  return await signIn({
    username: email,
    password
  })
}

export const getUser = async(): Promise<UserDTO> => {
  return await fetchUserAttributes() as UserDTO
}

export const getAuthSession = async(): Promise<any> => {
  return await fetchAuthSession()
}
