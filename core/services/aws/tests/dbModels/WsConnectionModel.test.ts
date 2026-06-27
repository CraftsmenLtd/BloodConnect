import { WsConnectionModel } from '../../commons/ddbModels/WsConnectionModel'
import type { WsConnectionDTO } from '../../commons/ddbModels/WsConnectionModel'
import { WS_CONNECTION_TTL_HOURS } from '../../../../../commons/libs/constants/NoMagicNumbers'

const SECONDS_PER_HOUR = 60 * 60

describe('WsConnectionModel', () => {
  const model = new WsConnectionModel()
  const now = new Date('2026-06-26T10:00:00.000Z').getTime()

  const baseDto: WsConnectionDTO = {
    userId: 'donor-1',
    connectionId: 'conn-abc123'
  }

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('builds exact key strings', () => {
    const fields = model.fromDto(baseDto)

    expect(fields.PK).toBe('WSCONN#donor-1')
    expect(fields.SK).toBe('conn-abc123')
  })

  test('expiresAt is epoch seconds = now + WS_CONNECTION_TTL_HOURS', () => {
    const fields = model.fromDto(baseDto)
    const expected = Math.floor(now / 1000) + WS_CONNECTION_TTL_HOURS * SECONDS_PER_HOUR

    expect(fields.expiresAt).toBe(expected)
    expect(Number.isInteger(fields.expiresAt)).toBe(true)
    expect(String(fields.expiresAt)).not.toContain('T')
  })

  test('fromDto/toDto round-trips userId and connectionId', () => {
    const dto = model.toDto(model.fromDto(baseDto))

    expect(dto.userId).toBe('donor-1')
    expect(dto.connectionId).toBe('conn-abc123')
  })
})
