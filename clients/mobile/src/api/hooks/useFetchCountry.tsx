import { useEffect, useState } from 'react'
import { extractErrorMessage } from '../../donationWorkflow/donationHelpers'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import { countryAvailability } from '../../setup/navigation/services'

type CountryInfo = {
  available: boolean;
  countryCode: string;
  countryName: string;
}

const useFetchCountry = (): {
  countryInfo: CountryInfo;
  loading: boolean;
  error: string | null;
} => {
  const fetchClient = useFetchClient()
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountryAvailability = async() => {
      setLoading(true)
      setError(null)
      try {
        const response = await countryAvailability({}, fetchClient)

        const data = {
          available: response.data.available,
          countryCode: response.data.countryCode,
          countryName: response.data.countryName,
        }

        setCountryInfo(data)
      } catch (err) {
        console.error(err)
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    void fetchCountryAvailability()
  }, [])

  return {
    countryInfo,
    loading,
    error
  }
}

export default useFetchCountry
