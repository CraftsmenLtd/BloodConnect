import { UserDTO } from '../../../../commons/dto/UserDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type UserFields = Omit<UserDTO, 'id' | 'registrationDate'> & HasTimeLog & {
  PK: `USER#${string}`;
  SK: 'PROFILE';
}

export default class UserModel implements NosqlModel<UserFields>, DbModelDtoAdapter<UserDTO, UserFields> {
  getIndexDefinitions(): IndexDefinitions<UserFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<UserFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<UserFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(userDto: UserDTO): UserFields {
    const { id, registrationDate, ...remainingUser } = userDto
    return {
      PK: `USER#${typeof id === 'string' ? id : id.toString()}`,
      SK: 'PROFILE',
      ...remainingUser,
      createdAt: registrationDate.toISOString()
    }
  }

  toDto(dbFields: UserFields): UserDTO {
    const { PK, SK, createdAt, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: PK.replace('USER#', ''), registrationDate: new Date(createdAt) }
  }
}
