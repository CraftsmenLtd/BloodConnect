import api from '../../config/apiConfig'
import { AxiosResponse } from 'axios'

export const get = async(url: string, params?: object): Promise<AxiosResponse> => api.get(url, { params })

export const getSingle = async(
  url: string,
  id: string | number,
  params?: object
): Promise<AxiosResponse> => api.get(`${url}/${id}`, { params })

export const post = async(url: string, data: object): Promise<AxiosResponse> => api.post(url, data)

export const put = async(
  url: string,
  id: string | number,
  data: object
): Promise<AxiosResponse> => api.put(`${url}/${id}`, data)

export const del = async(url: string, id: string | number): Promise<AxiosResponse> => api.delete(`${url}/${id}`)
