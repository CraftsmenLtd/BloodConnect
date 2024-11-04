import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import UserOperationError from './UserOperationError'
import { UserDTO } from '../../../commons/dto/UserDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { GenericMessage } from '../../../commons/dto/MessageDTO'
import { getEmailVerificationMessage, getPasswordResetVerificationMessage, getAppUserWellcomeMailMessage } from './userMessages'
import Repository from '../technicalImpl/policies/repositories/Repository'

interface UserAttributes {
  email: string;
  name: string;
  phone_number: string;
}

interface NotificationAttributes {
  userId: string;
  endpointArn: string;
}

export class UserService {
  async createNewUser(userAttributes: UserAttributes, userRepository: Repository<UserDTO>): Promise<UserDTO> {
    try {
      return userRepository.create({
        id: generateUniqueID(),
        email: userAttributes.email,
        name: userAttributes.name,
        phone: userAttributes.phone_number,
        registrationDate: new Date()
      })
    } catch (error) {
      throw new UserOperationError(`Failed to create new user. Error: ${error}`, GENERIC_CODES.ERROR)
    }
  }

  async storeEndpointArn(notificationAttributes: NotificationAttributes, userRepository: Repository<UserDTO>): Promise<void> {
    const { userId, endpointArn } = notificationAttributes

    const item = await userRepository.getItem(`USER#${userId}`, 'PROFILE')

    if (item === null) {
      throw new Error('Item not found.')
    }

    const updateData: Partial<UserDTO> = {
      id: userId,
      endpointArn
    }
    await userRepository.update(updateData)
  }

  getPostSignUpMessage(userName: string, securityCode: string): GenericMessage {
    return getEmailVerificationMessage(userName, securityCode)
  }

  getForgotPasswordMessage(userName: string, securityCode: string): GenericMessage {
    return getPasswordResetVerificationMessage(userName, securityCode)
  }

  getAppUserWellcomeMail(userName: string): GenericMessage {
    return getAppUserWellcomeMailMessage(userName)
  }
}
