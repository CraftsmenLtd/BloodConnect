import { useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { SCREENS } from '../../../setup/constant/screens'
// import { respondToRequest } from '../../services/bloodService'

export const useResponseDonationRequest = () => {
    const [donorResponse, setDonorResponse] = useState({})
    const [responseError, setResponseError] = useState('')
    const navigation = useNavigation()

    const handleAccept = async () => {
        // try {
        //   const success = await respondToRequest(donorResponse)
        //   if (success) {
        //     navigation.dispatch(
        //       CommonActions.reset({
        //         index: 0,
        //         routes: [{ name: SCREENS.HOME }]
        //       })
        //     )
        //   } else {
        //     setResponseError('Unable to accept the request at this time.')
        //   }
        // } catch (error) {
        //   setResponseError('Error accepting the request.')
        // }
    }

    const handleIgnore = () => {
        setResponseError('')
        navigation.goBack()
    }

    return {
        donorResponse,
        handleAccept,
        handleIgnore,
        responseError
    }
}
