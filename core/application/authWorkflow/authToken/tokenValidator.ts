import InvalidTokenError from "../../../application/authWorkflow/errors/InvalidTokenError";
import { verify } from "jsonwebtoken";
import { jwtSecret } from "./constants";

// TODO: make the T type specific to the type of jwt payload data. remove generic T and use specific return type
export default function validateToken<T extends object>(
  token: string
): T & { exp: number } {
  try {
    const decodedToken = verify(token, jwtSecret);
    return typeof decodedToken === "string"
      ? JSON.parse(decodedToken)
      : decodedToken;
  } catch (e) {
    throw new InvalidTokenError((e as Error).name);
  }
}
