import api from '../../config/apiConfig'
import { AxiosResponse } from 'axios'

export const get = async(url: string, params?: object): Promise<AxiosResponse> => {
  return await api.get(url, { params })
}

export const getSingle = async(
  url: string,
  id: string | number,
  params?: object
): Promise<AxiosResponse> => {
  return await api.get(`${url}/${id}`, { params })
}

export const post = async(url: string, data: object): Promise<AxiosResponse> => {
  return await api.post(url, data)
}

export const put = async(
  url: string,
  id: string | number,
  data: object
): Promise<AxiosResponse> => {
  return await api.put(`${url}/${id}`, data)
}

export const del = async(url: string, id: string | number): Promise<AxiosResponse> => {
  return await api.delete(`${url}/${id}`)
}
