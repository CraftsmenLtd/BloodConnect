import getClientType from '@commons/libs/getClientType'

describe('getClientType', () => {
  // iPhone|iPad|iPod|webOS|Android|Windows Phone|BlackBerry
  it('should return mobile for userAgent contains mobile related keywords in userAgent', () => {
    expect(getClientType('Android')).toBe('mobile')
  })

  it('should return mobile for userAgent contains mobile related keywords in userAgent', () => {
    expect(getClientType('iPhone')).toBe('mobile')
  })

  it('should return mobile for userAgent contains mobile related keywords in userAgent', () => {
    expect(getClientType('BlackBerry')).toBe('mobile')
  })

  it('should return mobile for userAgent contains mobile related keywords in userAgent', () => {
    expect(getClientType('Windows Phone')).toBe('mobile')
  })

  it('should return web for not defined userAgent', () => {
    expect(getClientType('abcd')).toBe('web')
  })

  it('should return web for empty string userAgent', () => {
    expect(getClientType('')).toBe('web')
  })
})
