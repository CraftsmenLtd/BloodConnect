import { MapsHandler } from '../MapsHandler'
import { MapsService } from '../../../application/maps/MapsService'
import { GoogleMapsProvider } from '../providers/GoogleMaps'
import { APIResponse, PlaceAutocompleteResponse, GeocodeResponse } from '../../../application/maps/dto/Maps'

jest.mock('../../../application/maps/MapsService')

describe('MapsHandler', () => {
  const googleMapsProvider = new GoogleMapsProvider('test-api-key')
  const mapsServiceMock = new MapsService(googleMapsProvider) as jest.Mocked<MapsService>
  mapsServiceMock.getPlaceAutocomplete = jest.fn()
  mapsServiceMock.getGeocode = jest.fn()
  const mapsHandler = new MapsHandler(mapsServiceMock)

  describe('getPlaceAutocomplete', () => {
    it('should return place autocomplete results when given valid parameters', async() => {
      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [
            {
              description: 'Mirpur-1, Dhaka, Bangladesh',
              place_id: 'ChIJ3SnOb-nAVTcRTeapq1GezWw',
              structured_formatting: {
                main_text: 'Mirpur-1',
                secondary_text: 'Dhaka, Bangladesh'
              },
              terms: [
                {
                  value: 'Mirpur-1'
                },
                {
                  value: 'Dhaka'
                },
                {
                  value: 'Bangladesh'
                }
              ],
              types: [
                'neighborhood',
                'geocode',
                'political'
              ]
            }
          ],
          status: 'OK'
        }
      }
      mapsServiceMock.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const params = {
        input: 'Mirpur',
        types: 'geocode',
        countryCode: 'BD'
      }

      await expect(mapsHandler.getPlaceAutocomplete(params)).resolves.toEqual(mockResponse)
      expect(mapsServiceMock.getPlaceAutocomplete).toHaveBeenCalledWith(params)
    })
  })

  describe('getGeocode', () => {
    it('should return geocode results when given valid parameters', async() => {
      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.8223486,
                  lng: 90.36542039999999
                }
              }
            }
          ],
          status: 'OK'
        }
      }
      mapsServiceMock.getGeocode.mockResolvedValue(mockResponse)

      const params = { address: 'Mirpur' }

      await expect(mapsHandler.getGeocode(params)).resolves.toEqual(mockResponse)
      expect(mapsServiceMock.getGeocode).toHaveBeenCalledWith(params)
    })
  })
})
