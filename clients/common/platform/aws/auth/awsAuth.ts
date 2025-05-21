import type { FetchUserAttributesOutput, AuthSession, SignInOutput } from 'aws-amplify/auth'
import { signOut, signIn, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth'

export const userSignOut = async(): Promise<void> => signOut()

export const userSignIn = async(email: string, password: string): Promise<SignInOutput> => signIn({
  username: email,
  password
})

export const getUser = async(): Promise<FetchUserAttributesOutput> => fetchUserAttributes()

export const getAuthSession = async(): Promise<AuthSession> => fetchAuthSession()
