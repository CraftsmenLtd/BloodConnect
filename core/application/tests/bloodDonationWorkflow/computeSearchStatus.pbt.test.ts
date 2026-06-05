import * as fc from 'fast-check'
import { computeSearchStatus } from '../../bloodDonationWorkflow/BloodDonationService'
import type { AcceptDonationDTO, DonorSearchDTO } from '../../../../commons/dto/DonationDTO'
import { AcceptDonationStatus, DonorSearchStatus } from '../../../../commons/dto/DonationDTO'

const eligibleDonorArb = fc.record({
  distance: fc.float({ min: 0, max: 10000, noNaN: true }),
  locationId: fc.string({ minLength: 1 })
})

const notifiedEligibleDonorsArb = fc.dictionary(
  fc.string({ minLength: 1 }),
  eligibleDonorArb
)

const donorSearchArb: fc.Arbitrary<DonorSearchDTO> = fc.record({
  seekerId: fc.string({ minLength: 1 }),
  requestPostId: fc.string({ minLength: 1 }),
  createdAt: fc.string({ minLength: 1 }),
  status: fc.constantFrom(DonorSearchStatus.PENDING, DonorSearchStatus.COMPLETED),
  notifiedEligibleDonors: notifiedEligibleDonorsArb
})

const acceptedDonorArb: fc.Arbitrary<AcceptDonationDTO> = fc.record({
  donorId: fc.string({ minLength: 1 }),
  requestPostId: fc.string({ minLength: 1 }),
  status: fc.constantFrom(AcceptDonationStatus.ACCEPTED, AcceptDonationStatus.COMPLETED),
  seekerId: fc.string({ minLength: 1 }),
  createdAt: fc.string({ minLength: 1 })
})

const acceptedDonorsArb = fc.array(acceptedDonorArb)

describe('computeSearchStatus — property-based tests', () => {
  test('PBT-INV-01: null donorSearch yields all zeros and null status', () => {
    fc.assert(
      fc.property(acceptedDonorsArb, (acceptedDonors) => {
        const result = computeSearchStatus(null, acceptedDonors)
        expect(result.donorSearchStatus).toBeNull()
        expect(result.notifiedDonorsCount).toBe(0)
        expect(result.acceptedDonorsCount).toBe(0)
        expect(result.rejectedDonorsCount).toBe(0)
        expect(result.currentSearchRadiusKm).toBe(0)
      })
    )
  })

  test('PBT-INV-02: notifiedDonorsCount equals number of keys in notifiedEligibleDonors', () => {
    fc.assert(
      fc.property(donorSearchArb, acceptedDonorsArb, (donorSearch, acceptedDonors) => {
        const result = computeSearchStatus(donorSearch, acceptedDonors)
        expect(result.notifiedDonorsCount).toBe(Object.keys(donorSearch.notifiedEligibleDonors).length)
      })
    )
  })

  test('PBT-INV-03: acceptedDonorsCount equals length of acceptedDonors array', () => {
    fc.assert(
      fc.property(donorSearchArb, acceptedDonorsArb, (donorSearch, acceptedDonors) => {
        const result = computeSearchStatus(donorSearch, acceptedDonors)
        expect(result.acceptedDonorsCount).toBe(acceptedDonors.length)
      })
    )
  })

  test('PBT-INV-04: rejectedDonorsCount is non-negative and equals max(0, notified - accepted)', () => {
    fc.assert(
      fc.property(donorSearchArb, acceptedDonorsArb, (donorSearch, acceptedDonors) => {
        const result = computeSearchStatus(donorSearch, acceptedDonors)
        expect(result.rejectedDonorsCount).toBeGreaterThanOrEqual(0)
        const expected = Math.max(0, result.notifiedDonorsCount - result.acceptedDonorsCount)
        expect(result.rejectedDonorsCount).toBe(expected)
      })
    )
  })

  test('PBT-INV-05: currentSearchRadiusKm equals max distance in notifiedEligibleDonors, or 0 if empty', () => {
    fc.assert(
      fc.property(donorSearchArb, acceptedDonorsArb, (donorSearch, acceptedDonors) => {
        const result = computeSearchStatus(donorSearch, acceptedDonors)
        const distances = Object.values(donorSearch.notifiedEligibleDonors).map((d) => d.distance)
        const expectedRadius = distances.length > 0 ? Math.max(...distances) : 0
        expect(result.currentSearchRadiusKm).toBeCloseTo(expectedRadius, 5)
      })
    )
  })
})
