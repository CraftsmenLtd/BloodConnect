import { useState } from 'react'
import { useRoute } from '@react-navigation/native'
import { DonorConfirmationRouteProp } from '../../../setup/navigation/navigationTypes'

const useDonorConfirmation = (): any => {
  const { donors, requestPostId, createdAt } = useRoute<DonorConfirmationRouteProp>().params
  const [selectedDonor, setSelectedDonor] = useState<string[]>([])

  const selectDonorHandler = (donorId: string): void => {
    if (selectedDonor.includes(donorId)) {
      setSelectedDonor(selectedDonor.filter(id => id !== donorId))
    } else {
      setSelectedDonor([...selectedDonor, donorId])
    }
  }

  return { donors, selectDonorHandler, selectedDonor, requestPostId, createdAt }
}

export default useDonorConfirmation
