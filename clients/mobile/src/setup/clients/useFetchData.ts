import { useCallback, useState, useRef, useEffect } from 'react'

type UseFetchDataProps = {
  shouldExecuteOnMount?: boolean;
  parseError?: (error: unknown) => string;
  errorMessage?: string;
}

const useFetchData = <DataFetchType>(
  dataFetchFunction: (...args: unknown[]) => Promise<DataFetchType>,
  { shouldExecuteOnMount = false, parseError, errorMessage }: UseFetchDataProps = {}
): [executeFunction: (...args: unknown[]) => Promise<void>,
    loading: boolean, data: DataFetchType | null, error: string | null] => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DataFetchType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dataFetchFunctionRef = useRef(dataFetchFunction)
  const getErrorMessage = (error: unknown): string => {
    if (errorMessage !== undefined) return errorMessage
    if (parseError !== undefined) {
      try {
        return parseError(error)
      } catch (parseErrorException) {
        return 'Failed to parse error'
      }
    }
    if (error instanceof Error) return error.message
    return 'An unknown error occurred'
  }

  const executeFunction = useCallback(
    async(...args: unknown[]) => {
      setLoading(true)
      setError(null)
      try {
        const result = await dataFetchFunctionRef.current(...args)
        setData(result)
      } catch (error) {
        console.error(error)
        const message = getErrorMessage(error)
        setData(null)
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (shouldExecuteOnMount) {
      void executeFunction()
    }
  }, [shouldExecuteOnMount, executeFunction])

  return [executeFunction, loading, data, error]
}

export default useFetchData
