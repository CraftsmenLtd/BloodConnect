import { UserDTO } from '../../../../commons/dto/UserDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type UserFields = Omit<UserDTO, 'id' | 'registrationDate'> & HasTimeLog & {
  pk: `USER#${string}`;
  sk: 'PROFILE';
}

export default class UserModel implements NosqlModel<UserFields>, DbModelDtoAdapter<UserDTO, UserFields> {
  getIndexDefinitions(): IndexDefinitions<UserFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<UserFields> {
    return { partitionKey: 'pk', sortKey: 'sk' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<UserFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(userDto: UserDTO): UserFields {
    const { id, registrationDate, ...remainingUser } = userDto
    return {
      pk: `USER#${typeof id === 'string' ? id : id.toString()}`,
      sk: 'PROFILE',
      ...remainingUser,
      createdAt: registrationDate.toISOString()
    }
  }

  toDto(dbFields: UserFields): UserDTO {
    const { pk, sk, createdAt, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: pk.replace('USER#', ''), registrationDate: new Date(createdAt) }
  }
}
