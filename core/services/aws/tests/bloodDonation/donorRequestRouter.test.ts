import { SQSEvent } from 'aws-lambda'
import donorRequestRouter from '../../donorSearch/donorRequestRouter'
import { DonorSearchService } from '../../../../application/bloodDonationWorkflow/DonorSearchService'
import StepFunctionOperations from '../../commons/stepFunction/StepFunctionOperations'
import DynamoDbTableOperations from '../../commons/ddb/DynamoDbTableOperations'
import { donorRoutingAttributesMock } from '../../../../application/tests/mocks/mockDonationRequestData'
import { UserService } from '../../../../application/userWorkflow/UserService'
import { mockUserDetailsWithStringId } from '../../../../application/tests/mocks/mockUserData'

jest.mock('../../../../application/bloodDonationWorkflow/DonorSearchService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../commons/stepFunction/StepFunctionOperations')
jest.mock('../../commons/ddb/DynamoDbTableOperations')

describe('donorRequestRouter', () => {
  const mockEvent: SQSEvent = {
    Records: [
      {
        messageId: '1',
        receiptHandle: '1',
        body: JSON.stringify({
          PK: `SEEKER#${donorRoutingAttributesMock.seekerId}`,
          SK: `POST#${donorRoutingAttributesMock.createdAt}#${donorRoutingAttributesMock.requestPostId}`,
          bloodQuantity: donorRoutingAttributesMock.bloodQuantity,
          requestedBloodGroup: donorRoutingAttributesMock.requestedBloodGroup,
          urgencyLevel: donorRoutingAttributesMock.urgencyLevel,
          city: donorRoutingAttributesMock.city,
          location: donorRoutingAttributesMock.location,
          patientName: donorRoutingAttributesMock.patientName,
          donationDateTime: donorRoutingAttributesMock.donationDateTime,
          contactNumber: donorRoutingAttributesMock.contactNumber,
          shortDescription: donorRoutingAttributesMock.shortDescription,
          geohash: donorRoutingAttributesMock.geohash,
          transportationInfo: donorRoutingAttributesMock.transportationInfo
        }),
        attributes: {
          ApproximateReceiveCount: '',
          SentTimestamp: '',
          SenderId: '',
          ApproximateFirstReceiveTimestamp: ''
        },
        messageAttributes: {},
        md5OfBody: 'md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:region:123456789012:queue-name',
        awsRegion: 'region'
      }
    ]
  }

  const mockDonorSearchService: jest.MockedClass<typeof DonorSearchService> = DonorSearchService as jest.MockedClass<typeof DonorSearchService>
  const mockUserService: jest.MockedClass<typeof UserService> = UserService as jest.MockedClass<typeof UserService>

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should process all records in the SQSEvent with correct PK and SK parsing', async() => {
    const mockResponse = 'Blood donation created successfully'
    mockDonorSearchService.prototype.routeDonorRequest.mockResolvedValue(mockResponse)
    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)

    await donorRequestRouter(mockEvent)

    expect(mockDonorSearchService.prototype.routeDonorRequest).toHaveBeenCalledTimes(mockEvent.Records.length)
    expect(mockDonorSearchService.prototype.routeDonorRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        seekerId: donorRoutingAttributesMock.seekerId,
        requestPostId: donorRoutingAttributesMock.requestPostId,
        createdAt: donorRoutingAttributesMock.createdAt,
        patientName: donorRoutingAttributesMock.patientName,
        requestedBloodGroup: donorRoutingAttributesMock.requestedBloodGroup,
        bloodQuantity: donorRoutingAttributesMock.bloodQuantity,
        urgencyLevel: donorRoutingAttributesMock.urgencyLevel,
        city: donorRoutingAttributesMock.city,
        location: donorRoutingAttributesMock.location,
        geohash: donorRoutingAttributesMock.geohash,
        donationDateTime: donorRoutingAttributesMock.donationDateTime,
        contactNumber: donorRoutingAttributesMock.contactNumber,
        transportationInfo: donorRoutingAttributesMock.transportationInfo,
        shortDescription: donorRoutingAttributesMock.shortDescription
      }),
      'arn:aws:sqs:region:123456789012:queue-name',
      mockUserDetailsWithStringId,
      expect.any(DynamoDbTableOperations),
      expect.any(StepFunctionOperations)
    )

    expect(mockUserService.prototype.getUser).toHaveBeenCalledWith(
      donorRoutingAttributesMock.seekerId,
      expect.any(DynamoDbTableOperations)
    )
  })

  it('should handle invalid JSON in the SQS message body', async() => {
    const invalidEvent: SQSEvent = {
      Records: [
        {
          messageId: '1',
          receiptHandle: '1',
          body: '{ invalid json }',
          attributes: {
            ApproximateReceiveCount: '',
            SentTimestamp: '',
            SenderId: '',
            ApproximateFirstReceiveTimestamp: ''
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:123456789012:queue',
          awsRegion: 'region'
        }
      ]
    }

    await expect(donorRequestRouter(invalidEvent)).rejects.toThrow()
    expect(mockDonorSearchService.prototype.routeDonorRequest).not.toHaveBeenCalled()
  })

  it('should throw an error if routeDonorRequest fails', async() => {
    const errorMessage = 'Failed to route donor request'
    mockDonorSearchService.prototype.routeDonorRequest.mockRejectedValue(new Error(errorMessage))
    mockUserService.prototype.getUser.mockResolvedValue(mockUserDetailsWithStringId)

    await expect(donorRequestRouter(mockEvent)).rejects.toThrow(errorMessage)
    expect(mockDonorSearchService.prototype.routeDonorRequest).toHaveBeenCalled()
    expect(mockUserService.prototype.getUser).toHaveBeenCalled()
  })

  it('should throw an error if getUser fails', async() => {
    const errorMessage = 'Failed to retrieve user profile'
    mockUserService.prototype.getUser.mockRejectedValue(new Error(errorMessage))

    await expect(donorRequestRouter(mockEvent)).rejects.toThrow(errorMessage)
    expect(mockUserService.prototype.getUser).toHaveBeenCalled()
    expect(mockDonorSearchService.prototype.routeDonorRequest).not.toHaveBeenCalled()
  })
})
