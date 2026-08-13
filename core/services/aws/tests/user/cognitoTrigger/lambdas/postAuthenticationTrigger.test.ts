import postAuthenticationLambda from '../../../../user/cognitoTrigger/lambdas/postAuthenticationTrigger'
import { UserService } from '../../../../../../application/userWorkflow/UserService'
import { createPostAuthenticationEvent } from '../../../mock/cognitoEventMocks'
import { ISO_TIMESTAMP_REGEX } from '../../../../../../../commons/libs/constants/Patterns'
import type { PostAuthenticationTriggerEvent } from 'aws-lambda'

jest.mock('../../../../../../application/userWorkflow/UserService')

describe('postAuthenticationLambda Tests', () => {
  beforeEach(() => {
    jest.spyOn(UserService.prototype, 'recordLastSuccessfulLoginTimestamp').mockResolvedValue()
    jest.spyOn(UserService.prototype, 'syncProviderProfilePicture').mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return the event unchanged when triggerSource is not PostAuthentication_Authentication', async () => {
    const mockEvent = createPostAuthenticationEvent()

    mockEvent.triggerSource = 'SomeOtherTrigger' as PostAuthenticationTriggerEvent['triggerSource']

    const result = await postAuthenticationLambda(mockEvent)

    expect(UserService.prototype.recordLastSuccessfulLoginTimestamp).not.toHaveBeenCalled()
    expect(result).toEqual(mockEvent)
  })

  test('should skip update when custom:userId is missing', async () => {
    const mockEvent = createPostAuthenticationEvent({
      request: {
        userAttributes: {
          email: 'test@example.com',
          name: 'Test User'
          // custom:userId is missing
        },
        clientMetadata: {},
        newDeviceUsed: false
      }
    })

    const result = await postAuthenticationLambda(mockEvent)

    expect(UserService.prototype.recordLastSuccessfulLoginTimestamp).not.toHaveBeenCalled()
    expect(result).toEqual(mockEvent)
  })

  test('should update last login timestamp when custom:userId is present', async () => {
    const mockEvent = createPostAuthenticationEvent()

    const result = await postAuthenticationLambda(mockEvent)

    expect(UserService.prototype.recordLastSuccessfulLoginTimestamp).toHaveBeenCalledWith(
      'user123',
      expect.stringMatching(ISO_TIMESTAMP_REGEX)
    )
    expect(result).toEqual(mockEvent)
  })

  test('should sync the provider picture when the login carries a picture claim', async () => {
    const mockEvent = createPostAuthenticationEvent({
      request: {
        userAttributes: {
          email: 'test@example.com',
          name: 'Test User',
          'custom:userId': 'user123',
          picture: 'https://lh3.googleusercontent.com/a/photo.jpg'
        },
        clientMetadata: {},
        newDeviceUsed: false
      }
    })

    const result = await postAuthenticationLambda(mockEvent)

    expect(UserService.prototype.syncProviderProfilePicture).toHaveBeenCalledWith(
      'user123',
      'https://lh3.googleusercontent.com/a/photo.jpg'
    )
    expect(result).toEqual(mockEvent)
  })

  test('should not attempt a picture sync when the login carries no picture claim', async () => {
    await postAuthenticationLambda(createPostAuthenticationEvent())

    expect(UserService.prototype.syncProviderProfilePicture).not.toHaveBeenCalled()
  })

  test('should not attempt a picture sync when the picture claim is empty', async () => {
    const mockEvent = createPostAuthenticationEvent({
      request: {
        userAttributes: {
          email: 'test@example.com',
          name: 'Test User',
          'custom:userId': 'user123',
          picture: ''
        },
        clientMetadata: {},
        newDeviceUsed: false
      }
    })

    await postAuthenticationLambda(mockEvent)

    expect(UserService.prototype.syncProviderProfilePicture).not.toHaveBeenCalled()
  })

})
