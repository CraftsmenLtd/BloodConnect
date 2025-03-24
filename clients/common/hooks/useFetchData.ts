import { useCallback, useState, useRef, useEffect } from 'react'

type UseFetchDataReturn<DataFetchType> = [
  (...args: unknown[]) => Promise<void>,
  boolean,
  DataFetchType | undefined,
  string | null
]

export default function useFetchData<DataFetchType> (
  dataFetchFunction: (...args: unknown[]) => Promise<DataFetchType>,
  executeNow = false
): UseFetchDataReturn<DataFetchType> {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DataFetchType | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const dataFetchFunctionRef = useRef(dataFetchFunction)

  const executeFunction = useCallback(
    async (...args: unknown[]): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const result = await dataFetchFunctionRef.current(...args)
        setData(result)
      } catch (err) {
        setData(undefined)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [dataFetchFunctionRef]
  )

  useEffect(() => {
    if (executeNow) void executeFunction()
  }, [])

  return [executeFunction, loading, data, error] as const
}
