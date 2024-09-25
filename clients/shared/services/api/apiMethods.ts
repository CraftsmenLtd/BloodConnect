import api from '@web/config/apiConfig'
import { AxiosResponse } from 'axios'

export const get = async(url: string, params?: object): Promise<AxiosResponse> => {
  const response = await api.get(url, { params })
  return response
}

export const getSingle = async(
  url: string,
  id: string | number,
  params?: object
): Promise<AxiosResponse> => {
  const response = await api.get(`${url}/${id}`, { params })
  return response
}

export const post = async(url: string, data: object): Promise<AxiosResponse> => {
  const response = await api.post(url, data)
  return response
}

export const put = async(
  url: string,
  id: string | number,
  data: object
): Promise<AxiosResponse> => {
  const response = await api.put(`${url}/${id}`, data)
  return response
}

export const del = async(url: string, id: string | number): Promise<AxiosResponse> => {
  const response = await api.delete(`${url}/${id}`)
  return response
}
