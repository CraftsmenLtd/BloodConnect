import getJwtToken from '../../../authWorkflows/authToken/tokenGenerator'
import validateToken from '../../../../application/authWorkflows/authToken/tokenValidator'

describe('tokenGenerator', () => {
  const tokenPayload = { email: 'a@b.com', username: 'test', role: 'admin' }

  it('should generate a valid jwt token with 3 parts separated by dot', () => {
    const token = getJwtToken(tokenPayload, 100)
    expect(token.split('.').length).toBe(3)
  })

  it('should return blank string if invalid duration passed', () => {
    const token = getJwtToken(tokenPayload, 0)
    expect(token.length).toBe(0)
  })

  it('should return blank string if invalid duration passed', () => {
    const token = getJwtToken(tokenPayload, -10)
    expect(token.length).toBe(0)
  })

  it('should contain valid payload in token', () => {
    const token = getJwtToken(tokenPayload, 100)
    const jwtPayload = validateToken<typeof tokenPayload>(token)
    const { email, username, role } = jwtPayload
    expect(email).toEqual(tokenPayload.email)
    expect(username).toEqual(tokenPayload.username)
    expect(role).toEqual(tokenPayload.role)
  })
})
