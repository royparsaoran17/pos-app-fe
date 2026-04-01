import axios from 'axios'
import { useToast } from '~/composables/useToast'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:9005'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const storeId = localStorage.getItem('pos_store_id')
  if (storeId) {
    config.headers['X-Store-Id'] = storeId
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const toast = useToast()

    if (!error.response) {
      toast.error('Koneksi terputus')
      return Promise.reject(error)
    }

    const status = error.response.status

    if (status === 401) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      window.location.href = '/login'
    } else if (status === 403) {
      toast.error('Akses ditolak')
    } else if (status >= 500) {
      toast.error('Server error, coba lagi')
    }

    return Promise.reject(error)
  }
)

export default http
