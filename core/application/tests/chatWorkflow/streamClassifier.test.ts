import fc from 'fast-check'
import {
  classifyStreamItem,
  parseAcceptanceKeys,
  parseRequestKeys,
  LifecycleAction
} from '../../chatWorkflow/streamClassifier'
import { AcceptDonationStatus, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { idArb } from '../utils/chatGenerators'

const eventNameArb = fc.constantFrom('INSERT', 'MODIFY', 'REMOVE')
const statusArb = fc.constantFrom(
  'ACCEPTED',
  'IGNORED',
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  undefined
)

describe('classifyStreamItem', () => {
  it('always returns a valid LifecycleAction (PBT: total + deterministic)', () => {
    fc.assert(
      fc.property(
        fc.record({ pk: fc.string(), sk: fc.string(), eventName: eventNameArb, status: statusArb }),
        (input) => {
          const action = classifyStreamItem(input)
          expect(Object.values(LifecycleAction)).toContain(action)
          // determinism
          expect(classifyStreamItem(input)).toBe(action)
        }
      )
    )
  })

  it('CREATE only for an ACCEPTED acceptance row (non-REMOVE)', () => {
    fc.assert(
      fc.property(idArb, idArb, idArb, fc.constantFrom('INSERT', 'MODIFY'), (seeker, req, donor, eventName) => {
        const action = classifyStreamItem({
          pk: `BLOOD_REQ#${seeker}`,
          sk: `ACCEPTED#${req}#${donor}`,
          eventName,
          status: AcceptDonationStatus.ACCEPTED
        })
        expect(action).toBe(LifecycleAction.CREATE_CHANNEL)
      })
    )
  })

  it('LOCK only for a COMPLETED donation-request row', () => {
    const action = classifyStreamItem({
      pk: 'BLOOD_REQ#seeker-1',
      sk: 'BLOOD_REQ#2026-06-26T00:00:00.000Z#req-1',
      eventName: 'MODIFY',
      status: DonationStatus.COMPLETED
    })
    expect(action).toBe(LifecycleAction.LOCK_REQUEST_CHANNELS)
  })

  it('NOOP for IGNORED acceptance, non-COMPLETED request, REMOVE, and unrelated items', () => {
    expect(
      classifyStreamItem({ pk: 'BLOOD_REQ#s', sk: 'ACCEPTED#r#d', eventName: 'MODIFY', status: 'IGNORED' })
    ).toBe(LifecycleAction.NOOP)
    expect(
      classifyStreamItem({ pk: 'BLOOD_REQ#s', sk: 'BLOOD_REQ#t#r', eventName: 'MODIFY', status: 'PENDING' })
    ).toBe(LifecycleAction.NOOP)
    expect(
      classifyStreamItem({ pk: 'BLOOD_REQ#s', sk: 'ACCEPTED#r#d', eventName: 'REMOVE', status: 'ACCEPTED' })
    ).toBe(LifecycleAction.NOOP)
    expect(
      classifyStreamItem({ pk: 'USER#s', sk: 'PROFILE', eventName: 'INSERT', status: undefined })
    ).toBe(LifecycleAction.NOOP)
  })
})

describe('key parsing (round-trip PBT)', () => {
  it('parseAcceptanceKeys inverts the acceptance key shape', () => {
    fc.assert(
      fc.property(idArb, idArb, idArb, (seekerId, requestPostId, donorId) => {
        const parsed = parseAcceptanceKeys(`BLOOD_REQ#${seekerId}`, `ACCEPTED#${requestPostId}#${donorId}`)
        expect(parsed).toEqual({ seekerId, requestPostId, donorId })
      })
    )
  })

  it('parseRequestKeys inverts the request key shape', () => {
    fc.assert(
      fc.property(idArb, idArb, (seekerId, requestPostId) => {
        const createdAt = '2026-06-26T00:00:00.000Z'
        const parsed = parseRequestKeys(`BLOOD_REQ#${seekerId}`, `BLOOD_REQ#${createdAt}#${requestPostId}`)
        expect(parsed).toEqual({ seekerId, createdAt, requestPostId })
      })
    )
  })
})
