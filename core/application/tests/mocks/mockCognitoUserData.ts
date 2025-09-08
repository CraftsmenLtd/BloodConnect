import type { UpdateCognitoAttributes } from '../../models/cognito/CognitoModel'

export const mockUpdateCognitoAttributes: UpdateCognitoAttributes = {
  userPoolId: 'us-east-1_testPoolId',
  username: 'testuser',
  attributes: {
    email: 'updateduser@example.com',
    phone_number: '+19876543210'
  }
}
