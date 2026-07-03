import fc from 'fast-check'
import { ChatConnectionModel } from '../../commons/ddbModels/ChatConnectionModel'
import { connectionArb } from '../mock/chatArbitraries'

describe('ChatConnectionModel', () => {
  const model = new ChatConnectionModel()

  it('declares GSI1 for connection-by-user lookups', () => {
    expect(model.getIndexDefinitions()).toEqual({
      GSI: { GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' } }
    })
  })

  it('round-trips DTO -> item -> DTO (PBT)', () => {
    fc.assert(
      fc.property(connectionArb, (connection) => {
        expect(model.toDto(model.fromDto(connection))).toEqual(connection)
      })
    )
  })

  it('keys the connection for direct delete and user fan-out', () => {
    fc.assert(
      fc.property(connectionArb, (connection) => {
        const item = model.fromDto(connection)
        expect(item.PK).toBe(`CHAT_CONN#${connection.connectionId}`)
        expect(item.SK).toBe('META')
        expect(item.GSI1PK).toBe(`CHAT_CONN_USER#${connection.userId}`)
        expect(item.GSI1SK).toBe(connection.connectionId)
      })
    )
  })
})
