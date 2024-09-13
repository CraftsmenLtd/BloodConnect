import { UserRepository } from './UserRepository'
import { generateUniqueID } from '../../utils/ksuidGenerator'
import { DynamoDBTableOperations } from '../../dataBaseService/DynamoDBTableOperations'
import { PutCommandInput, PutCommandOutput } from '@aws-sdk/lib-dynamodb'
import { UserDTO } from '@application/userWorkflows/UserDTO'

interface CustomPutCommandOutput extends PutCommandOutput, Partial<UserDTO> {}
export class DynamoDBUserRepositoryAdapter implements UserRepository {
  private readonly dataBase: DynamoDBTableOperations<Record<string, unknown>>

  constructor() {
    this.dataBase = new DynamoDBTableOperations<PutCommandInput>()
  }

  async createUserItem(params: UserDTO): Promise<Partial<CustomPutCommandOutput>> {
    const userDdbItem = {
      pk: `USER#${generateUniqueID()}`,
      sk: 'PROFILE',
      ...params
    }

    try {
      const result = await this.dataBase.createItem(userDdbItem)
      return { ...params, ...result }
    } catch (error) {
      throw new Error('Failed to create user item')
    }
  }
}
