import { HttpClient } from '../technicalImpl/clients/apiClient'
import { GeoLocation } from './GeoLocation'

export class OpenStreetMapService implements GeoLocation {
  private readonly client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async getCoordinatesByPlaceName(place: string): Promise<{ lat: string; lon: string }> {
    const response = await this.client.get<any>('/search', {
      q: place,
      format: 'json'
    })

    if (response !== null || response.length === 0) {
      throw new Error(`No results found for place: ${place}`)
    }

    const { lat, lon } = response[0]
    return { lat, lon }
  }
}
