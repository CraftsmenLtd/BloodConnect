import { useContext } from 'react'
import type { MyActivityContextType } from './MyActivityProvider'
import { MyActivityContext } from './MyActivityProvider'

export const useMyActivityContext = (): MyActivityContextType => {
  const context = useContext(MyActivityContext)
  if (context === null) {
    throw new Error('useMyActivityContext must be used within a MyActivityProvider')
  }

  return context
}
