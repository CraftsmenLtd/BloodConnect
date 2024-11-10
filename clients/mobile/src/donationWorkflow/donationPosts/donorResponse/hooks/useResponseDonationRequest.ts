import { useState } from 'react'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { SCREENS } from '../../../setup/constant/screens'
// import { respondToRequest } from '../../services/bloodService'

export const useResponseDonationRequest = () => {
  const [donorResponse, setDonorResponse] = useState({})
  const [responseError, setResponseError] = useState('')
  const navigation = useNavigation()

  const handleAccept = async() => {
    
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

// on accept: put data on BLOOD_REQ partition
// - request post id
// - seeker id
// - created at
// - acceptance time

// on ignore: change notification status
