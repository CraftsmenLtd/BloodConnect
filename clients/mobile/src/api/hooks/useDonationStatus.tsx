import { extractErrorMessage } from '../../donationWorkflow/donationHelpers'
import { useFetchClient } from '../../setup/clients/useFetchClient'
import useFetchData from '../../setup/clients/useFetchData'

type DonationStatusPayload = {
  requestPostId: string;
  seekerId: string;
  createdAt: string;
  status: string;
}

const useDonationStatus = (): {
  executeStatusRequest: (...args: unknown[]) => Promise<void>;
  isLoading: boolean;
  error: string;
} => {
  const fetchClient = useFetchClient()

  const [
    executeStatusRequest,
    isLoading,
    ,
    error
  ] = useFetchData(async({
    requestPostId,
    seekerId,
    createdAt,
    status
  }: DonationStatusPayload): Promise<void> => {
    if (
      !requestPostId
      || !seekerId
      || !createdAt
      || !status
    ) {
      throw new Error('Missing some required data. Please try again')
    }

    const requestPayload: DonationStatusPayload = {
      requestPostId,
      seekerId,
      createdAt,
      status
    }

    try {
      const response = await fetchClient.patch<{statusText?: string}>(
        '/donations/responses',
        requestPayload
      )
      if (response.status !== 200) {
        const errorMessage = `Error: ${response.status} ${response.statusText ?? 'Unknown error'}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  })

  return {
    executeStatusRequest,
    isLoading,
    error
  }
}

export default useDonationStatus
