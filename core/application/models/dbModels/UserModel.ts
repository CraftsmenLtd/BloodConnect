import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type UserFields = Omit<UserDetailsDTO, 'id' | 'registrationDate'> & HasTimeLog & {
  PK: `USER#${string}`;
  SK: 'PROFILE';
}

export default class UserModel implements NosqlModel<UserFields>, DbModelDtoAdapter<UserDetailsDTO, UserFields> {
  getIndexDefinitions(): IndexDefinitions<UserFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<UserFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<UserFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(userDto: UserDetailsDTO): UserFields {
    const { id, ...remainingUser } = userDto
    return {
      PK: `USER#${typeof id === 'string' ? id : id.toString()}`,
      SK: 'PROFILE',
      ...remainingUser,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: UserFields): UserDetailsDTO {
    const { PK, SK, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: PK.replace('USER#', '') }
  }
}
