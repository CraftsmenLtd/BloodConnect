import validateToken from "../../../application/authWorkflow/authToken/tokenValidator";
import {
  getRefreshToken,
  getBearerAuthToken,
  getAuthToken,
  getAuthTokenFromRefreshToken,
  getPayloadFromBearerToken,
} from "../../authWorkflow/authWorkflowUseCases";
import { getDaysInSecs } from "../../../../commons/libs/dateTimeUtils";
import { JwtPayload } from "jsonwebtoken";
import { ApplicationLogger } from "../../../../commons/libs/logger/ApplicationLogger";

describe("authWorkflowUseCases", () => {
  const tokenPayload = { email: "a@b.com", username: "test", role: "admin" };

  describe("getTokens", () => {
    describe("getRefreshToken", () => {
      it("should return token with validity of 30 days for mobile client", () => {
        const refreshToken = getRefreshToken(tokenPayload, "mobile");
        const sevenDaysValidToken =
          Math.floor(Date.now() / 1000) + getDaysInSecs(30);
        const decodedPayload = validateToken<{ exp: number }>(refreshToken);
        expect(decodedPayload.exp).toBe(sevenDaysValidToken);
      });

      it("should return token with validity of 7 days for web client", () => {
        const refreshToken = getRefreshToken(tokenPayload, "web");
        const sevenDaysValidToken =
          Math.floor(Date.now() / 1000) + getDaysInSecs(7);
        const decodedPayload = validateToken<{ exp: number }>(refreshToken);
        expect(decodedPayload.exp).toBe(sevenDaysValidToken);
      });
    });

    describe("getAuthToken", () => {
      const getExpiryOfJsonToken = (
        decodedPayload: string | JwtPayload
      ): number =>
        typeof decodedPayload === "string"
          ? JSON.parse(decodedPayload).exp
          : decodedPayload.exp;

      it("should generate a valid jwt token valid till day end", () => {
        const token = getAuthToken(tokenPayload);
        const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000);
        const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token));
        expect(decodedPayloadExpiry).toBe(dayEnd);
      });

      it("should generate a valid jwt token with mentioned validity if positive expiresIn passed", () => {
        const token = getAuthToken(tokenPayload, 5);
        const fiveSecsLaterTime = Math.floor(Date.now() / 1000) + 5;
        const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token));
        expect(decodedPayloadExpiry).toBe(fiveSecsLaterTime);
      });

      it("should generate a valid jwt token with validity until day end if 0 expiresIn is passed", () => {
        const token = getAuthToken(tokenPayload, -5);
        const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000);
        const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token));
        expect(decodedPayloadExpiry).toBe(dayEnd);
      });

      it("should generate a valid jwt token with validity until day end if negative expiresIn is passed", () => {
        const token = getAuthToken(tokenPayload, 0);
        const dayEnd = Math.floor(new Date().setUTCHours(23, 59, 59) / 1000);
        const decodedPayloadExpiry = getExpiryOfJsonToken(validateToken(token));
        expect(decodedPayloadExpiry).toBe(dayEnd);
      });
    });
  });

  describe("getBearerAuthToken", () => {
    it("should return token if contains Bearer token", () => {
      expect(getBearerAuthToken("Bearer token")).toBe("token");
    });

    it("should return undefined if passed empty string", () => {
      expect(getBearerAuthToken("")).toBe(undefined);
    });

    it("should return if passed ill formatted bearer token string", () => {
      expect(getBearerAuthToken("BearerToken")).toBe(undefined);
    });
  });

  describe("getAuthTokenFromRefreshToken and getPayloadFromBearerToken", () => {
    let loggerSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerSpy = jest.spyOn(ApplicationLogger.prototype, "info");
    });

    describe("getAuthTokenFromRefreshToken", () => {
      it("should log error and return undefined for invalid token", () => {
        const newTokenFromRefreshToken =
          getAuthTokenFromRefreshToken("ascascsac");

        expect(newTokenFromRefreshToken).toBe(undefined);
        expect(loggerSpy).toHaveBeenCalled();
      });

      it("should log error and return undefined for undefined token", () => {
        const newTokenFromRefreshToken =
          getAuthTokenFromRefreshToken(undefined);

        expect(newTokenFromRefreshToken).toBe(undefined);
        expect(loggerSpy).toHaveBeenCalled();
      });

      it("should return a valid auth token for valid refresh token from mobile client", () => {
        const validRefreshToken = getRefreshToken(tokenPayload, "mobile");
        const newTokenFromRefreshToken =
          getAuthTokenFromRefreshToken(validRefreshToken);

        expect(newTokenFromRefreshToken).toBeDefined();
      });

      it("should return a valid auth token for valid refresh token from web client", () => {
        const validRefreshToken = getRefreshToken(tokenPayload, "web");
        const newTokenFromRefreshToken =
          getAuthTokenFromRefreshToken(validRefreshToken);

        expect(newTokenFromRefreshToken).toBeDefined();
      });
    });

    describe("getPayloadFromBearerToken", () => {
      it("should log error and return undefined for invalid bearer token", () => {
        const tokenPayload = getPayloadFromBearerToken("Bearer ascascsac");

        expect(tokenPayload).toBe(undefined);
        expect(loggerSpy).toHaveBeenCalled();
      });

      it("should log error and return undefined for invalid bearer token", () => {
        const tokenPayload = getPayloadFromBearerToken("Bearer");

        expect(tokenPayload).toBe(undefined);
        expect(loggerSpy).toHaveBeenCalled();
      });

      it("should log error and return undefined for invalid bearer token", () => {
        const validAuthToken = getAuthToken(tokenPayload);
        const payloadFromBearerToken = getPayloadFromBearerToken(
          `Bearer${validAuthToken}`
        );

        expect(payloadFromBearerToken).toBe(undefined);
        expect(loggerSpy).toHaveBeenCalled();
      });

      it("should return payload for valid bearer token", () => {
        const validAuthToken = getAuthToken(tokenPayload);
        const { email, username, role } = getPayloadFromBearerToken(
          `Bearer ${validAuthToken}`
        ) as typeof tokenPayload;

        expect(email).toBe(tokenPayload.email);
        expect(username).toBe(tokenPayload.username);
        expect(role).toBe(tokenPayload.role);
      });
    });

    afterEach(() => {
      loggerSpy.mockRestore();
    });
  });
});
