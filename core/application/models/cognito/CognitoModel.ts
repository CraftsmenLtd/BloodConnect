export type UpdateCognitoAttributes = {
  userPoolId: string;
  username: string;
  attributes: Record<string, string>;
}
