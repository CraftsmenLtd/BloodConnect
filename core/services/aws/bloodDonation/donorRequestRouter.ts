import { SQSEvent, SQSRecord } from 'aws-lambda'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonorRoutingAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { BloodDonationModel, DonationFields } from '../../../application/technicalImpl/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import StepFunctionOperations from '../commons/stepFunction/StepFunctionOperations'

const bloodDonationService = new BloodDonationService()

async function donorRequestRouter(event: SQSEvent): Promise<void> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('An unknown error occurred')
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body = typeof record.body === 'string' && record.body.trim() !== ''
    ? JSON.parse(record.body)
    : {}

  const donorRoutingAttributes: DonorRoutingAttributes = {
    seekerId: body.seekerId,
    requestPostId: body.requestPostId
  }

  await bloodDonationService.routeDonorRequest(
    donorRoutingAttributes,
    new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(new BloodDonationModel()),
    new StepFunctionOperations()
  )
}

export default donorRequestRouter
