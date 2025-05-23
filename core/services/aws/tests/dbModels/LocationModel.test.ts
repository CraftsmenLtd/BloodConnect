import LocationModel, {
  LocationFields
} from '../../commons/ddbModels/LocationModel'
import { LocationDTO } from '../../../../../commons/dto/UserDTO'
import { BloodGroup } from '../../../../../commons/dto/DonationDTO'

describe('LocationModel Tests', () => {
  const locationModel = new LocationModel()

  describe('fromDto', () => {
    it('should convert LocationDTO to LocationFields correctly', () => {
      const locationDto: LocationDTO = {
        area: 'Banani',
        countryCode: 'BD',
        latitude: 23.7936,
        longitude: 90.4043,
        userId: 'user1',
        locationId: 'location1',
        bloodGroup: 'A+',
        availableForDonation: true,
        geohash: 'gcpuv',
        createdAt: '2023-10-01T00:00:00.000Z',
        lastVaccinatedDate: '2023-10-01T00:00:00.000Z'
      }

      const result = locationModel.fromDto(locationDto)

      expect(result).toEqual({
        PK: 'USER#user1',
        SK: 'LOCATION#location1',
        GSI1PK: 'LOCATION#BD-gcpu#BG#A+#DONATIONSTATUS#true',
        GSI1SK: 'gcpuv',
        createdAt: expect.any(String),
        area: 'Banani',
        latitude: 23.7936,
        longitude: 90.4043,
        lastVaccinatedDate: '2023-10-01T00:00:00.000Z'
      })
    })

    it('should set createdAt to the current date', () => {
      const locationDto: LocationDTO = {
        area: 'Banani',
        countryCode: 'BD',
        latitude: 23.7936,
        longitude: 90.4043,
        userId: 'user1',
        locationId: 'location1',
        bloodGroup: 'A+',
        availableForDonation: true,
        geohash: 'gcpuv',
        createdAt: '2023-10-01T00:00:00.000Z',
        lastVaccinatedDate: '2023-10-01T00:00:00.000Z'
      }

      const result = locationModel.fromDto(locationDto)
      expect(new Date(result.createdAt)).toBeInstanceOf(Date)
    })
  })

  describe('toDto', () => {
    it('should convert LocationFields to LocationDTO correctly', () => {
      const dbFields: LocationFields = {
        PK: 'USER#user1',
        SK: 'LOCATION#location1',
        GSI1PK: 'LOCATION#BD-gcpu#BG#A+#DONATIONSTATUS#true',
        GSI1SK: 'gcpuv',
        createdAt: '2023-10-01T00:00:00.000Z',
        area: 'Banani',
        latitude: 23.7936,
        longitude: 90.4043,
        lastVaccinatedDate: '2023-10-01T00:00:00.000Z'
      }

      const result = locationModel.toDto(dbFields)

      expect(result).toEqual({
        userId: 'user1',
        locationId: 'location1',
        countryCode: 'BD',
        bloodGroup: 'A+' as BloodGroup,
        availableForDonation: true,
        geohash: 'gcpuv',
        area: 'Banani',
        createdAt: '2023-10-01T00:00:00.000Z',
        latitude: 23.7936,
        longitude: 90.4043,
        lastVaccinatedDate: '2023-10-01T00:00:00.000Z'
      })
    })
  })

  describe('getPrimaryIndex', () => {
    it('should return the primary index definition', () => {
      const primaryIndex = locationModel.getPrimaryIndex()
      expect(primaryIndex).toEqual({
        partitionKey: 'PK',
        sortKey: 'SK'
      })
    })
  })

  describe('getIndexDefinitions', () => {
    it('should return empty index definitions', () => {
      const indexDefinitions = locationModel.getIndexDefinitions()
      expect(indexDefinitions).toEqual({
        GSI: {
          GSI1: {
            partitionKey: 'GSI1PK',
            sortKey: 'GSI1SK'
          }
        }
      })
    })
  })
})
