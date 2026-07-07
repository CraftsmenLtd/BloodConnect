import type { APIGatewayProxyResult } from 'aws-lambda'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  awsRegion: string;
  avatarBucketName: string;
  avatarCdnBaseUrl: string;
  avatarObjectPrefix: string;
}>().getConfig()

const s3Client = new S3Client({ region: config.awsRegion })

const UPLOAD_URL_EXPIRY_SECONDS = 300
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

type ProfilePictureUploadEvent = {
  contentType?: string;
} & HttpLoggerAttributes

async function getProfilePictureUploadUrlLambda(
  event: ProfilePictureUploadEvent
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)

  try {
    const contentType = event.contentType ?? 'image/jpeg'
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return generateApiGatewayResponse(
        { message: 'Unsupported content type. Allowed: image/jpeg, image/png.', success: false },
        HTTP_CODES.BAD_REQUEST
      )
    }

    // Fixed key per user so a replacement overwrites in place (no orphaned objects).
    // The stored Content-Type — not the key extension — drives how the image is served.
    const objectKey = `${config.avatarObjectPrefix}/${event.userId}/profile`
    const command = new PutObjectCommand({
      Bucket: config.avatarBucketName,
      Key: objectKey,
      ContentType: contentType
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS })
    const fileUrl = `${config.avatarCdnBaseUrl}/${objectKey}`

    return generateApiGatewayResponse({ uploadUrl, fileUrl, success: true }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default getProfilePictureUploadUrlLambda
