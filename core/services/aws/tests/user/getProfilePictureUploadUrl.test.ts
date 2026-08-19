import type { APIGatewayProxyResult } from 'aws-lambda'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}))
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

// Deliberately NOT mocking Config: these names are the contract with Terraform
// (iac/terraform/aws/user/lambdas.tf), and a rename on either side must fail here.
const ENV = {
  AWS_REGION: 'ap-south-1',
  MEDIA_BUCKET_NAME: 'test-media',
  MEDIA_CDN_BASE_URL: 'https://test.bloodconnect.net',
  AVATAR_OBJECT_PREFIX: 'media/user-images'
}

type Handler = (
  event: { contentType?: string } & HttpLoggerAttributes
) => Promise<APIGatewayProxyResult>

const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>

const loadHandler = (): Handler => {
  let handler: Handler = (() => {
    throw new Error('handler not loaded')
  }) as unknown as Handler
  jest.isolateModules(() => {
    handler = require('../../user/getProfilePictureUploadUrl').default
  })

  return handler
}

describe('getProfilePictureUploadUrlLambda', () => {
  const originalEnv = process.env
  let getProfilePictureUploadUrlLambda: Handler

  beforeEach(() => {
    process.env = { ...originalEnv, ...ENV }
    mockedGetSignedUrl.mockReset()
    mockedGetSignedUrl.mockResolvedValue('https://presigned.example/put')
    getProfilePictureUploadUrlLambda = loadHandler()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  const event = { userId: '12345', apiGwRequestId: 'req-1', cloudFrontRequestId: 'cf-1' }

  it('should sign a PUT against the configured media bucket and avatar key', async () => {
    await getProfilePictureUploadUrlLambda({ ...event, contentType: 'image/png' })

    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1)
    const command = mockedGetSignedUrl.mock.calls[0][1] as PutObjectCommand
    // isolateModules gives the handler its own registry, so the SDK class identity
    // differs from the one imported here — compare by name rather than instanceof.
    expect(command.constructor.name).toBe(PutObjectCommand.name)
    expect(command.input).toEqual({
      Bucket: 'test-media',
      Key: 'media/user-images/12345/profile',
      ContentType: 'image/png'
    })
  })

  it('should return a fileUrl rooted at the CDN base url', async () => {
    const result = await getProfilePictureUploadUrlLambda(event)

    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(JSON.parse(result.body)).toEqual({
      uploadUrl: 'https://presigned.example/put',
      fileUrl: 'https://test.bloodconnect.net/media/user-images/12345/profile',
      success: true
    })
  })

  it('should never emit an undefined segment when the env is wired correctly', async () => {
    const result = await getProfilePictureUploadUrlLambda(event)
    const { fileUrl } = JSON.parse(result.body)

    expect(fileUrl).not.toContain('undefined')
  })

  it('should default the content type to image/jpeg when none is supplied', async () => {
    await getProfilePictureUploadUrlLambda(event)

    const command = mockedGetSignedUrl.mock.calls[0][1] as PutObjectCommand
    expect(command.input.ContentType).toBe('image/jpeg')
  })

  it('should reject an unsupported content type without signing anything', async () => {
    const result = await getProfilePictureUploadUrlLambda({ ...event, contentType: 'image/gif' })

    expect(result.statusCode).toBe(HTTP_CODES.BAD_REQUEST)
    expect(mockedGetSignedUrl).not.toHaveBeenCalled()
  })

  it('should return an error response when signing fails', async () => {
    mockedGetSignedUrl.mockRejectedValue(new Error('signing blew up'))

    const result = await getProfilePictureUploadUrlLambda(event)

    expect(result.statusCode).toBe(HTTP_CODES.ERROR)
    expect(result.body).toContain('signing blew up')
  })
})
