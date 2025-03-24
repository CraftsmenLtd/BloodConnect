import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export const USER_PK_PREFIX = 'USER'
export const USER_SK = 'PROFILE'

export type UserFields = Omit<UserDetailsDTO, 'id' | 'registrationDate'> & HasTimeLog & {
  PK: `${typeof USER_PK_PREFIX}#${string}`;
  SK: typeof USER_SK;
}

export default class UserModel implements NosqlModel<UserFields>, DbModelDtoAdapter<UserDetailsDTO, UserFields> {
  getIndexDefinitions (): IndexDefinitions<UserFields> {
    return {}
  }

  getPrimaryIndex (): DbIndex<UserFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex (indexType: IndexType, indexName: string): DbIndex<UserFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto (UserDetailsDTO: UserDetailsDTO): UserFields {
    const { id, ...remainingUser } = UserDetailsDTO
    return {
      PK: `${USER_PK_PREFIX}#${typeof id === 'string' ? id : id.toString()}`,
      SK: USER_SK,
      ...remainingUser,
      createdAt: new Date().toISOString()
    }
  }

  toDto (dbFields: UserFields): UserDetailsDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, ...remainingUserFields } = dbFields
    return { ...remainingUserFields, id: PK.replace(`${USER_PK_PREFIX}#`, '') }
  }
}
