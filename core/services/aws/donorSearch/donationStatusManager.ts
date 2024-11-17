import { SQSEvent, SQSRecord } from "aws-lambda";
import { BloodDonationService } from "../../../application/bloodDonationWorkflow/BloodDonationService";
import { DonorRoutingAttributes } from "../../../application/bloodDonationWorkflow/Types";
import {
  AcceptedDonationDTO,
  DonationDTO,
} from "../../../../commons/dto/DonationDTO";
import {
  BloodDonationModel,
  DonationFields,
} from "../../../application/models/dbModels/BloodDonationModel";
import DynamoDbTableOperations from "../commons/ddb/DynamoDbTableOperations";
import {
  AcceptedDonationFields,
  AcceptDonationRequestModel,
} from "../../../application/models/dbModels/AcceptDonationModel";

const bloodDonationService = new BloodDonationService();

async function donationStatusManager(
  event: SQSEvent
): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record);
    }
    return { status: "Success" };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("An unknown error occurred");
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body =
    typeof record.body === "string" && record.body.trim() !== ""
      ? JSON.parse(record.body)
      : {};

  const primaryIndex: string = body?.PK;
  const secondaryIndex: string = body?.SK;
  const createdAt: string = body?.createdAt;
  if (primaryIndex === "" || secondaryIndex === "") {
    throw new Error("Missing PK or SK in the DynamoDB record");
  }

  const donorRoutingAttributes: DonorRoutingAttributes = {
    seekerId: primaryIndex.split("#")[1],
    requestPostId: secondaryIndex.split("#")[1],
    createdAt,
  };

  await bloodDonationService.updateDonationStatus(
    donorRoutingAttributes,
    new DynamoDbTableOperations<
      DonationDTO,
      DonationFields,
      BloodDonationModel
    >(new BloodDonationModel()),
    new DynamoDbTableOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
    >(new AcceptDonationRequestModel())
  );
}

export default donationStatusManager;
