import { PostConfirmationTriggerEvent } from "aws-lambda";
import { UserService } from "../../../../../application/userWorkflow/UserService";
import { UserDTO } from "../../../../../../commons/dto/UserDTO";
import DynamoDbTableOperations from "../../../commons/ddb/DynamoDbTableOperations";
import UserModel, {
  UserFields,
} from "../../../../../application/models2/dbModels/UserModel";
import { updateCognitoUserInfo } from "../../../commons/cognito/CognitoOperations";
import { sendAppUserWelcomeMail } from "../../../commons/ses/sesOperations";

async function postConfirmationLambda(
  event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> {
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
    return event;
  }

  const userService = new UserService();
  const userAttributes = {
    email: event.request.userAttributes.email,
    name: event.request.userAttributes.name ?? "",
    phone_number: event.request.userAttributes.phone_number ?? "",
  };

  const dbResponse = await userService.createNewUser(
    userAttributes,
    new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(new UserModel())
  );

  const cognitoAttributes = {
    "custom:userId": dbResponse.id.toString(),
  };
  await updateCognitoUserInfo({
    userPoolId: event.userPoolId,
    username: event.userName,
    attributes: cognitoAttributes,
  });

  const emailContent = userService.getAppUserWelcomeMail(userAttributes.name);
  await sendAppUserWelcomeMail({
    email: userAttributes.email,
    emailContent,
  });

  return event;
}

export default postConfirmationLambda;
