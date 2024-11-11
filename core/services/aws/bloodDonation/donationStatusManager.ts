import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

import { DonationStatusManagerAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import { AcceptDonationRequestModel, AcceptedDonationFields } from '../../../application/technicalImpl/dbModels/AcceptDonationModel'
import { DonationStatusManagerService } from '../../../application/bloodDonationWorkflow/DonationStatusManagerService'

const donationStatusManagerRequest = new DonationStatusManagerService()

async function donationStatusManagerLambda(event: )
