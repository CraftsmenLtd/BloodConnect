/* eslint-disable no-console */
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { UserRepository, UserProfileDTO } from '../../../application/technicalImpl/policies/repositories/UserRepository'
// import DatabaseError from '../../../../commons/libs/errors/DatabaseError'
// import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'

export class DynamoDBUserRepository implements UserRepository {
  constructor(private readonly dynamoDB: DynamoDB) {}

  async getUserProfile(userId: string): Promise<UserProfileDTO | null> {
    // try {
    const result = await this.dynamoDB.getItem({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: 'PROFILE' }
      }
    })

    if (result.Item == null) return null

    console.log('getUser-result-item', result.Item)
    console.log('getUser-result-item-deviceToken', result.Item.deviceToken)
    console.log('getUser-result-item-deviceToken-s', result.Item.deviceToken?.S)

    return {
      userId,
      deviceToken: result.Item.deviceToken?.S
    }
    // } catch (error) {
    //   throw new DatabaseError(
    //     `Failed to get user profile. Error: ${error}`,
    //     GENERIC_CODES.ERROR
    //   )
    // }
  }
}
