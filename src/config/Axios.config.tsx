import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BASE_URL } from './config';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
