const mockSignUp = jest.fn()
const mockConfirmSignUp = jest.fn()
const mockSignIn = jest.fn()
const mockSignInWithRedirect = jest.fn()
const mockDecodeJWT = jest.fn()
const mockSignOut = jest.fn()
const mockFetchAuthSession = jest.fn()

export {
  mockSignUp as signUp,
  mockConfirmSignUp as confirmSignUp,
  mockSignIn as signIn,
  mockSignInWithRedirect as signInWithRedirect,
  mockDecodeJWT as decodeJWT,
  mockSignOut as signOut,
  mockFetchAuthSession as fetchAuthSession
}
