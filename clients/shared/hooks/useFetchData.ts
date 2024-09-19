import apiClient from '@shared/config/apiConfig';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

const fetchData = async <T>(endpoint: string): Promise<T> => {
  const { data } = await apiClient.get<T>(endpoint);
  return data;
};

export const useFetchData = <T>(
  key: string,
  endpoint: string,
  id?: number | string
): UseQueryResult<T, Error> => {
  const queryKey = id ? [key, endpoint, id] : [key, endpoint];
  const url = id ? `${endpoint}/${id}` : endpoint;

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => fetchData<T>(url),
  });
};
