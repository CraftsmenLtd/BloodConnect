import { GENERIC_CODES } from "../../../commons/libs/constants/GenericCodes";
import UserOperationError from "./UserOperationError";
import {
  AvailableForDonation,
  LocationDTO,
  UserDetailsDTO,
  UserDTO,
} from "../../../commons/dto/UserDTO";
import { generateUniqueID } from "../utils/idGenerator";
import { GenericMessage } from "../../../commons/dto/MessageDTO";
import {
  getEmailVerificationMessage,
  getPasswordResetVerificationMessage,
  getAppUserWelcomeMailMessage,
} from "./userMessages";
import Repository from "../models2/policies/repositories/Repository";
import { UserAttributes, UpdateUserAttributes } from "./Types";
import { generateGeohash } from "../utils/geohash";
import {
  QueryConditionOperator,
  QueryInput,
} from "../models2/policies/repositories/QueryTypes";
import LocationModel, {
  LocationFields,
} from "../models2/dbModels/LocationModel";
import { differenceInYears, differenceInMonths } from "date-fns";
import { BloodGroup } from "../../../commons/dto/DonationDTO";

export class UserService {
  async createNewUser(
    userAttributes: UserAttributes,
    userRepository: Repository<UserDTO>
  ): Promise<UserDTO> {
    try {
      return userRepository.create({
        id: generateUniqueID(),
        email: userAttributes.email,
        name: userAttributes.name,
        phone: userAttributes.phone_number,
      });
    } catch (error) {
      throw new UserOperationError(
        `Failed to create new user. Error: ${error}`,
        GENERIC_CODES.ERROR
      );
    }
  }

  getPostSignUpMessage(userName: string, securityCode: string): GenericMessage {
    return getEmailVerificationMessage(userName, securityCode);
  }

  getForgotPasswordMessage(
    userName: string,
    securityCode: string
  ): GenericMessage {
    return getPasswordResetVerificationMessage(userName, securityCode);
  }

  getAppUserWelcomeMail(userName: string): GenericMessage {
    return getAppUserWelcomeMailMessage(userName);
  }

  async updateUser(
    userAttributes: UpdateUserAttributes,
    userRepository: Repository<UserDetailsDTO>,
    locationRepository: Repository<LocationDTO>,
    model: LocationModel
  ): Promise<string> {
    try {
      const { userId, preferredDonationLocations, ...restAttributes } =
        userAttributes;
      const updateData: Partial<UserDetailsDTO> = {
        ...restAttributes,
        id: userId,
        updatedAt: new Date().toISOString(),
      };

      updateData.age = this.calculateAge(userAttributes.dateOfBirth);
      updateData.availableForDonation = this.calculateAvailableForDonation(
        userAttributes.lastDonationDate,
        userAttributes.availableForDonation
      );

      await userRepository.update(updateData);
      await this.updateUserLocation(
        model,
        userId,
        locationRepository,
        preferredDonationLocations,
        updateData
      );
      return "Updated your Profile info";
    } catch (error) {
      throw new UserOperationError(
        `Failed to update user. Error: ${error}`,
        GENERIC_CODES.ERROR
      );
    }
  }

  private calculateAvailableForDonation(
    lastDonationDate: string,
    availableForDonation: AvailableForDonation
  ): AvailableForDonation {
    if (lastDonationDate !== "") {
      const donationDate = new Date(lastDonationDate);
      const currentDate = new Date();

      if (!isNaN(donationDate.getTime())) {
        const donationMonths = differenceInMonths(currentDate, donationDate);
        return donationMonths >
          Number(process.env.AFTER_DONATION_UNAVAILABLE_PERIOD)
          ? "yes"
          : "no";
      }
    }
    return availableForDonation;
  }

  private calculateAge(dateOfBirth: string): number | undefined {
    if (dateOfBirth !== "") {
      const birthDate = new Date(dateOfBirth);
      const currentDate = new Date();

      if (!isNaN(birthDate.getTime())) {
        const age = differenceInYears(currentDate, birthDate);
        return age;
      }
    }
  }

  private async updateUserLocation(
    model: LocationModel,
    userId: string,
    locationRepository: Repository<LocationDTO, Record<string, unknown>>,
    preferredDonationLocations: LocationDTO[],
    userAttributes: Partial<UserDetailsDTO>
  ): Promise<void> {
    const primaryIndex = model.getPrimaryIndex();
    const query: QueryInput<LocationFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `USER#${userId}`,
      },
    };

    if (primaryIndex.sortKey != null) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: "LOCATION#",
      };
    }

    const existingLocations = await locationRepository.query(
      query as QueryInput<Record<string, unknown>>
    );
    for (const location of existingLocations.items) {
      await locationRepository.delete(
        `USER#${userId}`,
        `LOCATION#${location.locationId}`
      );
    }

    if (preferredDonationLocations != null) {
      for (const location of preferredDonationLocations) {
        const locationData: LocationDTO = {
          userId: `${userId}`,
          locationId: generateUniqueID(),
          area: location.area,
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
          geohash: generateGeohash(location.latitude, location.longitude),
          bloodGroup: userAttributes.bloodGroup as BloodGroup,
          availableForDonation:
            userAttributes.availableForDonation as AvailableForDonation,
          lastVaccinatedDate: `${userAttributes.lastVaccinatedDate}`,
          createdAt: new Date().toISOString(),
        };
        await locationRepository.create(locationData);
      }
    }
  }

  async getDeviceSnsEndpointArn(
    userId: string,
    userRepository: Repository<UserDetailsDTO>
  ): Promise<string> {
    try {
      const userProfile = await userRepository.getItem(
        `USER#${userId}`,
        "PROFILE"
      );
      if (userProfile?.snsEndpointArn == null) {
        throw new Error("User has no registered device for notifications");
      }

      return userProfile.snsEndpointArn;
    } catch (error) {
      throw new UserOperationError(
        `Failed to update user. Error: ${error}`,
        GENERIC_CODES.ERROR
      );
    }
  }
}
