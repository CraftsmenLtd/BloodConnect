import type { ReactNode, Dispatch, SetStateAction } from 'react'
import { useState, useContext, createContext } from 'react'
import type { CompleteRequest } from '../constants/types'

type Data = { requests: CompleteRequest[] }
type DataContextType = [Data, Dispatch<SetStateAction<Data>>]

const defaultData: Data = { requests: [] }
// eslint-disable-next-line @typescript-eslint/no-empty-function
const defaultFunction: Dispatch<SetStateAction<Data>> = () => {}

const DataContext = createContext<DataContextType>([defaultData, defaultFunction])

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const state = useState<Data>(defaultData)

  return (
    <DataContext.Provider value={state}>
      {children}
    </DataContext.Provider>
  )
}

export const useGlobalData = () => useContext(DataContext)
