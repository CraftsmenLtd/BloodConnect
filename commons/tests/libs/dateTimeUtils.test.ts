import { getDaysInSecs, getRemainingSecsOfDay } from '../../libs/dateTimeUtils'

describe('dateTimeUtils', () => {
  describe('getRemainingMsOfDay', () => {
    it('should return remaining ms of day', () => {
      expect(getRemainingSecsOfDay(new Date().setUTCHours(23, 59, 30))).toBe(29)
      expect(getRemainingSecsOfDay(new Date().setUTCHours(13, 59, 59))).toBe(36000)
    })

    it('should return remaining ms of day at 0th sec of day', () => {
      expect(getRemainingSecsOfDay(new Date().setUTCHours(0, 0, 0))).toBe(86399)
    })

    it('should return remaining ms of day at last sec of day', () => {
      expect(getRemainingSecsOfDay(new Date().setUTCHours(23, 59, 58))).toBe(1)
    })
  })

  describe('getDaysInSecs', () => {
    it('should return day count in seconds', () => {
      expect(getDaysInSecs(1)).toBe(86400)
      expect(getDaysInSecs(7)).toBe(7 * 86400)
    })

    it('should return 0 for dayCount less than or equals to 0', () => {
      expect(getDaysInSecs(-1)).toBe(0)
      expect(getDaysInSecs(0)).toBe(0)
    })
  })
})
