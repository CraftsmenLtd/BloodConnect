import { DonorSearchModel } from '../../commons/ddbModels/DonorSearchModel'
import {
  DonorSearchStatus,
  DonorSearchCompletionReason,
  type DonorSearchDTO
} from '../../../../../commons/dto/DonationDTO'

describe('DonorSearchModel GSI1 keys', () => {
  const model = new DonorSearchModel()

  const baseDto: DonorSearchDTO = {
    seekerId: 'seeker-1',
    requestPostId: 'req-1',
    createdAt: '2026-06-01T00:00:00.000Z',
    status: DonorSearchStatus.PENDING,
    notifiedEligibleDonors: {}
  }

  test('buckets a pending search into the PENDING partition keyed by createdAt', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.GSI1PK).toBe('DONOR_SEARCH#PENDING')
    expect(fields.GSI1SK).toBe('2026-06-01T00:00:00.000Z')
  })

  test('buckets a completed search by its completion reason', () => {
    const fields = model.fromDto({
      ...baseDto,
      status: DonorSearchStatus.COMPLETED,
      completionReason: DonorSearchCompletionReason.RADIUS_EXHAUSTED
    })

    expect(fields.GSI1PK).toBe('DONOR_SEARCH#RADIUS_EXHAUSTED')
  })

  test('omits GSI1 keys for a partial update without status', () => {
    const { status, ...withoutStatus } = baseDto
    const fields = model.fromDto(withoutStatus as DonorSearchDTO)

    expect(fields.GSI1PK).toBeUndefined()
    expect(fields.GSI1SK).toBeUndefined()
  })

  test('strips GSI1 keys back out in toDto', () => {
    const dto = model.toDto(model.fromDto(baseDto))

    expect('GSI1PK' in dto).toBe(false)
    expect('GSI1SK' in dto).toBe(false)
  })
})

describe('DonorSearchModel key material validation', () => {
  const model = new DonorSearchModel()

  const baseDto: DonorSearchDTO = {
    seekerId: 'seeker-1',
    requestPostId: 'req-1',
    createdAt: '2026-06-01T00:00:00.000Z',
    status: DonorSearchStatus.PENDING,
    notifiedEligibleDonors: {}
  }

  test('builds the record key from the supplied createdAt rather than the current time', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.SK).toBe('DONOR_SEARCH#2026-06-01T00:00:00.000Z#req-1')
    expect(fields.createdAt).toBe('2026-06-01T00:00:00.000Z')
  })

  test.each([
    ['seekerId', 'Cannot build donor search key: seekerId is missing'],
    ['requestPostId', 'Cannot build donor search key: requestPostId is missing'],
    ['createdAt', 'Cannot build donor search key: createdAt is missing']
  ])('throws instead of fabricating a key when %s is missing', (field, expectedMessage) => {
    const { [field as keyof DonorSearchDTO]: _removed, ...withoutField } = baseDto

    expect(() => model.fromDto(withoutField as DonorSearchDTO)).toThrow(expectedMessage)
  })

  test.each(['seekerId', 'requestPostId', 'createdAt'])(
    'throws when %s is an empty string',
    (field) => {
      expect(() => model.fromDto({ ...baseDto, [field]: '' })).toThrow(
        `Cannot build donor search key: ${field} is missing`
      )
    }
  )

  test('keeps partial updates working as long as the key fields are present', () => {
    const { status: _status, notifiedEligibleDonors: _donors, ...keyOnly } = baseDto

    const fields = model.fromDto({ ...keyOnly, currentRetryCount: 2 } as DonorSearchDTO)

    expect(fields.PK).toBe('DONOR_SEARCH#seeker-1')
    expect(fields.SK).toBe('DONOR_SEARCH#2026-06-01T00:00:00.000Z#req-1')
    expect(fields.currentRetryCount).toBe(2)
  })
})
