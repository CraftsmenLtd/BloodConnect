import { GenericErrorCodes, HttpErrorCodes } from '../../../libs/errors/errorCodes'

describe('errorCodes', () => {
  describe('GenericErrorCodes', () => {
    it('should contain errors with specific error codes', () => {
      const genericError = GenericErrorCodes
      expect(genericError.unauthorized).toBe(401)
    })
  })

  describe('HttpErrorCodes', () => {
    it('should contain errors with specific error codes', () => {
      const genericError = HttpErrorCodes
      expect(genericError.unauthorized).toBe(401)
      expect(genericError.notFound).toBe(404)
    })
  })
})
