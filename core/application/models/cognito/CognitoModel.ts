export interface UpdateCognitoAttributes {
  userPoolId: string;
  username: string;
  attributes: Record<string, string>;
}
