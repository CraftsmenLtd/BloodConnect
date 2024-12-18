import { useCallback, useState, useRef, useEffect } from 'react'

interface UseFetchDataReturnType<DataFetchType> {
  executeFunction: (...args: any[]) => Promise<void>;
  loading: boolean;
  data: DataFetchType | null;
  error: string | null;
}

interface UseFetchDataProps {
  shouldExecuteOnMount?: boolean;
  parseError?: (error: unknown) => string;
  errorMessage?: string;
}

const useFetchData = <DataFetchType>(
  dataFetchFunction: (...args: any[]) => Promise<DataFetchType>,
  { shouldExecuteOnMount = false, parseError, errorMessage }: UseFetchDataProps = {}
): UseFetchDataReturnType<DataFetchType> => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DataFetchType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dataFetchFunctionRef = useRef(dataFetchFunction)

  const getErrorMessage = (error: unknown): string => {
    if (errorMessage !== undefined) return errorMessage
    if (parseError !== undefined) return parseError(error)
    if (error instanceof Error) return error.message
    return 'An unknown error occurred'
  }

  const executeFunction = useCallback(
    async(...args: any[]) => {
      setLoading(true)
      setError(null)
      try {
        const result = await dataFetchFunctionRef.current(...args)
        setData(result)
      } catch (error) {
        setData(null)
        setError(getErrorMessage(error))
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

  return { executeFunction, loading, data, error }
}

export default useFetchData
