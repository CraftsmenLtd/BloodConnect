import { UserRepository } from './UserRepository'
import { generateUniqueID } from '../../utils/ksuidGenerator'
import { DynamoDBTableOperations } from '../../dataBaseService/DynamoDBTableOperations'
import { UserDTO } from '@application/userWorkflows/UserDTO'

export class DynamoDBUserRepositoryAdapter implements UserRepository {
  private readonly dataBase: DynamoDBTableOperations<Record<string, unknown>>

  constructor() {
    this.dataBase = new DynamoDBTableOperations<Record<string, unknown>>()
  }

  async createUserItem(params: UserDTO): Promise<Partial<UserDTO>> {
    const userDdbItem = {
      pk: `USER#${generateUniqueID()}`,
      sk: 'PROFILE',
      ...params
    }
    await this.dataBase.createItem(userDdbItem)
    return params
  }
}
